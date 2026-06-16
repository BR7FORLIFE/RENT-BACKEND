package com.files.rent_auth_module.infra.security;

import java.text.ParseException;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import javax.security.auth.login.CredentialException;

import org.springframework.security.authentication.ReactiveAuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import com.files.rent_auth_module.domain.auth.UserModel;
import com.files.rent_auth_module.shared.enums.RolEnum;
import com.files.rent_auth_module.shared.jwt.JwtService;

import reactor.core.publisher.Mono;

public class ReactiveAuthenticationManagerImp implements ReactiveAuthenticationManager {

    private JwtService jwtService;

    public ReactiveAuthenticationManagerImp(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public Mono<Authentication> authenticate(Authentication authentication) {
        String token = (String) authentication.getCredentials();

        return jwtService.validateAccessToken(token)
                .flatMap(claims -> {
                    try {
                        UUID userId = UUID.fromString(claims.getClaimAsString("userId"));

                        Set<RolEnum> rols = claims.getStringListClaim("rols")
                                .stream()
                                .map(rol -> rol.replace("ROLE_", ""))
                                .map(RolEnum::valueOf)
                                .collect(Collectors.toSet());

                        List<GrantedAuthority> authorities = rols.stream()
                                .map(rol -> new SimpleGrantedAuthority("ROLE_" + rol.name()))
                                .collect(Collectors.toList());

                        CustomUserDetails details = new CustomUserDetails(
                                new UserModel.UserBuilder()
                                        .id(userId)
                                        .username(claims.getSubject())
                                        .rols(rols)
                                        .build());

                        Authentication auth = new UsernamePasswordAuthenticationToken(
                                details,
                                token,
                                authorities);

                        return Mono.just(auth);

                    } catch (ParseException | IllegalArgumentException e) {
                        // lanzar exception y que spring lo capture
                        return Mono.error(new CredentialException("malformed token"));
                    }
                });
    }
}
