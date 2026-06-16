package com.files.rent_auth_module.infra.zGlobalAdviceException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ServerWebExchange;

import com.files.rent_auth_module.infra.zGlobalAdviceException.exceptions.JwtExceptions;
import com.files.rent_auth_module.shared.ApiError;
import com.files.rent_auth_module.shared.StaticError;

@RestControllerAdvice
public class SecurityGlobalAdviceExceptions {

    @ExceptionHandler(JwtExceptions.class)
    public ResponseEntity<ApiError> handleJwtNotValid(JwtExceptions exception, ServerWebExchange exchange) {
        return StaticError.send(HttpStatus.FORBIDDEN, exchange, exception.getMessage());
    }
}
