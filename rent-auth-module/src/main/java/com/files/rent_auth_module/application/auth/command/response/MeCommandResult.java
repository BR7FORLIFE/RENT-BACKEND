package com.files.rent_auth_module.application.auth.command.response;

import java.util.UUID;

import com.files.rent_auth_module.shared.enums.IdentificationEnum;

public record MeCommandResult(UUID userId, String username, String email, String cellphone, String fullname,
                IdentificationEnum identificationType, String identificationNumber, boolean isEnabled) {

}
