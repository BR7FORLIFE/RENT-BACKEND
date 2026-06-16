package com.files.rent_auth_module.infra.emailVerification.adapters;

import org.springframework.stereotype.Service;

import com.files.rent_auth_module.application.emailVerification.ports.ResendPort;
import com.resend.Resend;

@Service
public class ResendServiceAdapter implements ResendPort {

    private final Resend resend;

    public ResendServiceAdapter(Resend resend) {
        this.resend = resend;
    }
}
