package com.files.rent_auth_module.infra.emailVerification.repository;

import java.util.UUID;

import org.springframework.data.mongodb.repository.ReactiveMongoRepository;

import com.files.rent_auth_module.infra.emailVerification.entity.EmailVerificationDocument;

import reactor.core.publisher.Mono;

public interface IMongoEmailverificationRepository extends ReactiveMongoRepository<EmailVerificationDocument, UUID> {
    Mono<EmailVerificationDocument> findByToken(String Token);

    Mono<EmailVerificationDocument> findFirstByUserIdOrderByCreateAtDesc(UUID userId);
}
