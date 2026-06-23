package com.files.rent_auth_module.application.emailVerification.exceptions;

import com.files.rent_auth_module.shared.exceptions.ExceptionHandler;

public class EmailVerificationIsExpiredException extends ExceptionHandler {
    public EmailVerificationIsExpiredException() {
        super("El codigo de expiración se encuentra expirado");
    }
}
