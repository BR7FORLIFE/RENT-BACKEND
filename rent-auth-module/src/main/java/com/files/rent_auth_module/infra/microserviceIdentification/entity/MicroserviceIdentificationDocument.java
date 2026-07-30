package com.files.rent_auth_module.infra.microserviceIdentification.entity;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Data
@Document(collection = "microservice_identification")
public class MicroserviceIdentificationDocument {
    @Id
    private UUID id;
    private String microserviceName;
    private String clientId;
    private String clientSecret;
    private Instant createAt;
    private Instant updateAt;
}
