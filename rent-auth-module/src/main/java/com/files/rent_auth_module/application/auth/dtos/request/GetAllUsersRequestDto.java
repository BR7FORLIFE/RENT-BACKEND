package com.files.rent_auth_module.application.auth.dtos.request;

import java.util.List;
import java.util.UUID;

public record GetAllUsersRequestDto(List<UUID> usersIds) {

}
