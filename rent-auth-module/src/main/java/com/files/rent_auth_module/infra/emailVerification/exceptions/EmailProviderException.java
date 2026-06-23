package com.files.rent_auth_module.infra.emailVerification.exceptions;

import com.files.rent_auth_module.shared.exceptions.ExceptionHandler;

public class EmailProviderException extends ExceptionHandler {
    public EmailProviderException() {
        super("Error en el proveedor de servicio de correo");
    }
}
