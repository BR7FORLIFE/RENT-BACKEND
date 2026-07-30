package com.files.rent_auth_module.application.microserviceIdentification.usecases;

import reactor.core.publisher.Mono;

public interface MicroserviceIdentificationUseCase {
    Mono<String> generateMicroserviceJwt(String clientId, String ClientSecret);
}
