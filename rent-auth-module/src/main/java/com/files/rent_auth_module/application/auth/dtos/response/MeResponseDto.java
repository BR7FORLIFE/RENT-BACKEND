package com.files.rent_auth_module.application.auth.dtos.response;

import java.util.UUID;

import com.files.rent_auth_module.shared.enums.IdentificationEnum;

public record MeResponseDto(UUID userId, String username, String email, String cellphone, String fullname,
                IdentificationEnum identificationType, String identificationNumber, boolean isEnabled) {

}
