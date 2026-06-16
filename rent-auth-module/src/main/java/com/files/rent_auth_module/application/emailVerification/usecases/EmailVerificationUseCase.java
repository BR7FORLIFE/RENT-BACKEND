package com.files.rent_auth_module.application.emailVerification.usecases;

import java.util.UUID;

import reactor.core.publisher.Mono;

public interface EmailVerificationUseCase {
    Mono<Void> sendEmailVerificationToken(UUID userId, String email);
}
