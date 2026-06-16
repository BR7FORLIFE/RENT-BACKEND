package com.files.rent_auth_module.infra.auth.mapper;

import com.files.rent_auth_module.domain.auth.UserModel;
import com.files.rent_auth_module.infra.auth.entity.UserDocument;

public class UserMapper {

    public static UserModel toDomain(UserDocument document) {
        return new UserModel.UserBuilder()
                .id(document.getId())
                .username(document.getUsername())
                .password(document.getPassword())
                .email(document.getEmail())
                .cellphone(document.getCellphone())
                .fullname(document.getFullname())
                .identificationType(document.getIdentificationType())
                .identificationNumber(document.getIdentificationNumber())
                .createAt(document.getCreateAt())
                .updateAt(document.getUpdateAt())
                .rols(document.getRols())
                .isEnabled(document.isEnabled())
                .build();
    }

    public static UserDocument toEntity(UserModel userModel) {
        new UserDocument();
        return UserDocument.builder()
                .id(userModel.getId())
                .username(userModel.getUsername())
                .password(userModel.getPassword())
                .email(userModel.getEmail())
                .cellphone(userModel.getCellphone())
                .fullname(userModel.getFullname())
                .identificationType(userModel.getIdentificationType())
                .identificationNumber(userModel.getIdentificationNumber())
                .createAt(userModel.getCreateAt())
                .updateAt(userModel.getUpdateAt())
                .rols(userModel.getRols())
                .isEnabled(userModel.isEnabled())
                .build();
    }
}
