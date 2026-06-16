package com.files.rent_auth_module.application.emailVerification.orchestator;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.files.rent_auth_module.application.emailVerification.ports.ResendPort;
import com.files.rent_auth_module.application.emailVerification.usecases.EmailVerificationUseCase;

import reactor.core.publisher.Mono;

@Service
public class EmailVerificationUseCaseImp implements EmailVerificationUseCase {

    private final ResendPort resendPort;

    public EmailVerificationUseCaseImp(ResendPort resendPort) {
        this.resendPort = resendPort;
    }

    @Override
    public Mono<Void> sendEmailVerificationToken(UUID userId, String email) {

        return null;
    }
}
