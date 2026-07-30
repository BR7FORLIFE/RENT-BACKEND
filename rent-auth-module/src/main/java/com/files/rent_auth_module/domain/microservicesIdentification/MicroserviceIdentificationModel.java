package com.files.rent_auth_module.domain.microservicesIdentification;

import java.time.Instant;
import java.util.UUID;

public class MicroserviceIdentificationModel {
    private UUID id;
    private String microserviceName;
    private String clientId;
    private String clientSecret;
    private Instant createAt;
    private Instant updateAt;

    private MicroserviceIdentificationModel(UUID id, String microserviceName, String clientId, String clientSecret,
            Instant createAt, Instant updateAt) {
        this.id = id;
        this.microserviceName = microserviceName;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.createAt = createAt;
        this.updateAt = updateAt;
    }

    public static MicroserviceIdentificationModel createDraft(
            String microserviceName,
            String clientId,
            String clientSecret) {
        return new MicroserviceIdentificationModel(
                UUID.randomUUID(),
                microserviceName,
                clientId,
                clientSecret,
                Instant.now(),
                Instant.now());
    }

    public static MicroserviceIdentificationModel createNew(
            UUID id,
            String microserviceName,
            String clientId,
            String clientSecret,
            Instant createAt,
            Instant updateAt) {
        return new MicroserviceIdentificationModel(id, microserviceName, clientId, clientSecret, createAt, updateAt);
    }

    public UUID getId() {
        return id;
    }

    public String getMicroserviceName() {
        return microserviceName;
    }

    public String getClientId() {
        return clientId;
    }

    public String getClientSecret() {
        return clientSecret;
    }

    public Instant getCreateAt() {
        return createAt;
    }

    public Instant getUpdateAt() {
        return updateAt;
    }

}
