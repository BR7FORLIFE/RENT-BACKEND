package com.files.rent_auth_module.domain.emailVerification.service;


import com.files.rent_auth_module.application.emailVerification.exceptions.EmailVerificationConsumedException;
import com.files.rent_auth_module.application.emailVerification.exceptions.EmailVerificationRevockedException;
import com.files.rent_auth_module.domain.emailVerification.model.EmailVerificationModel;
import com.files.rent_auth_module.shared.enums.StatusEmail;

public class EmailVerificationService {

    public static void validateEmailVerification(EmailVerificationModel model){
        // verificamos que el token no este revocado
        if (model.getStatusEmail().equals(StatusEmail.REVOKED)) {
            throw new EmailVerificationRevockedException();
        }

        // verificamos su fecha expiracion y que no este consumido
        if (model.getStatusEmail().equals(StatusEmail.CONSUMED)) {
            throw new EmailVerificationConsumedException();
        }

    }
}
