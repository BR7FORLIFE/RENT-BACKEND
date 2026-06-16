package com.files.rent_auth_module.application.auth.orchestator;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.files.rent_auth_module.application.auth.command.actions.RegisterUserCommand;
import com.files.rent_auth_module.application.auth.command.response.RegisterUserCommandResult;
import com.files.rent_auth_module.application.auth.exceptions.AuthExceptions;
import com.files.rent_auth_module.application.auth.ports.AuthRepositoryPort;
import com.files.rent_auth_module.application.auth.usecases.AuthUseCase;
import com.files.rent_auth_module.application.emailVerification.usecases.EmailVerificationUseCase;
import com.files.rent_auth_module.domain.auth.UserModel;

import reactor.core.publisher.Mono;

@Service
public class AuthUseCaseImp implements AuthUseCase {

    private final AuthRepositoryPort authRepositoryPort;
    private final EmailVerificationUseCase emailVerificationUseCase;
    private final PasswordEncoder passwordEncoder;

    public AuthUseCaseImp(AuthRepositoryPort authRepositoryPort,
            EmailVerificationUseCase emailVerificationUseCase,
            PasswordEncoder passwordEncoder) {
        this.authRepositoryPort = authRepositoryPort;
        this.passwordEncoder = passwordEncoder;
        this.emailVerificationUseCase = emailVerificationUseCase;
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

                    // mandamos la verificacion de email
                    

                    // retornamos la respuesta
                    return authRepositoryPort.save(user)
                            .map(saved -> new RegisterUserCommandResult(saved.getId(),
                                    "user created sucessfull! please verified your email for activate the user!"));
                });
    }
}
