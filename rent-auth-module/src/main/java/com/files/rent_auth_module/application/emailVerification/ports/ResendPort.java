package com.files.rent_auth_module.application.emailVerification.ports;

import reactor.core.publisher.Mono;

public interface ResendPort {
    Mono<Void> sendEmail(String to, String code);
}
