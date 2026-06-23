package com.files.rent_auth_module.application.emailVerification.exceptions;

import com.files.rent_auth_module.shared.exceptions.ExceptionHandler;

public class EmailVerificationCooldownException extends ExceptionHandler {
    public EmailVerificationCooldownException() {
        super("Debes esperar unos minutos antes de solicitar otro correo de verificación!");
    }
}
