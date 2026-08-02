package com.files.rent_auth_module.application.auth.dtos.response;

import java.util.UUID;

public record MeResponseDto(UUID userId, String username, String email, String cellphone, String fullname,
        boolean isEnabled) {

}
