package com.files.rent_auth_module.application.microserviceIdentification.dto.response;

public record JwtMicroserviceAccessTokenResponseDto(String jwt, Integer expiredTimeSeconds) {

}
