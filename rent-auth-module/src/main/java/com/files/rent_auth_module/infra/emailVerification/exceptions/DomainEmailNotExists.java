package com.files.rent_auth_module.infra.emailVerification.exceptions;

import com.files.rent_auth_module.shared.exceptions.ExceptionHandler;

public class DomainEmailNotExists extends ExceptionHandler {

    public DomainEmailNotExists() {
        super("El email no es un dominio valido por favor digite un correo activo");
    }
}
