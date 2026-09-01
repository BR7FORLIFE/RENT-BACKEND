package com.files.rent_auth_module.application.microserviceIdentification.orchestator;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.files.rent_auth_module.application.global.JwtServicePort;
import com.files.rent_auth_module.application.microserviceIdentification.dto.response.JwtMicroserviceAccessTokenResponseDto;
import com.files.rent_auth_module.application.microserviceIdentification.exceptions.MicroserviceIdentificationClientSecretException;
import com.files.rent_auth_module.application.microserviceIdentification.exceptions.MicroserviceIdentificationNotFoundException;
import com.files.rent_auth_module.application.microserviceIdentification.ports.MicroserviceIdentificationPort;
import com.files.rent_auth_module.application.microserviceIdentification.usecases.MicroserviceIdentificationUseCase;

import reactor.core.publisher.Mono;

@Service
public class MicroserviceIdentificationUseCaseImp implements MicroserviceIdentificationUseCase {

    private final PasswordEncoder passwordEncoder;
    private final MicroserviceIdentificationPort microserviceIdentificationPort;
    private final JwtServicePort jwtServicePort;

    public MicroserviceIdentificationUseCaseImp(
            PasswordEncoder passwordEncoder,
            MicroserviceIdentificationPort microserviceIdentificationPort,
            JwtServicePort jwtServicePort) {
        this.passwordEncoder = passwordEncoder;
        this.microserviceIdentificationPort = microserviceIdentificationPort;
        this.jwtServicePort = jwtServicePort;
    }

    @Override
    public Mono<JwtMicroserviceAccessTokenResponseDto> generateMicroserviceJwt(String clientId, String ClientSecret) {
        return microserviceIdentificationPort.findByClientId(clientId)
                .switchIfEmpty(Mono.error(new MicroserviceIdentificationNotFoundException()))
                .flatMap(microID -> {
                    // validamos que el secret que nos envia es el secret que esperamos
                    if (!passwordEncoder.matches(ClientSecret, microID.getClientSecret())) {
                        return Mono.error(new MicroserviceIdentificationClientSecretException());
                    }

                    return jwtServicePort.obtainMicroserviceAccessToken(microID.getMicroserviceName());
                });
    }
}
