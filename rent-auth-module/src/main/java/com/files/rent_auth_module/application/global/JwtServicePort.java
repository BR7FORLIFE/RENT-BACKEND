package com.files.rent_auth_module.application.global;

import com.files.rent_auth_module.domain.auth.UserModel;

import reactor.core.publisher.Mono;

public interface JwtServicePort {
    Mono<String> obtainAccessToken(UserModel data);
}
