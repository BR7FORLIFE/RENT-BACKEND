package com.files.rent_auth_module.application.auth.usecases;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.files.rent_auth_module.application.auth.command.actions.LoginUserUserCommand;
import com.files.rent_auth_module.application.auth.command.actions.RegisterUserCommand;
import com.files.rent_auth_module.application.auth.command.response.LoginUserCommandResult;
import com.files.rent_auth_module.application.auth.command.response.MeCommandResult;
import com.files.rent_auth_module.application.auth.command.response.RegisterUserCommandResult;
import com.files.rent_auth_module.application.auth.command.response.UsersCommandResult;
import com.files.rent_auth_module.application.refreshToken.command.response.GenerateRefreshTokenCommandResult;

import reactor.core.publisher.Mono;

public interface AuthUseCase {
    Mono<RegisterUserCommandResult> register(RegisterUserCommand cmd);

    Mono<LoginUserCommandResult> login(LoginUserUserCommand cmd);

    Mono<String> oauth2Login(String username, String email, String cellphone,
            String fullname);

    Mono<GenerateRefreshTokenCommandResult> oauth2GetCredentials(String oauth2SessionID);

    Mono<Map<String, String>> editUserInfo(UUID userId, String username, String cellphone);

    Mono<MeCommandResult> me(UUID userId);

    Mono<MeCommandResult> me(String email);

    Mono<UsersCommandResult> getAllUsers(List<UUID> usersIds);

    Mono<String> logout();
}
