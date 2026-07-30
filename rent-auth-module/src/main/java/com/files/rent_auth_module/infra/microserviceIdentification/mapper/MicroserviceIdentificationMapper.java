package com.files.rent_auth_module.infra.microserviceIdentification.mapper;

import com.files.rent_auth_module.domain.microservicesIdentification.MicroserviceIdentificationModel;
import com.files.rent_auth_module.infra.microserviceIdentification.entity.MicroserviceIdentificationDocument;

public class MicroserviceIdentificationMapper {
    public static MicroserviceIdentificationModel toDomain(MicroserviceIdentificationDocument document) {
        return MicroserviceIdentificationModel.createNew(
                document.getId(),
                document.getMicroserviceName(),
                document.getClientId(),
                document.getClientSecret(),
                document.getCreateAt(),
                document.getUpdateAt());
    }

    public static MicroserviceIdentificationDocument toEntity(MicroserviceIdentificationModel model) {
        return MicroserviceIdentificationDocument
                .builder()
                .id(model.getId())
                .microserviceName(model.getMicroserviceName())
                .clientId(model.getClientId())
                .clientSecret(model.getClientSecret())
                .createAt(model.getCreateAt())
                .updateAt(model.getUpdateAt())
                .build();
    }
}
