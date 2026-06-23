package com.files.rent_auth_module.application.refreshToken.orchestator;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import java.util.function.Consumer;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.files.rent_auth_module.application.auth.exceptions.AuthExceptions;
import com.files.rent_auth_module.application.auth.ports.AuthRepositoryPort;
import com.files.rent_auth_module.application.global.JwtServicePort;
import com.files.rent_auth_module.application.refreshToken.command.response.GenerateRefreshTokenCommandResult;
import com.files.rent_auth_module.application.refreshToken.exceptions.RefreshTokenExceptions;
import com.files.rent_auth_module.application.refreshToken.ports.RefreshTokenRepositoryPort;
import com.files.rent_auth_module.application.refreshToken.usecases.RefreshTokenUseCase;
import com.files.rent_auth_module.config.GenerateCodeService;
import com.files.rent_auth_module.domain.auth.UserModel;
import com.files.rent_auth_module.domain.refreshToken.model.RefreshTokenModel;
import com.files.rent_auth_module.domain.refreshToken.services.RefreshTokenService;

import reactor.core.publisher.Mono;

@Service
public class RefreshTokenUseCaseImp implements RefreshTokenUseCase {

    private final GenerateCodeService generateCodeService;
    private final JwtServicePort jwtServicePort;
    private final RefreshTokenRepositoryPort refreshTokenPort;
    private final AuthRepositoryPort authRepositoryPort;

    @Value("${refreshToken.expired}")
    public Integer refreshTokenDaysExpired;

    public RefreshTokenUseCaseImp(GenerateCodeService generateCodeService,
            JwtServicePort jwtServicePort,
            RefreshTokenRepositoryPort refreshTokenRepositoryPort,
            AuthRepositoryPort authRepositoryPort) {
        this.generateCodeService = generateCodeService;
        this.jwtServicePort = jwtServicePort;
        this.refreshTokenPort = refreshTokenRepositoryPort;
        this.authRepositoryPort = authRepositoryPort;
    }

    @Override
    public Mono<GenerateRefreshTokenCommandResult> generateRefreshTokenAndAccessToken(UserModel model) {
        // revocamos todos los refresh token para no tener refresh activos y creamos el
        // pair nuevo
        return revokedAllRefresh().then(createRefreshAndAccessToken(model));
    }

    @Override
    public Mono<String> obtainAccessToken(UUID userId, String refreshToken) {
        String tokenHash = generateCodeService.sha256(refreshToken);

        return refreshTokenPort.findByUserIdAndToken(userId, tokenHash)
                .switchIfEmpty(Mono.error(RefreshTokenExceptions.refreshTokenNotFound()))
                .flatMap(refreshModel -> {

                    if (refreshModel.getExpiredAt().isBefore(Instant.now())) {
                        return Mono.error(RefreshTokenExceptions.refreshExpiredException());
                    }

                    if (refreshModel.isRevoked()) {
                        return Mono.error(RefreshTokenExceptions.refreshRevokedException());
                    }

                    return authRepositoryPort.findById(refreshModel.getUserId())
                            .switchIfEmpty(Mono.error(AuthExceptions.userNotFound()))
                            .flatMap(user -> jwtServicePort.obtainAccessToken(user));
                });
    }

    @Override
    public Mono<GenerateRefreshTokenCommandResult> revokedAllAndObtainRefreshToken(UUID userId, String refresh) {
        String tokenHash = generateCodeService.sha256(refresh);

        return refreshTokenPort.findByUserIdAndToken(userId, tokenHash)
                .switchIfEmpty(Mono.error(RefreshTokenExceptions.refreshTokenNotFound()))
                .map(RefreshTokenService::revokedRefresh)
                .flatMap(refreshTokenPort::save)
                .map(RefreshTokenModel::getUserId)
                .flatMap(authRepositoryPort::findById)
                .flatMap(this::generateRefreshTokenAndAccessToken);
    }

    @Override
    public Mono<Void> revokedAllRefresh() {
        return refreshTokenPort.revokedAllRefresh();
    }

    private Mono<GenerateRefreshTokenCommandResult> createRefreshAndAccessToken(UserModel model) {
        Instant now = Instant.now();
        Instant expiredAt = now.plus(refreshTokenDaysExpired, ChronoUnit.DAYS);

        // generamos el token con alta entropia
        String token = generateCodeService.randomBase64(32);
        String tokenHash = generateCodeService.sha256(token);

        RefreshTokenModel refresh = new RefreshTokenModel.RefreshTokenBuilderDraft()
                .userId(model.getId())
                .token(tokenHash)
                .expiredAt(expiredAt)
                .build();

        return refreshTokenPort.save(refresh)
                .flatMap(user -> jwtServicePort.obtainAccessToken(model)
                        .map(accessToken -> new GenerateRefreshTokenCommandResult(token, accessToken)));
    }
}
