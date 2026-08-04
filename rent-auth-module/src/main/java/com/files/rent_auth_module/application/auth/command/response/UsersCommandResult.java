package com.files.rent_auth_module.application.auth.command.response;

import java.util.List;

import com.files.rent_auth_module.application.auth.dtos.response.MeResponseDto;

public record UsersCommandResult(List<MeResponseDto> users) {

}
