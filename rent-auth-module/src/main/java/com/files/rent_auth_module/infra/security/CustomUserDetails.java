package com.files.rent_auth_module.infra.security;

import java.util.Collection;
import java.util.UUID;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.files.rent_auth_module.domain.auth.UserModel;

public class CustomUserDetails implements UserDetails {
    private UUID userId;
    private String username;
    private String password;
    private boolean isEnabled;
    private Collection<? extends GrantedAuthority> authorities;

    public CustomUserDetails(UserModel userModel) {
        this.userId = userModel.getId();
        this.username = userModel.getUsername();
        this.password = userModel.getPassword();
        this.isEnabled = userModel.isEnabled();
        this.authorities = userModel.getRols()
                .stream()
                .map(rol -> new SimpleGrantedAuthority("ROLE_" + rol.name()))
                .toList();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return this.authorities;
    }

    public UUID getUserId() {
        return userId;
    }

    @Override
    public String getPassword() {
        return this.password;
    }

    @Override
    public String getUsername() {
        return this.username;
    }

    @Override
    public boolean isEnabled() {
        return this.isEnabled;
    }
}
