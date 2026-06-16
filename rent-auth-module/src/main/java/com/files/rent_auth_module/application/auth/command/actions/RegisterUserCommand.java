package com.files.rent_auth_module.application.auth.command.actions;

import com.files.rent_auth_module.shared.enums.IdentificationEnum;

public record RegisterUserCommand(
        String username,
        String password,
        String email,
        String cellphone,
        String fullname,
        IdentificationEnum identificationType,
        String identificationNumber) {

}
