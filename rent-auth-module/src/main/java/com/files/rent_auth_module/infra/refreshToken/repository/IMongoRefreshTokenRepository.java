package com.files.rent_auth_module.infra.refreshToken.repository;

import java.util.UUID;

import org.springframework.data.mongodb.repository.ReactiveMongoRepository;

import com.files.rent_auth_module.infra.refreshToken.entity.RefreshTokenDocument;

import reactor.core.publisher.Mono;

public interface IMongoRefreshTokenRepository extends ReactiveMongoRepository<RefreshTokenDocument, UUID> {
    Mono<RefreshTokenDocument> findByUserIdAndToken(UUID UserId, String Token);

    Mono<Void> deleteByUserId(UUID UserId);
}
