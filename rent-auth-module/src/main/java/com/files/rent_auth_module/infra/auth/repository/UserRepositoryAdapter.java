package com.files.rent_auth_module.infra.auth.repository;

import java.util.UUID;

import org.springframework.stereotype.Repository;

import com.files.rent_auth_module.application.auth.ports.AuthRepositoryPort;
import com.files.rent_auth_module.domain.auth.UserModel;
import com.files.rent_auth_module.infra.auth.mapper.UserMapper;
import com.files.rent_auth_module.infra.auth.repository.mongo.UserRepository;

import reactor.core.publisher.Mono;

@Repository
public class UserRepositoryAdapter implements AuthRepositoryPort {

    private final UserRepository userRepository;

    public UserRepositoryAdapter(UserRepository repository) {
        this.userRepository = repository;
    }

    @Override
    public Mono<UserModel> findByEmail(String email) {
        return userRepository.findByEmail(email)
                .map(UserMapper::toDomain);
    }

    @Override
    public Mono<UserModel> save(UserModel userModel) {
        return userRepository.save(UserMapper.toEntity(userModel))
                .map(UserMapper::toDomain);
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
