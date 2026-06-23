package com.files.rent_auth_module.application.refreshToken.usecases;

import java.util.UUID;

import com.files.rent_auth_module.application.refreshToken.command.response.GenerateRefreshTokenCommandResult;
import com.files.rent_auth_module.domain.auth.UserModel;

import reactor.core.publisher.Mono;

public interface RefreshTokenUseCase {
    Mono<GenerateRefreshTokenCommandResult> generateRefreshTokenAndAccessToken(UserModel model);

    Mono<String> obtainAccessToken(UUID userId, String refreshToken);

    Mono<GenerateRefreshTokenCommandResult> revokedAllAndObtainRefreshToken(UUID userId, String refresh);

    Mono<Void> revokedAllRefresh();
}
