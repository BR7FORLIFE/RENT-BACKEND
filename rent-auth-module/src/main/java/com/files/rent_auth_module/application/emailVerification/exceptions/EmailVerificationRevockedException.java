package com.files.rent_auth_module.application.emailVerification.exceptions;

import com.files.rent_auth_module.shared.exceptions.ExceptionHandler;

public class EmailVerificationRevockedException extends ExceptionHandler {
    public EmailVerificationRevockedException() {
        super("the token is revocked!");
    }
}
