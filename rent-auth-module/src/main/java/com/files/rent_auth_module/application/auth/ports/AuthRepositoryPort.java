package com.files.rent_auth_module.application.auth.ports;

import java.util.UUID;

import com.files.rent_auth_module.domain.auth.UserModel;

import reactor.core.publisher.Mono;

public interface AuthRepositoryPort {

    Mono<UserModel> findById(UUID id);

    Mono<UserModel> findByEmail(String email);

    Mono<UserModel> save(UserModel userModel);
}
