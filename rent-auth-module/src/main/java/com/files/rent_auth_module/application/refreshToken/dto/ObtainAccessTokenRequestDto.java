package com.files.rent_auth_module.application.refreshToken.dto;

import java.util.UUID;

public record ObtainAccessTokenRequestDto(UUID userId, String refreshToken) {

}
