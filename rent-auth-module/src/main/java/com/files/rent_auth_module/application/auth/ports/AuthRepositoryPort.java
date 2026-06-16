package com.files.rent_auth_module.application.auth.ports;

import com.files.rent_auth_module.domain.auth.UserModel;

import reactor.core.publisher.Mono;

public interface AuthRepositoryPort {
    Mono<UserModel> findByEmail(String email);

    Mono<UserModel> save(UserModel userModel);
}
