package com.files.rent_auth_module.application.auth.usecases;

import com.files.rent_auth_module.application.auth.command.actions.LoginUserUserCommand;
import com.files.rent_auth_module.application.auth.command.actions.RegisterUserCommand;
import com.files.rent_auth_module.application.auth.command.response.LoginUserCommandResult;
import com.files.rent_auth_module.application.auth.command.response.RegisterUserCommandResult;
import com.files.rent_auth_module.application.refreshToken.command.response.GenerateRefreshTokenCommandResult;

import reactor.core.publisher.Mono;

public interface AuthUseCase {
    Mono<RegisterUserCommandResult> register(RegisterUserCommand cmd);

    Mono<LoginUserCommandResult> login(LoginUserUserCommand cmd);

    Mono<String> oauth2Login(String username, String email, String cellphone,
            String fullname);

    Mono<GenerateRefreshTokenCommandResult> oauth2GetCredentials(String oauth2SessionID);

    Mono<String> logout();
}
