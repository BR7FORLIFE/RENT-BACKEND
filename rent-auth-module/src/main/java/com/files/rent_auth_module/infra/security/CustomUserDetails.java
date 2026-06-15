package com.files.rent_auth_module.infra.security;

import java.util.Collection;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.files.rent_auth_module.domain.UserModel;

public class CustomUserDetails implements UserDetails {

    public CustomUserDetails(UserModel userModel) {

    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return null;
    }

    @Override
    public String getPassword() {
        return null;
    }

    @Override
    public String getUsername() {
        return null;
    }
}
