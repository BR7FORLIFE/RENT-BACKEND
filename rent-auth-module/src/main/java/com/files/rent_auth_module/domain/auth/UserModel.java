package com.files.rent_auth_module.domain.auth;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

import com.files.rent_auth_module.shared.enums.IdentificationEnum;
import com.files.rent_auth_module.shared.enums.RolEnum;

public class UserModel {
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

    public static UserModel changeStatus(UserModel model, boolean isEnabled) {
        return new UserModel(
                model.getId(),
                model.getUsername(),
                model.getPassword(),
                model.getEmail(),
                model.getCellphone(),
                model.getFullname(),
                model.getIdentificationType(),
                model.getIdentificationNumber(),
                model.getCreateAt(),
                model.getUpdateAt(),
                model.getRols(),
                isEnabled);
    }

    private UserModel(UUID id, String username, String password, String email, String cellphone, String fullname,
            IdentificationEnum identificationType, String identificationNumber, Instant createAt, Instant updateAt,
            Set<RolEnum> rols, boolean isEnabled) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.email = email;
        this.cellphone = cellphone;
        this.fullname = fullname;
        this.identificationType = identificationType;
        this.identificationNumber = identificationNumber;
        this.createAt = createAt;
        this.updateAt = updateAt;
        this.rols = rols;
        this.isEnabled = isEnabled;
    }

    private UserModel(UserBuilder builder) {
        this.id = builder.id;
        this.username = builder.username;
        this.password = builder.password;
        this.email = builder.email;
        this.cellphone = builder.cellphone;
        this.fullname = builder.fullname;
        this.identificationType = builder.identificationType;
        this.identificationNumber = builder.identificationNumber;
        this.createAt = builder.createAt;
        this.updateAt = builder.updateAt;
        this.rols = builder.rols;
        this.isEnabled = builder.isEnabled;
    }

    private UserModel(UserBuilderDraft builder) {
        this.id = UUID.randomUUID();
        this.username = builder.username;
        this.password = builder.password;
        this.email = builder.email;
        this.cellphone = builder.cellphone;
        this.fullname = builder.fullname;
        this.identificationType = builder.identificationType;
        this.identificationNumber = builder.identificationNumber;
        this.createAt = Instant.now();
        this.updateAt = Instant.now();
        this.rols = Set.of(RolEnum.USER);
        this.isEnabled = false;
    }

    public static class UserBuilder {
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

        public UserBuilder id(UUID id) {
            this.id = id;
            return this;
        }

        public UserBuilder username(String username) {
            this.username = username;
            return this;
        }

        public UserBuilder password(String password) {
            this.password = password;
            return this;
        }

        public UserBuilder email(String email) {
            this.email = email;
            return this;
        }

        public UserBuilder cellphone(String cellphone) {
            this.cellphone = cellphone;
            return this;
        }

        public UserBuilder fullname(String fullname) {
            this.fullname = fullname;
            return this;
        }

        public UserBuilder identificationType(IdentificationEnum identificationEnum) {
            this.identificationType = identificationEnum;
            return this;
        }

        public UserBuilder identificationNumber(String identificationNumber) {
            this.identificationNumber = identificationNumber;
            return this;
        }

        public UserBuilder createAt(Instant createAt) {
            this.createAt = createAt;
            return this;
        }

        public UserBuilder updateAt(Instant updateAt) {
            this.updateAt = updateAt;
            return this;
        }

        public UserBuilder rols(Set<RolEnum> rols) {
            this.rols = rols;
            return this;
        }

        public UserBuilder isEnabled(boolean isEnabled) {
            this.isEnabled = isEnabled;
            return this;
        }

        public UserModel build() {
            return new UserModel(this);
        }
    }

    public static class UserBuilderDraft {
        private String username;
        private String password;
        private String email;
        private String cellphone;
        private String fullname;
        private IdentificationEnum identificationType;
        private String identificationNumber;

        public UserBuilderDraft username(String username) {
            this.username = username;
            return this;
        }

        public UserBuilderDraft password(String password) {
            this.password = password;
            return this;
        }

        public UserBuilderDraft email(String email) {
            this.email = email;
            return this;
        }

        public UserBuilderDraft cellphone(String cellphone) {
            this.cellphone = cellphone;
            return this;
        }

        public UserBuilderDraft fullname(String fullname) {
            this.fullname = fullname;
            return this;
        }

        public UserBuilderDraft identificationType(IdentificationEnum identificationEnum) {
            this.identificationType = identificationEnum;
            return this;
        }

        public UserBuilderDraft identificationNumber(String identificationNumber) {
            this.identificationNumber = identificationNumber;
            return this;
        }

        public UserModel build() {
            return new UserModel(this);
        }
    }

    public UUID getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getPassword() {
        return password;
    }

    public String getEmail() {
        return email;
    }

    public String getCellphone() {
        return cellphone;
    }

    public String getFullname() {
        return fullname;
    }

    public IdentificationEnum getIdentificationType() {
        return identificationType;
    }

    public String getIdentificationNumber() {
        return identificationNumber;
    }

    public Instant getCreateAt() {
        return createAt;
    }

    public Instant getUpdateAt() {
        return updateAt;
    }

    public Set<RolEnum> getRols() {
        return rols;
    }

    public boolean isEnabled() {
        return isEnabled;
    }

}
