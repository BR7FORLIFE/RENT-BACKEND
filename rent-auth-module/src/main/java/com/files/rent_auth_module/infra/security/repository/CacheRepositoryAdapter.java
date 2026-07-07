package com.files.rent_auth_module.infra.security.repository;

import java.time.Duration;
import java.util.Map;

import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.stereotype.Repository;

import com.files.rent_auth_module.application.auth.ports.CachePort;

import reactor.core.publisher.Mono;

@Repository
public class CacheRepositoryAdapter implements CachePort {

    private final ReactiveRedisTemplate<String, String> reactiveRedisTemplate;

    public CacheRepositoryAdapter(ReactiveRedisTemplate<String, String> reactiveRedisTemplate) {
        this.reactiveRedisTemplate = reactiveRedisTemplate;
    }

    public Mono<Void> saveOauth2Session(String oauthSession, String refreshToken, String accessToken) {
        Map<String, String> session = Map.of("accessToken", accessToken, "refreshToken", refreshToken);

        return reactiveRedisTemplate.opsForHash().putAll("oauth:session:" + oauthSession, session)
                .flatMap(
                        result -> reactiveRedisTemplate.expire("oauth:session:" + oauthSession, Duration.ofSeconds(60)))
                .then();
    }

    @Override
    public Mono<Map<String, String>> oauth2GetCredentials(String oauth2SessionID) {
        return reactiveRedisTemplate.opsForHash()
                .entries("oauth:session:" + oauth2SessionID)
                .collectMap(
                        entry -> (String) entry.getKey(),
                        entry -> (String) entry.getValue());
    }
}
