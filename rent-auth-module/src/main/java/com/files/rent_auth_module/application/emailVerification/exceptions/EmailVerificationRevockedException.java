package com.files.rent_auth_module.application.emailVerification.exceptions;

import com.files.rent_auth_module.shared.exceptions.ExceptionHandler;

public class EmailVerificationRevockedException extends ExceptionHandler {
    public EmailVerificationRevockedException() {
        super("El token ha sido invalidado");
    }
}
