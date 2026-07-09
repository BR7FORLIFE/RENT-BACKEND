package com.files.rent_auth_module.infra.security;

import java.net.URI;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.server.WebFilterExchange;
import org.springframework.security.web.server.authentication.ServerAuthenticationSuccessHandler;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ServerWebExchange;

import com.files.rent_auth_module.application.auth.usecases.AuthUseCase;

import reactor.core.publisher.Mono;

public class Oauth2SuccessHandlerImp implements ServerAuthenticationSuccessHandler {

    private final AuthUseCase authUseCase;

    public Oauth2SuccessHandlerImp(AuthUseCase authUseCase) {
        this.authUseCase = authUseCase;
    }

    // flujos a tener en cuenta:

    /**
     * - Registrar al usuario a la plataforma
     * - loguear al usuario para obtener access y refresh token
     * - llamar al servicio de caching con un ttl de 60 segundos para que el cliente
     * pueda tener tiempo de obtener los tokens
     * - mandar
     */

    @Override
    public Mono<Void> onAuthenticationSuccess(WebFilterExchange webFilterExchange, Authentication authentication) {
        OidcUser user = (OidcUser) authentication.getPrincipal(); // informacion oauth2 del usuario

        return authUseCase.oauth2Login(user.getNickName(), user.getEmail(), user.getPhoneNumber(), user.getFullName())
                .flatMap(oauthSesionID -> {
                    ServerWebExchange exchange = webFilterExchange.getExchange();

                    exchange.getResponse().setStatusCode(HttpStatus.FOUND);

                    // debemos crear la screen de redirecciones en el frontend
                    exchange.getResponse().getHeaders()
                            .setLocation(URI.create("rentfrontend://login/oauth2/callback?sessionID=" + oauthSesionID));

                    return exchange.getResponse().setComplete();
                });
    }
}
