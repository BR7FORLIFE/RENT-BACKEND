package com.files.rent_auth_module.infra.auth.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.files.rent_auth_module.application.auth.command.actions.RegisterUserCommand;
import com.files.rent_auth_module.application.auth.dtos.request.RegisterUserRequestDto;
import com.files.rent_auth_module.application.auth.dtos.response.LoginUserResponseDto;
import com.files.rent_auth_module.application.auth.dtos.response.RegisterUserResponseDto;
import com.files.rent_auth_module.application.auth.usecases.AuthUseCase;

import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthUseCase authUseCase;

    public AuthController(AuthUseCase authUseCase) {
        this.authUseCase = authUseCase;
    }

    @PostMapping("/register")
    public Mono<ResponseEntity<RegisterUserResponseDto>> registerUser(@RequestBody RegisterUserRequestDto dto) {
        RegisterUserCommand cmd = new RegisterUserCommand(
                dto.username(),
                dto.password(),
                dto.email(),
                dto.cellphone(),
                dto.fullname(),
                dto.identificationType(),
                dto.identificationNumber());

        return authUseCase.register(cmd)
                .map(res -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(new RegisterUserResponseDto(res.userId(), res.message())));
    }

    @PostMapping("/login")
    public Mono<ResponseEntity<LoginUserResponseDto>> loginUser() {
        return null;
    }
}
