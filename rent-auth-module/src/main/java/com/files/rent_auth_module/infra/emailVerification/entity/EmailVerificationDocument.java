package com.files.rent_auth_module.infra.emailVerification.entity;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.files.rent_auth_module.shared.enums.StatusEmail;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "email-verification")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class EmailVerificationDocument {
    @Id
    private UUID id;
    private UUID userId;
    private String token;
    private StatusEmail emailStatus;
    private Instant createAt;
    private Instant consumeAt;
    private Instant expiredAt;
}
