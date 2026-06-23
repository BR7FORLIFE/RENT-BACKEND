package com.files.rent_auth_module.application.emailVerification.exceptions;

import com.files.rent_auth_module.shared.exceptions.ExceptionHandler;

public class EmailVerificationConsumedException extends ExceptionHandler {
    public EmailVerificationConsumedException() {
        super("El codigo de verificación ha sido consumido!");
    }
}
