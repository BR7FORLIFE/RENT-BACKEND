package com.files.rent_auth_module.application.refreshToken.ports;

import java.util.UUID;

import com.files.rent_auth_module.domain.refreshToken.model.RefreshTokenModel;

import reactor.core.publisher.Mono;

public interface RefreshTokenRepositoryPort {
    Mono<RefreshTokenModel> save(RefreshTokenModel model);

    Mono<RefreshTokenModel> findByUserIdAndToken(UUID userId, String token);
}
