package com.files.rent_auth_module.infra.refreshToken.entity;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "refreshToken")
@NoArgsConstructor
@AllArgsConstructor
@Data
@Builder
public class RefreshTokenDocument {
    private UUID id;
    private UUID userId;
    private String token;
    private Instant expiredAt;
    private Instant createAt;
    private boolean isRevoked;
}
