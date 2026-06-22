package com.files.rent_auth_module.infra.refreshToken.mapper;

import com.files.rent_auth_module.domain.refreshToken.model.RefreshTokenModel;
import com.files.rent_auth_module.infra.refreshToken.entity.RefreshTokenDocument;

public class RefreshTokenMapper {

    public static RefreshTokenModel toDomain(RefreshTokenDocument document) {
        return new RefreshTokenModel.RefreshTokenBuilder()
                .id(document.getId())
                .userId(document.getUserId())
                .token(document.getToken())
                .expiredAt(document.getExpiredAt())
                .createAt(document.getCreateAt())
                .isRevoked(document.isRevoked())
                .build();
    }

    public static RefreshTokenDocument toEntity(RefreshTokenModel model) {
        return RefreshTokenDocument.builder()
                .id(model.getId())
                .userId(model.getUserId())
                .token(model.getToken())
                .expiredAt(model.getExpiredAt())
                .createAt(model.getCreateAt())
                .isRevoked(model.isRevoked())
                .build();
    }
}
