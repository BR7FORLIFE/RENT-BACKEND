package com.files.rent_auth_module.application.microserviceIdentification.exceptions;

import com.files.rent_auth_module.shared.exceptions.ExceptionHandler;

public class MicroserviceIdentificationNotFoundException extends ExceptionHandler {
    public MicroserviceIdentificationNotFoundException() {
        super("Microservice Not Found!");
    }
}
