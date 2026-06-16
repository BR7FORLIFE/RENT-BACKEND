package com.files.rent_auth_module.shared;

import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ServerWebExchange;

public class StaticError {
    public static ResponseEntity<ApiError> send(
            HttpStatus status,
            ServerWebExchange exchange,
            String messageError) {

        ApiError error = new ApiError(
                LocalDateTime.now(),
                status.getReasonPhrase(),
                messageError,
                exchange.getRequest().getPath().value());

        return ResponseEntity.status(status).body(error);
    }
}
