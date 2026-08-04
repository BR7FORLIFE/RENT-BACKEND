package com.files.rent_auth_module.application.auth.ports;

import java.util.List;
import java.util.UUID;

import com.files.rent_auth_module.domain.auth.UserModel;

import reactor.core.publisher.Mono;

public interface AuthRepositoryPort {

    Mono<UserModel> findById(UUID id);

    Mono<UserModel> findByEmail(String email);

    Mono<List<UserModel>> findAllUsers(List<UUID> usersIds);

    Mono<UserModel> save(UserModel userModel);

    Mono<Void> save(UUID userId, String username, String cellphone);

    Mono<Void> deleteByUserId(UUID userId);
}
