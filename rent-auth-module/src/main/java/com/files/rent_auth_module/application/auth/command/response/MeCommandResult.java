package com.files.rent_auth_module.application.auth.command.response;

public record MeCommandResult(String username, String email, String cellphone, String fullname, boolean isEnabled) {

}
