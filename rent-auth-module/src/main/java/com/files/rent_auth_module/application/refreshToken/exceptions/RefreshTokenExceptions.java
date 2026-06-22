package com.files.rent_auth_module.application.refreshToken.exceptions;

import com.files.rent_auth_module.shared.exceptions.ExceptionHandler;

public class RefreshTokenExceptions extends ExceptionHandler {

    public RefreshTokenExceptions(String message) {
        super(message);
    }

    public static RefreshTokenExceptions refreshExpiredException() {
        return new RefreshTokenExceptions("the refresh token is expired!");
    }

    public static RefreshTokenExceptions refreshRevokedException() {
        return new RefreshTokenExceptions("the refresh token is revoked!");
    }

    public static RefreshTokenExceptions refreshTokenNotFound() {
        return new RefreshTokenExceptions("the refresh token not found!");
    }
}
