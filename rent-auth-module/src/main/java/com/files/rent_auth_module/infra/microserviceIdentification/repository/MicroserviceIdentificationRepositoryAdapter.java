package com.files.rent_auth_module.infra.microserviceIdentification.repository;

import org.springframework.stereotype.Repository;

@Repository
public class MicroserviceIdentificationRepositoryAdapter {

    private final IMicroserviceIdentificationRepository microserviceIdentificationRepository;

    public MicroserviceIdentificationRepositoryAdapter(
            IMicroserviceIdentificationRepository microserviceIdentificationRepository) {
        this.microserviceIdentificationRepository = microserviceIdentificationRepository;
    }
}
