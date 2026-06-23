package com.files.rent_auth_module.application.auth.exceptions;

import com.files.rent_auth_module.shared.exceptions.ExceptionHandler;

public class AuthExceptions extends ExceptionHandler {

    public AuthExceptions(String message) {
        super(message);
    }

    public static AuthExceptions userNotFound() {
        return new AuthExceptions("Usuario no encontrado");
    }

    public static AuthExceptions userAlreadyExistsException() {
        return new AuthExceptions("El usuario existe");
    }

    public static AuthExceptions disabledUser(String message) {
        return new AuthExceptions(message);
    }
}
