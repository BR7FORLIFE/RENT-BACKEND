package com.files.rent_auth_module.infra.zGlobalAdviceException.exceptions;

import com.files.rent_auth_module.shared.exceptions.ExceptionHandler;

public class JwtExceptions extends ExceptionHandler {

    public JwtExceptions(String message) {
        super(message);
    }

    public static JwtExceptions jwtVerifySignException() {
        return new JwtExceptions("the jwt is not valid!");
    }

    public static JwtExceptions jwtExpiredException() {
        return new JwtExceptions("the jwt is expired!");
    }
}
