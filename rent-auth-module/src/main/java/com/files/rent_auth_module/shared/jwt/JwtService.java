package com.files.rent_auth_module.shared.jwt;

import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.nimbusds.jwt.JWTClaimsSet;

import reactor.core.publisher.Mono;

@Service
public class JwtService {

    @Value("${jwt.accessToken.expired}")
    private Integer accessTokenExpiredTime;

    private final String issuer = "BR7FORLIFE";

    private final RSAPrivateKey rsaPrivateKey;
    private final RSAPublicKey rsaPublicKey;

    public JwtService(
            RSAPrivateKey rsaPrivateKey,
            RSAPublicKey rsaPublicKey) {
        this.rsaPrivateKey = rsaPrivateKey;
        this.rsaPublicKey = rsaPublicKey;
    }

    public Mono<String> generateAccessToken() {
        return null;
    }

    // validamos el accessToken y devolvemos sus claims!
    public Mono<JWTClaimsSet> validateAccessToken() {
        return null;
    }
}
