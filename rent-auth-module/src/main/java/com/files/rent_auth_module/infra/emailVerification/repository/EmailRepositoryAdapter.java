package com.files.rent_auth_module.infra.emailVerification.repository;

import java.util.UUID;

import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Repository;

import com.files.rent_auth_module.application.emailVerification.ports.EmailVerificationPort;
import com.files.rent_auth_module.domain.emailVerification.model.EmailVerificationModel;
import com.files.rent_auth_module.infra.emailVerification.entity.EmailVerificationDocument;
import com.files.rent_auth_module.infra.emailVerification.mapper.EmailVerificationMapper;
import com.files.rent_auth_module.shared.enums.StatusEmail;

import reactor.core.publisher.Mono;

@Repository
public class EmailRepositoryAdapter implements EmailVerificationPort {

    private final IMongoEmailverificationRepository repository;
    private final ReactiveMongoTemplate reactiveMongoTemplate;

    public EmailRepositoryAdapter(IMongoEmailverificationRepository repository, ReactiveMongoTemplate template) {
        this.repository = repository;
        this.reactiveMongoTemplate = template;
    }

    @Override
    public Mono<EmailVerificationModel> findByToken(String token) {
        return repository.findByToken(token)
                .map(EmailVerificationMapper::toDomain);
    }

    @Override
    public Mono<EmailVerificationModel> findFirstByUserIdOrderByCreatedAtDesc(UUID userId) {
        return repository.findFirstByUserIdOrderByCreateAtDesc(userId)
                .map(EmailVerificationMapper::toDomain);
    }

    @Override
    public Mono<Void> revockedAllEmailVerification(UUID userId) {
        Query query = new Query(
                Criteria.where("userId").is(userId).and("emailStatus").is(StatusEmail.PENDING));

        Update update = new Update();

        update.set("emailStatus", StatusEmail.REVOKED);

        return reactiveMongoTemplate.updateMulti(query, update, EmailVerificationDocument.class).then();
    }

    @Override
    public Mono<EmailVerificationModel> save(EmailVerificationModel model) {
        return repository.save(EmailVerificationMapper.toEntity(model))
                .map(EmailVerificationMapper::toDomain);
    }
}
