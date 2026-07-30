package com.files.rent_auth_module.infra.microserviceIdentification.repository;

import java.util.UUID;

import org.springframework.data.mongodb.repository.ReactiveMongoRepository;

import com.files.rent_auth_module.infra.microserviceIdentification.entity.MicroserviceIdentificationDocument;

import reactor.core.publisher.Mono;

public interface IMicroserviceIdentificationRepository
                extends ReactiveMongoRepository<MicroserviceIdentificationDocument, UUID> {
        Mono<MicroserviceIdentificationDocument> findByClientId(String ClientId);
}
