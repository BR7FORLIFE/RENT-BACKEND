package com.files.rent_auth_module.shared.jwt;

import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import com.files.rent_auth_module.application.global.JwtServicePort;
import com.files.rent_auth_module.domain.auth.UserModel;
import com.files.rent_auth_module.infra.security.CustomUserDetails;
import com.files.rent_auth_module.infra.zGlobalAdviceException.exceptions.JwtExceptions;
import com.nimbusds.jose.JOSEObjectType;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.crypto.RSASSAVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;

import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Service
public class JwtService implements JwtServicePort {

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

    @Override
    public Mono<String> obtainAccessToken(UserModel data) {
        CustomUserDetails details = new CustomUserDetails(data);
        return this.generateAccessToken(details);
    }

    private Mono<String> generateAccessToken(UserDetails userDetails) {
        // fecha de emision del token y fecha de expiracion
        Instant now = Instant.now();
        Instant expirationTime = now.plusSeconds(this.accessTokenExpiredTime);

        Date issueTimeDate = Date.from(now);
        Date expirationDate = Date.from(expirationTime);

        return Mono.fromCallable(() -> {
            CustomUserDetails details = (CustomUserDetails) userDetails;

            // payload del JWT
            JWTClaimsSet payload = new JWTClaimsSet.Builder()
                    .issuer(this.issuer)
                    .subject(details.getUsername())
                    .expirationTime(expirationDate)
                    .issueTime(issueTimeDate)
                    .claim("userId", details.getUserId())
                    .claim("rols", details.getAuthorities()
                            .stream()
                            .map(GrantedAuthority::getAuthority)
                            .collect(Collectors.toList()))
                    .jwtID(UUID.randomUUID().toString())
                    .build();

            // header JWT metadata
            JWSHeader headerJwt = new JWSHeader.Builder(JWSAlgorithm.RS256)
                    .type(JOSEObjectType.JWT)
                    .build();

            // representa un objeto que ha sido firmado mediante JSON WEB SIGNATURE
            SignedJWT signedJWT = new SignedJWT(headerJwt, payload);
            RSASSASigner signer = new RSASSASigner(this.rsaPrivateKey);
            signedJWT.sign(signer); // aplicamos la firma JWS

            return signedJWT.serialize(); // retornamos el JWT ya firmado
        }).subscribeOn(Schedulers.boundedElastic());
    }

    // validamos el accessToken y devolvemos sus claims!
    public Mono<JWTClaimsSet> validateAccessToken(String token) {
        return Mono.fromCallable(() -> {
            SignedJWT signedJWT = SignedJWT.parse(token);
            JWSVerifier jwsVerifier = new RSASSAVerifier(this.rsaPublicKey);

            if (!signedJWT.verify(jwsVerifier)) {
                // exception para JWT invalido
                throw JwtExceptions.jwtVerifySignException();
            }
            JWTClaimsSet claims = signedJWT.getJWTClaimsSet();

            Date date = new Date();

            if (claims.getExpirationTime() == null || date.after(claims.getExpirationTime())) {
                // excepcion para JWT expirado
                throw JwtExceptions.jwtExpiredException();
            }

            return claims;
        }).subscribeOn(Schedulers.boundedElastic());
    }
}
