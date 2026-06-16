package com.files.rent_auth_module.infra.zGlobalAdviceException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ServerWebExchange;

import com.files.rent_auth_module.application.auth.exceptions.AuthExceptions;
import com.files.rent_auth_module.shared.ApiError;
import com.files.rent_auth_module.shared.StaticError;

@RestControllerAdvice
public class AuthGlobalAdviceExceptions {

    @ExceptionHandler(AuthExceptions.class)
    public ResponseEntity<ApiError> handleAuthException(
            AuthExceptions exceptions,
            ServerWebExchange exchange) {
        return StaticError.send(HttpStatus.NOT_ACCEPTABLE, exchange, exceptions.getMessage());
    }
}
