package com.files.rent_auth_module.infra.auth.repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.CriteriaDefinition;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Repository;

import com.files.rent_auth_module.application.auth.ports.AuthRepositoryPort;
import com.files.rent_auth_module.domain.auth.UserModel;
import com.files.rent_auth_module.infra.auth.entity.UserDocument;
import com.files.rent_auth_module.infra.auth.mapper.UserMapper;
import com.files.rent_auth_module.infra.auth.repository.mongo.UserRepository;

import reactor.core.publisher.Mono;

@Repository
public class UserRepositoryAdapter implements AuthRepositoryPort {

    private final UserRepository userRepository;
    private final ReactiveMongoTemplate reactiveMongoTemplate;

    public UserRepositoryAdapter(UserRepository repository, ReactiveMongoTemplate reactiveMongoTemplate) {
        this.userRepository = repository;
        this.reactiveMongoTemplate = reactiveMongoTemplate;
    }

    @Override
    public Mono<UserModel> findByEmail(String email) {
        return userRepository.findByEmail(email)
                .map(UserMapper::toDomain);
    }

    @Override
    public Mono<List<UserModel>> findAllUsers(List<UUID> usersIds) {
        return userRepository.findByIdIn(usersIds)
                .map(UserMapper::toDomain)
                .collectList();
    }

    @Override
    public Mono<UserModel> save(UserModel userModel) {
        return userRepository.save(UserMapper.toEntity(userModel))
                .map(UserMapper::toDomain);
    }

    @Override
    public Mono<Void> save(UUID userId, String username, String cellphone) {
        Query query = new Query(Criteria.where("_id").is(userId));

        Update update = new Update();

        // validamos que contamos con dichos parametros
        if (username != null) {
            update.set("username", username);
        }

        if (cellphone != null) {
            update.set("cellphone", cellphone);
        }

        update.set("updateAt", Instant.now());

        return this.reactiveMongoTemplate.updateFirst(query, update, UserDocument.class).then();
    }

    @Override
    public Mono<UserModel> findById(UUID id) {
        return userRepository.findById(id)
                .map(UserMapper::toDomain);
    }

    @Override
    public Mono<Void> deleteByUserId(UUID userId) {
        return userRepository.deleteById(userId);
    }
}
