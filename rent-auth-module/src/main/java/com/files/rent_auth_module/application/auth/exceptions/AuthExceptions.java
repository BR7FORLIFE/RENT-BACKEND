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

    public static AuthExceptions disabledUser() {
        return new AuthExceptions("Por favor verifica tu email para poder loguearte a la aplicación!");
    }

    public static AuthExceptions passwordIsNotCorrect() {
        return new AuthExceptions("La contraseña no es correcta!");
    }
}
