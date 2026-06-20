package com.files.rent_auth_module.application.emailVerification.orchestator;

import java.time.Instant;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.files.rent_auth_module.application.auth.exceptions.AuthExceptions;
import com.files.rent_auth_module.application.auth.ports.AuthRepositoryPort;
import com.files.rent_auth_module.application.emailVerification.command.actions.EmailForwardCommand;
import com.files.rent_auth_module.application.emailVerification.command.actions.EmailVerificationCommand;
import com.files.rent_auth_module.application.emailVerification.command.response.EmailForwardCommandResult;
import com.files.rent_auth_module.application.emailVerification.command.response.EmailVerificationCommandResult;
import com.files.rent_auth_module.application.emailVerification.exceptions.EmailVerificationCooldownException;
import com.files.rent_auth_module.application.emailVerification.exceptions.EmailVerificationIsExpiredException;
import com.files.rent_auth_module.application.emailVerification.exceptions.NotEmailVerificationException;
import com.files.rent_auth_module.application.emailVerification.ports.EmailVerificationPort;
import com.files.rent_auth_module.application.emailVerification.ports.ResendPort;
import com.files.rent_auth_module.application.emailVerification.usecases.EmailVerificationUseCase;
import com.files.rent_auth_module.config.GenerateCodeService;
import com.files.rent_auth_module.domain.auth.UserModel;
import com.files.rent_auth_module.domain.emailVerification.model.EmailVerificationModel;
import com.files.rent_auth_module.domain.emailVerification.service.EmailVerificationService;
import com.files.rent_auth_module.shared.enums.StatusEmail;

import reactor.core.publisher.Mono;

@Service
public class EmailVerificationUseCaseImp implements EmailVerificationUseCase {
    private final ResendPort resendPort;
    private final EmailVerificationPort emailVerificationPort;
    private final GenerateCodeService generateCodeService;
    private final AuthRepositoryPort authRepositoryPort;

    @Value("${resend.expiration-time}")
    private Long expirationTimeEmail;

    @Value("${resend.expiration-forward-time}")
    private Long forwardTime;

    public EmailVerificationUseCaseImp(ResendPort resendPort,
            EmailVerificationPort emailVerificationPort,
            GenerateCodeService generateCodeService,
            AuthRepositoryPort authRepositoryPort) {
        this.resendPort = resendPort;
        this.emailVerificationPort = emailVerificationPort;
        this.generateCodeService = generateCodeService;
        this.authRepositoryPort = authRepositoryPort;
    }

    @Transactional
    @Override
    public Mono<Void> sendEmailVerificationToken(UUID userId, String email) {
        String code = generateCodeService.sha256(generateCodeService.randomBase64(128));
        Instant expirationTime = Instant.now().plusSeconds(expirationTimeEmail);

        EmailVerificationModel emailModel = EmailVerificationModel.createDraft(userId, code, expirationTime);

        return Mono.when(emailVerificationPort.save(emailModel), resendPort.sendEmail(email, code)).then();
    }

    @Override
    public Mono<EmailForwardCommandResult> forwardToken(EmailForwardCommand cmd) {
        return authRepositoryPort.findById(cmd.userId())
                .switchIfEmpty(Mono.error(AuthExceptions.userNotFound()))
                .zipWhen(user -> emailVerificationPort
                        .findFirstByUserIdOrderByCreatedAtDesc(user.getId())
                        .switchIfEmpty(Mono.error(new NotEmailVerificationException())))
                .flatMap(tuple -> {
                    UserModel user = tuple.getT1();
                    EmailVerificationModel emailVerificationModel = tuple.getT2();

                    if (emailVerificationModel.getCreateAt()
                            .plusSeconds(forwardTime)
                            .isAfter(Instant.now())) {
                        return Mono.error(new EmailVerificationCooldownException());
                    }

                    return emailVerificationPort
                            .revockedAllEmailVerification(user.getId())
                            .then(sendEmailVerificationToken(
                                    user.getId(),
                                    user.getEmail().trim()))
                            .thenReturn(new EmailForwardCommandResult("email forward!"));
                });
    }

    @Override
    public Mono<EmailVerificationCommandResult> verificationToken(EmailVerificationCommand cmd) {
        return emailVerificationPort.findByToken(cmd.token())
                .switchIfEmpty(Mono.error(new NotEmailVerificationException()))
                .doOnNext(EmailVerificationService::validateEmailVerification)
                .zipWhen(token -> authRepositoryPort.findById(token.getUserId())
                        .switchIfEmpty(Mono.error(AuthExceptions.userNotFound())))
                .flatMap(tuple -> {
                    EmailVerificationModel token = tuple.getT1();
                    UserModel user = tuple.getT2();

                    if (token.getExpiredAt().isBefore(Instant.now())) {
                        EmailVerificationModel revockedCurrentEmail = EmailVerificationModel
                                .changeStatusEmail(token, StatusEmail.REVOKED);

                        emailVerificationPort.save(revockedCurrentEmail);

                        return Mono.error(new EmailVerificationIsExpiredException());
                    }

                    EmailVerificationModel consumed = new EmailVerificationModel.EmailVerificationBuilder()
                            .id(token.getId())
                            .userId(token.getUserId())
                            .token(token.getToken())
                            .statusEmail(StatusEmail.CONSUMED)
                            .consumedAt(token.getConsumedAt())
                            .createAt(token.getCreateAt())
                            .expiredAt(token.getExpiredAt())
                            .build();

                    // actualizamos el usuario para que pueda iniciar session
                    UserModel changeEnabledUser = UserModel.changeStatus(user, true);

                    return Mono.when(emailVerificationPort.save(consumed), authRepositoryPort.save(changeEnabledUser))
                            .thenReturn(new EmailVerificationCommandResult("email verification successfull!"));
                });
    }
}
