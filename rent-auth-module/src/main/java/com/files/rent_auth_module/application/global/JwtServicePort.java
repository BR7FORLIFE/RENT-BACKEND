package com.files.rent_auth_module.application.global;

import com.files.rent_auth_module.application.microserviceIdentification.dto.response.JwtMicroserviceAccessTokenResponseDto;
import com.files.rent_auth_module.domain.auth.UserModel;

import reactor.core.publisher.Mono;

public interface JwtServicePort {
    Mono<String> obtainAccessToken(UserModel data);

    Mono<JwtMicroserviceAccessTokenResponseDto> obtainMicroserviceAccessToken(String microserviceName);
}
