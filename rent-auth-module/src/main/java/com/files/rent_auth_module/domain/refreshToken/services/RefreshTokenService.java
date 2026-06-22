package com.files.rent_auth_module.domain.refreshToken.services;

import com.files.rent_auth_module.domain.refreshToken.model.RefreshTokenModel;

public class RefreshTokenService {
    public static RefreshTokenModel revokedRefresh(RefreshTokenModel model) {
        return new RefreshTokenModel.RefreshTokenBuilder()
                .id(model.getId())
                .userId(model.getUserId())
                .token(model.getToken())
                .expiredAt(model.getExpiredAt())
                .createAt(model.getCreateAt())
                .isRevoked(true)
                .build();
    }
}
