package com.files.rent_auth_module.domain.refreshToken.model;

import java.time.Instant;
import java.util.UUID;

public class RefreshTokenModel {
    private UUID id;
    private UUID userId;
    private String token;
    private Instant expiredAt;
    private Instant createAt;
    private boolean isRevoked;

    private RefreshTokenModel(RefreshTokenBuilder builder) {
        this.id = builder.id;
        this.userId = builder.userId;
        this.token = builder.token;
        this.expiredAt = builder.expiredAt;
        this.createAt = builder.createAt;
        this.isRevoked = builder.isRevoked;
    }

    private RefreshTokenModel(RefreshTokenBuilderDraft draft) {
        this.id = UUID.randomUUID();
        this.userId = draft.userId;
        this.token = draft.token;
        this.expiredAt = draft.expiredAt;
        this.createAt = Instant.now();
        this.isRevoked = false;
    }

    public static class RefreshTokenBuilderDraft {
        private UUID userId;
        private String token;
        private Instant expiredAt;

        public RefreshTokenBuilderDraft userId(UUID userId) {
            this.userId = userId;
            return this;
        }

        public RefreshTokenBuilderDraft token(String token) {
            this.token = token;
            return this;
        }

        public RefreshTokenBuilderDraft expiredAt(Instant expiredAt) {
            this.expiredAt = expiredAt;
            return this;
        }

        public RefreshTokenModel build() {
            return new RefreshTokenModel(this);
        }
    }

    public static class RefreshTokenBuilder {
        private UUID id;
        private UUID userId;
        private String token;
        private Instant expiredAt;
        private Instant createAt;
        private boolean isRevoked;

        public RefreshTokenBuilder id(UUID id) {
            this.id = id;
            return this;
        }

        public RefreshTokenBuilder userId(UUID userId) {
            this.userId = userId;
            return this;
        }

        public RefreshTokenBuilder token(String token) {
            this.token = token;
            return this;
        }

        public RefreshTokenBuilder expiredAt(Instant expiredAt) {
            this.expiredAt = expiredAt;
            return this;
        }

        public RefreshTokenBuilder createAt(Instant createAt) {
            this.createAt = createAt;
            return this;
        }

        public RefreshTokenBuilder isRevoked(boolean isRevoked) {
            this.isRevoked = isRevoked;
            return this;
        }

        public RefreshTokenModel build() {
            return new RefreshTokenModel(this);
        }
    }

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getToken() {
        return token;
    }

    public Instant getExpiredAt() {
        return expiredAt;
    }

    public Instant getCreateAt() {
        return createAt;
    }

    public boolean isRevoked() {
        return isRevoked;
    }

}
