package com.files.rent_auth_module.infra.zGlobalAdviceException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ServerWebExchange;

import com.files.rent_auth_module.application.emailVerification.exceptions.EmailVerificationConsumedException;
import com.files.rent_auth_module.application.emailVerification.exceptions.EmailVerificationCooldownException;
import com.files.rent_auth_module.application.emailVerification.exceptions.EmailVerificationIsExpiredException;
import com.files.rent_auth_module.application.emailVerification.exceptions.EmailVerificationRevockedException;
import com.files.rent_auth_module.application.emailVerification.exceptions.NotEmailVerificationException;
import com.files.rent_auth_module.infra.emailVerification.exceptions.DomainEmailNotExists;
import com.files.rent_auth_module.infra.emailVerification.exceptions.EmailProviderException;
import com.files.rent_auth_module.shared.ApiError;
import com.files.rent_auth_module.shared.StaticError;

@RestControllerAdvice
public class EmailVerificationGlobalAdviceException {

    @ExceptionHandler(NotEmailVerificationException.class)
    public ResponseEntity<ApiError> handleNotEmailVerification(
            NotEmailVerificationException ex,
            ServerWebExchange exchange) {
        return StaticError.send(HttpStatus.NOT_ACCEPTABLE, exchange, ex.getMessage());
    }

    @ExceptionHandler(EmailVerificationRevockedException.class)
    public ResponseEntity<ApiError> handleEmailVerificationRecocked(
            EmailVerificationRevockedException ex,
            ServerWebExchange exchange) {
        return StaticError.send(HttpStatus.NOT_ACCEPTABLE, exchange, ex.getMessage());
    }

    @ExceptionHandler(EmailVerificationIsExpiredException.class)
    public ResponseEntity<ApiError> handleEmailVerificationIsExpired(
            EmailVerificationIsExpiredException ex,
            ServerWebExchange exchange) {
        return StaticError.send(HttpStatus.NOT_ACCEPTABLE, exchange, ex.getMessage());
    }

    @ExceptionHandler(EmailVerificationConsumedException.class)
    public ResponseEntity<ApiError> handleEmailVerificationIsConsumed(
            EmailVerificationConsumedException ex,
            ServerWebExchange exchange) {
        return StaticError.send(HttpStatus.NOT_ACCEPTABLE, exchange, ex.getMessage());
    }

    @ExceptionHandler(EmailVerificationCooldownException.class)
    public ResponseEntity<ApiError> handleCooldownEmailVerification(
            EmailVerificationCooldownException ex,
            ServerWebExchange exchange) {
        return StaticError.send(HttpStatus.NOT_ACCEPTABLE, exchange, ex.getMessage());
    }

    @ExceptionHandler(EmailProviderException.class)
    public ResponseEntity<ApiError> handleErrorProviderException(
            EmailProviderException ex,
            ServerWebExchange exchange) {
        return StaticError.send(HttpStatus.SERVICE_UNAVAILABLE, exchange, ex.getMessage());
    }

    @ExceptionHandler(DomainEmailNotExists.class)
    public ResponseEntity<ApiError> handleDomainEmailNotExists(
            DomainEmailNotExists ex,
            ServerWebExchange exchange) {
        return StaticError.send(HttpStatus.NOT_ACCEPTABLE, exchange, ex.getMessage());
    }
}
