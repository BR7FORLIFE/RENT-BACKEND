package com.files.rent_auth_module.application.auth.dtos.request;

import com.files.rent_auth_module.shared.enums.IdentificationEnum;

public record RegisterUserRequestDto(
        String username,
        String password,
        String email,
        String cellphone,
        String fullname,
        IdentificationEnum identificationType,
        String identificationNumber) {

}
