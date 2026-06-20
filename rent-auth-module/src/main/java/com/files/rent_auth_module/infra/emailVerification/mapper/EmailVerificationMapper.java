package com.files.rent_auth_module.infra.emailVerification.mapper;

import com.files.rent_auth_module.domain.emailVerification.model.EmailVerificationModel;
import com.files.rent_auth_module.infra.emailVerification.entity.EmailVerificationDocument;

public class EmailVerificationMapper {
    public static EmailVerificationModel toDomain(EmailVerificationDocument document) {
        return new EmailVerificationModel.EmailVerificationBuilder()
                .id(document.getId())
                .userId(document.getUserId())
                .token(document.getToken())
                .statusEmail(document.getEmailStatus())
                .consumedAt(document.getConsumeAt())
                .createAt(document.getCreateAt())
                .expiredAt(document.getExpiredAt())
                .build();
    }

    public static EmailVerificationDocument toEntity(EmailVerificationModel model) {
        return EmailVerificationDocument.builder()
                .id(model.getId())
                .userId(model.getUserId())
                .token(model.getToken())
                .emailStatus(model.getStatusEmail())
                .consumeAt(model.getConsumedAt())
                .createAt(model.getCreateAt())
                .expiredAt(model.getExpiredAt())
                .build();
    }
}
