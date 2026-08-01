package com.files.rent_auth_module.application.auth.command.response;

import java.util.UUID;

public record MeCommandResult(UUID userId, String username, String email, String cellphone, String fullname,
        boolean isEnabled) {

}
