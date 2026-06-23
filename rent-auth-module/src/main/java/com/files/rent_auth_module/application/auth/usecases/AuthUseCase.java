package com.files.rent_auth_module.application.auth.usecases;

import com.files.rent_auth_module.application.auth.command.actions.LoginUserUserCommand;
import com.files.rent_auth_module.application.auth.command.actions.RegisterUserCommand;
import com.files.rent_auth_module.application.auth.command.response.LoginUserCommandResult;
import com.files.rent_auth_module.application.auth.command.response.RegisterUserCommandResult;

import reactor.core.publisher.Mono;

public interface AuthUseCase {
    Mono<RegisterUserCommandResult> register(RegisterUserCommand cmd);

    Mono<LoginUserCommandResult> login(LoginUserUserCommand cmd);

    Mono<String> logout();
}
