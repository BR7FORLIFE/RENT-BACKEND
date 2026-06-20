package com.files.rent_auth_module.application.emailVerification.ports;

import java.util.UUID;

import com.files.rent_auth_module.domain.emailVerification.model.EmailVerificationModel;

import reactor.core.publisher.Mono;

public interface EmailVerificationPort {
    Mono<EmailVerificationModel> save(EmailVerificationModel model);

    Mono<EmailVerificationModel> findByToken(String token);

    Mono<EmailVerificationModel> findFirstByUserIdOrderByCreatedAtDesc(UUID userId);

    Mono<Void> revockedAllEmailVerification(UUID userId);
}
