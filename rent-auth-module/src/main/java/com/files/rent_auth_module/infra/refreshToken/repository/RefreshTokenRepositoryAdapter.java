package com.files.rent_auth_module.infra.refreshToken.repository;

import java.util.UUID;

import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Repository;

import com.files.rent_auth_module.application.refreshToken.ports.RefreshTokenRepositoryPort;
import com.files.rent_auth_module.domain.refreshToken.model.RefreshTokenModel;
import com.files.rent_auth_module.infra.refreshToken.entity.RefreshTokenDocument;
import com.files.rent_auth_module.infra.refreshToken.mapper.RefreshTokenMapper;

import reactor.core.publisher.Mono;

@Repository
public class RefreshTokenRepositoryAdapter implements RefreshTokenRepositoryPort {
    private final IMongoRefreshTokenRepository repository;
    private final ReactiveMongoTemplate reactiveMongoTemplate;

    public RefreshTokenRepositoryAdapter(IMongoRefreshTokenRepository repository,
            ReactiveMongoTemplate reactiveMongoTemplate) {
        this.repository = repository;
        this.reactiveMongoTemplate = reactiveMongoTemplate;
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

    @Override
    public Mono<Void> revokedAllRefresh() {
        Query query = new Query(Criteria.where("isRevoked").is(false));
        Update update = new Update();

        update.set("isRevoked", true);

        return reactiveMongoTemplate.updateMulti(query, update, RefreshTokenDocument.class).then();
    }

    @Override
    public Mono<Void> deleteRefreshTokenByUserId(UUID userId) {
        return repository.deleteByUserId(userId);
    }
}
