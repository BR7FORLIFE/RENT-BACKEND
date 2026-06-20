package com.files.rent_auth_module.domain.emailVerification.model;

import java.time.Instant;
import java.util.UUID;

import com.files.rent_auth_module.shared.enums.StatusEmail;

public class EmailVerificationModel {
    private UUID id;
    private UUID userId;
    private String token;
    private StatusEmail statusEmail;
    private Instant consumedAt;
    private Instant createAt;
    private Instant expiredAt;

    public EmailVerificationModel(EmailVerificationBuilder builder) {
        this.id = builder.id;
        this.userId = builder.userId;
        this.token = builder.token;
        this.statusEmail = builder.statusEmail;
        this.consumedAt = builder.consumedAt;
        this.createAt = builder.createAt;
        this.expiredAt = builder.expiredAt;
    }

    public static EmailVerificationModel createDraft(UUID userId, String token, Instant expiredAt) {
        return new EmailVerificationModel(
                UUID.randomUUID(),
                userId,
                token,
                StatusEmail.PENDING,
                null,
                Instant.now(),
                expiredAt);
    }

    public static EmailVerificationModel changeStatusEmail(EmailVerificationModel model, StatusEmail statusEmail) {
        return new EmailVerificationModel(
                model.getId(),
                model.getUserId(),
                model.getToken(),
                statusEmail,
                model.getConsumedAt(),
                model.getCreateAt(),
                model.getExpiredAt());
    }

    private EmailVerificationModel(UUID id, UUID userId, String token, StatusEmail statusEmail, Instant consumedAt,
            Instant createAt, Instant expiredAt) {
        this.id = id;
        this.userId = userId;
        this.token = token;
        this.statusEmail = statusEmail;
        this.consumedAt = consumedAt;
        this.createAt = createAt;
        this.expiredAt = expiredAt;
    }

    public static class EmailVerificationBuilder {
        private UUID id;
        private UUID userId;
        private String token;
        private StatusEmail statusEmail;
        private Instant consumedAt;
        private Instant createAt;
        private Instant expiredAt;

        public EmailVerificationBuilder id(UUID id) {
            this.id = id;
            return this;
        }

        public EmailVerificationBuilder userId(UUID userId) {
            this.userId = userId;
            return this;
        }

        public EmailVerificationBuilder token(String token) {
            this.token = token;
            return this;
        }

        public EmailVerificationBuilder statusEmail(StatusEmail statusEmail) {
            this.statusEmail = statusEmail;
            return this;
        }

        public EmailVerificationBuilder consumedAt(Instant consumedAt) {
            this.consumedAt = consumedAt;
            return this;
        }

        public EmailVerificationBuilder createAt(Instant createAt) {
            this.createAt = createAt;
            return this;
        }

        public EmailVerificationBuilder expiredAt(Instant expiredAt) {
            this.expiredAt = expiredAt;
            return this;
        }

        public EmailVerificationModel build() {
            return new EmailVerificationModel(this);
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

    public StatusEmail getStatusEmail() {
        return statusEmail;
    }

    public Instant getConsumedAt() {
        return consumedAt;
    }

    public Instant getCreateAt() {
        return createAt;
    }

    public Instant getExpiredAt() {
        return expiredAt;
    }

}
