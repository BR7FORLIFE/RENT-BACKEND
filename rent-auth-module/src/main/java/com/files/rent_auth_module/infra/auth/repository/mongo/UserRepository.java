package com.files.rent_auth_module.infra.auth.repository.mongo;

import java.util.UUID;

import org.springframework.data.mongodb.repository.ReactiveMongoRepository;

import com.files.rent_auth_module.infra.auth.entity.UserDocument;

import reactor.core.publisher.Mono;

public interface UserRepository extends ReactiveMongoRepository<UserDocument, UUID> {
    Mono<UserDocument> findByEmail(String email);

    Mono<Void> deleteById(UUID Id);
}
