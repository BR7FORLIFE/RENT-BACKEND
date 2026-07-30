package com.files.rent_auth_module.infra.zGlobalAdviceException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ServerWebExchange;

import com.files.rent_auth_module.application.microserviceIdentification.exceptions.MicroserviceIdentificationClientSecretException;
import com.files.rent_auth_module.application.microserviceIdentification.exceptions.MicroserviceIdentificationNotFoundException;
import com.files.rent_auth_module.shared.ApiError;
import com.files.rent_auth_module.shared.StaticError;

@RestControllerAdvice
public class MicroserviceIdentificationGlobalAdviceException {

    @ExceptionHandler(MicroserviceIdentificationClientSecretException.class)
    public ResponseEntity<ApiError> microserviceClientSecretException(
            MicroserviceIdentificationClientSecretException ex, ServerWebExchange exchange) {
        return StaticError.send(HttpStatus.NOT_ACCEPTABLE, exchange, ex.getMessage());
    }

    @ExceptionHandler(MicroserviceIdentificationNotFoundException.class)
    public ResponseEntity<ApiError> microserviceIdentificationNotFount(MicroserviceIdentificationNotFoundException ex,
            ServerWebExchange exchange) {
        return StaticError.send(HttpStatus.NOT_FOUND, exchange, ex.getMessage());
    }
}
