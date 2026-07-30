package com.files.rent_auth_module.application.microserviceIdentification.ports;

import com.files.rent_auth_module.domain.microservicesIdentification.MicroserviceIdentificationModel;

import reactor.core.publisher.Mono;

public interface MicroserviceIdentificationPort {
    Mono<MicroserviceIdentificationModel> findByClientId(String clientId);
}
