package com.files.rent_auth_module.application.emailVerification.usecases;

import java.util.UUID;

import com.files.rent_auth_module.application.emailVerification.command.actions.EmailForwardCommand;
import com.files.rent_auth_module.application.emailVerification.command.actions.EmailVerificationCommand;
import com.files.rent_auth_module.application.emailVerification.command.response.EmailForwardCommandResult;
import com.files.rent_auth_module.application.emailVerification.command.response.EmailVerificationCommandResult;

import reactor.core.publisher.Mono;

public interface EmailVerificationUseCase {
    Mono<EmailVerificationCommandResult> verificationToken(EmailVerificationCommand cmd);

    Mono<EmailForwardCommandResult> forwardToken(EmailForwardCommand cmd);

    Mono<Void> sendEmailVerificationToken(UUID userId, String email);
}
