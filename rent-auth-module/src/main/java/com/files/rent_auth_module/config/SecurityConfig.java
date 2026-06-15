package com.files.rent_auth_module.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.ReactiveAuthenticationManager;
import org.springframework.security.config.web.server.SecurityWebFiltersOrder;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.core.userdetails.ReactiveUserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.authentication.AuthenticationWebFilter;
import org.springframework.security.web.server.authentication.ServerAuthenticationConverter;
import org.springframework.security.web.server.context.NoOpServerSecurityContextRepository;

import com.files.rent_auth_module.infra.security.ReactiveAuthenticationManagerImp;

@Configuration
public class SecurityConfig {

    private final String[] PUBLIC_PATHS = { "/auth/**" };

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http, AuthenticationWebFilter filter)
            throws Exception {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .cors(null) //configurar el cors cuando tengamos enlace al frontend
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((exchange, ex) -> {
                            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                            return exchange.getResponse().setComplete();
                        }))
                .authorizeExchange(
                        exchange -> exchange.pathMatchers(PUBLIC_PATHS).permitAll().anyExchange().authenticated())
                .securityContextRepository(NoOpServerSecurityContextRepository.getInstance())
                .addFilterAt(filter, SecurityWebFiltersOrder.AUTHENTICATION)
                .build();
    }

    @Bean
    public AuthenticationWebFilter authenticationWebFilter(
            ReactiveAuthenticationManager reactiveAuthenticationManager,
            ServerAuthenticationConverter serverAuthenticationConverter) {
        AuthenticationWebFilter filter = new AuthenticationWebFilter(reactiveAuthenticationManager);
        filter.setServerAuthenticationConverter(serverAuthenticationConverter);
        filter.setSecurityContextRepository(NoOpServerSecurityContextRepository.getInstance());

        return filter;
    }

    @Bean
    public ReactiveAuthenticationManager reactiveAuthenticationManager(
            ReactiveUserDetailsService reactiveUserDetailsService,
            PasswordEncoder passwordEncoder) throws Exception {
        return new ReactiveAuthenticationManagerImp();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
