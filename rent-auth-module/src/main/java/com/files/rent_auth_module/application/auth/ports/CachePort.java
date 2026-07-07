package com.files.rent_auth_module.application.auth.ports;

import java.util.Map;

import reactor.core.publisher.Mono;

public interface CachePort {
    Mono<Void> saveOauth2Session(String oauthSession, String refreshToken, String accessToken);

    Mono<Map<String, String>> oauth2GetCredentials(String oauth2SessionID);
}
