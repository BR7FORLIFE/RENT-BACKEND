package com.files.rent_auth_module.application.emailVerification.exceptions;

import com.files.rent_auth_module.shared.exceptions.ExceptionHandler;

public class NotEmailVerificationException extends ExceptionHandler {
    public NotEmailVerificationException() {
        super("not found email verification!");
    }
}
