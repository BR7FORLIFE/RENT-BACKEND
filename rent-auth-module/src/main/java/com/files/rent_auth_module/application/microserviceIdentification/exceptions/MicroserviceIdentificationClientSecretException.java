package com.files.rent_auth_module.application.microserviceIdentification.exceptions;

import com.files.rent_auth_module.shared.exceptions.ExceptionHandler;

public class MicroserviceIdentificationClientSecretException extends ExceptionHandler {
    public MicroserviceIdentificationClientSecretException() {
        super("The client secret is incorrect!");
    }
}
