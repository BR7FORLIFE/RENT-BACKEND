package com.files.rent_auth_module.application.auth.orchestator;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.files.rent_auth_module.application.auth.command.actions.LoginUserUserCommand;
import com.files.rent_auth_module.application.auth.command.actions.RegisterUserCommand;
import com.files.rent_auth_module.application.auth.command.response.LoginUserCommandResult;
import com.files.rent_auth_module.application.auth.command.response.RegisterUserCommandResult;
import com.files.rent_auth_module.application.auth.exceptions.AuthExceptions;
import com.files.rent_auth_module.application.auth.ports.AuthRepositoryPort;
import com.files.rent_auth_module.application.auth.usecases.AuthUseCase;
import com.files.rent_auth_module.application.emailVerification.ports.EmailVerificationPort;
import com.files.rent_auth_module.application.emailVerification.usecases.EmailVerificationUseCase;
import com.files.rent_auth_module.application.refreshToken.ports.RefreshTokenRepositoryPort;
import com.files.rent_auth_module.application.refreshToken.usecases.RefreshTokenUseCase;
import com.files.rent_auth_module.domain.auth.UserModel;

import reactor.core.publisher.Mono;

@Service
public class AuthUseCaseImp implements AuthUseCase {

    private final AuthRepositoryPort authRepositoryPort;
    private final EmailVerificationUseCase emailVerificationUseCase;
    private final EmailVerificationPort emailVerificationPort;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenUseCase refreshTokenUseCase;
    private final RefreshTokenRepositoryPort refreshTokenRepositoryPort;

    public AuthUseCaseImp(AuthRepositoryPort authRepositoryPort,
            EmailVerificationUseCase emailVerificationUseCase,
            EmailVerificationPort emailVerificationPort,
            PasswordEncoder passwordEncoder,
            RefreshTokenUseCase refreshTokenUseCase,
            RefreshTokenRepositoryPort refreshTokenRepositoryPort) {
        this.authRepositoryPort = authRepositoryPort;
        this.passwordEncoder = passwordEncoder;
        this.emailVerificationUseCase = emailVerificationUseCase;
        this.emailVerificationPort = emailVerificationPort;
        this.refreshTokenUseCase = refreshTokenUseCase;
        this.refreshTokenRepositoryPort = refreshTokenRepositoryPort;
    }

    @Override
    public Mono<RegisterUserCommandResult> register(RegisterUserCommand cmd) {
        return authRepositoryPort.findByEmail(cmd.email())
                .hasElement()
                .flatMap(exists -> {
                    if (exists) {
                        return Mono.error(AuthExceptions.userAlreadyExistsException());
                    }

                    UserModel user = new UserModel.UserBuilderDraft()
                            .username(cmd.username())
                            .password(passwordEncoder.encode(cmd.password()))
                            .email(cmd.email())
                            .cellphone(cmd.cellphone())
                            .fullname(cmd.fullname())
                            .identificationNumber(cmd.identificationNumber())
                            .identificationType(cmd.identificationType())
                            .build();

                    // retornamos la respuesta y enviamos el email de verificacion
                    return authRepositoryPort.save(user)
                            .flatMap(saved -> emailVerificationUseCase
                                    .sendEmailVerificationToken(saved.getId(), saved.getEmail())
                                    .thenReturn(
                                            new RegisterUserCommandResult(
                                                    saved.getId(),
                                                    "usuario creado satisfactoriamente, por favor verifica tu email para continuar!"))
                                    .onErrorResume(error -> Mono.when(
                                            authRepositoryPort.deleteByUserId(saved.getId()),
                                            refreshTokenRepositoryPort.deleteRefreshTokenByUserId(saved.getId()),
                                            emailVerificationPort.deleteEmailVerificationByUserId(saved.getId()))
                                            .then(Mono.error(error))));
                });
    }

    @Override
    public Mono<LoginUserCommandResult> login(LoginUserUserCommand cmd) {
        return authRepositoryPort.findByEmail(cmd.email())
                .switchIfEmpty(Mono.error(AuthExceptions.userNotFound()))
                .flatMap(user -> {
                    // verificamos la contraseña del usuario
                    if (!passwordEncoder.matches(cmd.password(), user.getPassword())) {
                        return Mono.error(AuthExceptions.passwordIsNotCorrect());
                    }

                    if (!user.isEnabled()) {
                        return Mono.error(AuthExceptions.disabledUser());
                    }

                    return refreshTokenUseCase.generateRefreshTokenAndAccessToken(user)
                            .map(res -> new LoginUserCommandResult(res.refreshToken(), res.accessToken()));
                });
    }

    @Override
    public Mono<String> logout() {
        return refreshTokenUseCase.revokedAllRefresh().thenReturn("se cerró la session correctamente!");
    }
}
