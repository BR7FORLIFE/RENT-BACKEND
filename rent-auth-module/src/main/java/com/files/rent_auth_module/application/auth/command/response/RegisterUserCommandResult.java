package com.files.rent_auth_module.application.auth.command.response;

import java.util.UUID;

public record RegisterUserCommandResult(UUID userId, String message) {
    
}
