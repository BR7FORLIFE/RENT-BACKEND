package com.files.rent_auth_module.infra.auth.controllers;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.files.rent_auth_module.application.auth.command.actions.LoginUserUserCommand;
import com.files.rent_auth_module.application.auth.command.actions.RegisterUserCommand;
import com.files.rent_auth_module.application.auth.dtos.request.LoginUserRequestDto;
import com.files.rent_auth_module.application.auth.dtos.request.RegisterUserRequestDto;
import com.files.rent_auth_module.application.auth.dtos.response.LoginUserResponseDto;
import com.files.rent_auth_module.application.auth.dtos.response.RegisterUserResponseDto;
import com.files.rent_auth_module.application.auth.usecases.AuthUseCase;
import com.files.rent_auth_module.application.refreshToken.dto.ObtainAccessTokenRequestDto;
import com.files.rent_auth_module.application.refreshToken.dto.ObtainAccessTokenResponseDto;
import com.files.rent_auth_module.application.refreshToken.dto.RefreshRevokedRequestDto;
import com.files.rent_auth_module.application.refreshToken.usecases.RefreshTokenUseCase;

import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthUseCase authUseCase;
    private final RefreshTokenUseCase refreshTokenUseCase;

    public AuthController(AuthUseCase authUseCase, RefreshTokenUseCase refreshTokenUseCase) {
        this.authUseCase = authUseCase;
        this.refreshTokenUseCase = refreshTokenUseCase;
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

    @GetMapping("/me")
    public Mono<Map<String, Object>> oauth2Me(@AuthenticationPrincipal OAuth2User oAuth2User) {
        return Mono.just(oAuth2User.getAttributes());
    }

    @PostMapping("/login")
    public Mono<ResponseEntity<LoginUserResponseDto>> loginUser(@RequestBody LoginUserRequestDto dto) {
        LoginUserUserCommand cmd = new LoginUserUserCommand(dto.email(), dto.password());

        return authUseCase.login(cmd)
                .map(res -> ResponseEntity.ok().body(new LoginUserResponseDto(res.refreshToken(), res.accessToken())));
    }

    @PostMapping("/refresh")
    public Mono<ResponseEntity<ObtainAccessTokenResponseDto>> obtainAccessTokenByRefresh(
            @RequestBody ObtainAccessTokenRequestDto dto) {
        return refreshTokenUseCase.obtainAccessToken(dto.userId(), dto.refreshToken())
                .map(accessToken -> ResponseEntity.ok().body(new ObtainAccessTokenResponseDto(accessToken)));
    }

    @PostMapping("/refresh/rotate")
    public Mono<ResponseEntity<LoginUserResponseDto>> rotateRefreshToken(@RequestBody RefreshRevokedRequestDto dto) {
        return refreshTokenUseCase.revokedAllAndObtainRefreshToken(dto.userId(), dto.refreshToken())
                .map(res -> ResponseEntity.ok().body(new LoginUserResponseDto(res.refreshToken(), res.accessToken())));
    }

    @PostMapping("/logout")
    public Mono<ResponseEntity<Map<String, String>>> logout() {
        return authUseCase.logout().map(msg -> ResponseEntity.ok().body(Map.of("message", msg)));
    }
}
