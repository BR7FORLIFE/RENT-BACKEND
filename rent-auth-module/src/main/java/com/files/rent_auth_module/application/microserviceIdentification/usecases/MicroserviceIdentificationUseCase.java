package com.files.rent_auth_module.application.microserviceIdentification.usecases;

import com.files.rent_auth_module.application.microserviceIdentification.dto.response.JwtMicroserviceAccessTokenResponseDto;

import reactor.core.publisher.Mono;

public interface MicroserviceIdentificationUseCase {
    Mono<JwtMicroserviceAccessTokenResponseDto> generateMicroserviceJwt(String clientId, String ClientSecret);
}
