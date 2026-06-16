package com.files.rent_auth_module.infra.auth.entity;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.files.rent_auth_module.shared.enums.IdentificationEnum;
import com.files.rent_auth_module.shared.enums.RolEnum;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "auth")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Data
public class UserDocument {
    @Id
    private UUID id;
    private String username;
    private String password;
    private String email;
    private String cellphone;
    private String fullname;
    private IdentificationEnum identificationType;
    private String identificationNumber;
    private Instant createAt;
    private Instant updateAt;
    private Set<RolEnum> rols;
    private boolean isEnabled;
}
