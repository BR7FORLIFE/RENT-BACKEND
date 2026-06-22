package com.files.rent_auth_module.infra.refreshToken.repository;

import java.util.UUID;

import org.springframework.stereotype.Repository;

import com.files.rent_auth_module.application.refreshToken.ports.RefreshTokenRepositoryPort;
import com.files.rent_auth_module.domain.refreshToken.model.RefreshTokenModel;
import com.files.rent_auth_module.infra.refreshToken.mapper.RefreshTokenMapper;

import reactor.core.publisher.Mono;

@Repository
public class RefreshTokenRepositoryAdapter implements RefreshTokenRepositoryPort {
    private final IMongoRefreshTokenRepository repository;

    public RefreshTokenRepositoryAdapter(IMongoRefreshTokenRepository repository) {
        this.repository = repository;
    }

    @Override
    public Mono<RefreshTokenModel> save(RefreshTokenModel model) {
        return repository.save(RefreshTokenMapper.toEntity(model))
                .map(RefreshTokenMapper::toDomain);
    }

    @Override
    public Mono<RefreshTokenModel> findByUserIdAndToken(UUID userId, String token) {
        return repository.findByUserIdAndToken(userId, token)
                .map(RefreshTokenMapper::toDomain);
    }
}
