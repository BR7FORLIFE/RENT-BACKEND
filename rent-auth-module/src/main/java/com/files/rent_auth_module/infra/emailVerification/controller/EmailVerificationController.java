package com.files.rent_auth_module.infra.emailVerification.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.files.rent_auth_module.application.emailVerification.command.actions.EmailForwardCommand;
import com.files.rent_auth_module.application.emailVerification.command.actions.EmailVerificationCommand;
import com.files.rent_auth_module.application.emailVerification.dtos.request.EmailForwardRequestDto;
import com.files.rent_auth_module.application.emailVerification.dtos.response.EmailForwardResponseDto;
import com.files.rent_auth_module.application.emailVerification.dtos.response.VerifyEmailResponseDto;
import com.files.rent_auth_module.application.emailVerification.usecases.EmailVerificationUseCase;

import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/email")
public class EmailVerificationController {

    private final EmailVerificationUseCase emailVerificationUseCase;

    public EmailVerificationController(EmailVerificationUseCase emailVerificationUseCase) {
        this.emailVerificationUseCase = emailVerificationUseCase;
    }

    @GetMapping("/verify")
    public Mono<ResponseEntity<VerifyEmailResponseDto>> verifyEmail(@RequestParam String token) {
        EmailVerificationCommand cmd = new EmailVerificationCommand(token);

        return emailVerificationUseCase.verificationToken(cmd)
                .map(res -> ResponseEntity.ok().body(new VerifyEmailResponseDto(res.message())));
    }

    @PostMapping("/forward")
    public Mono<ResponseEntity<EmailForwardResponseDto>> forwardEmail(@RequestBody EmailForwardRequestDto dto) {
        EmailForwardCommand cmd = new EmailForwardCommand(dto.userId());

        return emailVerificationUseCase.forwardToken(cmd)
                .map(res -> ResponseEntity.ok().body(new EmailForwardResponseDto(res.message())));
    }

}
