package com.files.rent_auth_module.application.refreshToken.exceptions;

import com.files.rent_auth_module.shared.exceptions.ExceptionHandler;

public class RefreshTokenExceptions extends ExceptionHandler {

    public RefreshTokenExceptions(String message) {
        super(message);
    }

    public static RefreshTokenExceptions refreshExpiredException() {
        return new RefreshTokenExceptions("El refresh token esta expirado!");
    }

    public static RefreshTokenExceptions refreshRevokedException() {
        return new RefreshTokenExceptions("El refresh token ha sido invalidado");
    }

    public static RefreshTokenExceptions refreshTokenNotFound() {
        return new RefreshTokenExceptions("No se ha encontrado refresh token");
    }
}
