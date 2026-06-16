package com.files.rent_auth_module.infra.emailVerification.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.files.rent_auth_module.application.emailVerification.dtos.response.VerifyEmailResponseDto;

@RestController
@RequestMapping("/email")
public class EmailVerificationController {

    @GetMapping("/verify")
    public ResponseEntity<VerifyEmailResponseDto> verifyEmail(@RequestParam String token) {
        return null;
    }

    
}
