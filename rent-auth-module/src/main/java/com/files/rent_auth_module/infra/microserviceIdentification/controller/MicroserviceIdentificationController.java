package com.files.rent_auth_module.infra.microserviceIdentification.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.files.rent_auth_module.application.auth.dtos.response.MeResponseDto;
import com.files.rent_auth_module.application.auth.usecases.AuthUseCase;
import com.files.rent_auth_module.application.microserviceIdentification.dto.request.GenerateMicroserviceAccessTokenRequestDto;
import com.files.rent_auth_module.application.microserviceIdentification.dto.response.GenerateMicroserviceAccessTokenResponseDto;
import com.files.rent_auth_module.application.microserviceIdentification.usecases.MicroserviceIdentificationUseCase;

import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/microservice-identification")
public class MicroserviceIdentificationController {

    private final MicroserviceIdentificationUseCase microserviceIdentificationUseCase;
    private final AuthUseCase authUseCase;

    public MicroserviceIdentificationController(MicroserviceIdentificationUseCase useCase, AuthUseCase authUseCase) {
        this.microserviceIdentificationUseCase = useCase;
        this.authUseCase = authUseCase;
    }

    // endpoint para generar JWT de identificacion de microservicios
    @PostMapping
    public Mono<ResponseEntity<GenerateMicroserviceAccessTokenResponseDto>> microserviceAccessToken(
            @RequestBody GenerateMicroserviceAccessTokenRequestDto requestDto) {
        return microserviceIdentificationUseCase
                .generateMicroserviceJwt(requestDto.clientId(), requestDto.clientSecret())
                .map(jwt -> ResponseEntity.ok().body(new GenerateMicroserviceAccessTokenResponseDto(jwt)));
    }

    // obtener un usuario por su email (MICROSERVICE GRANTED)
    @PreAuthorize("hasAuthority('users:read')")
    @GetMapping("/user")
    public Mono<ResponseEntity<MeResponseDto>> getUserInfo(@RequestParam String email) {
        return authUseCase.me(email)
                .map(res -> ResponseEntity.ok().body(new MeResponseDto(
                        res.userId(),
                        res.username(),
                        res.email(),
                        res.cellphone(),
                        res.fullname(),
                        res.isEnabled())));
    }
}
