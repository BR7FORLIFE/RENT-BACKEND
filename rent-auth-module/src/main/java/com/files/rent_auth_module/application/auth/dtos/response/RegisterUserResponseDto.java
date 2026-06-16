package com.files.rent_auth_module.application.auth.dtos.response;

import java.util.UUID;

public record RegisterUserResponseDto(UUID userId, String message) {

}
