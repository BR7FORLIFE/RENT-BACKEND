package com.files.rent_auth_module.infra.emailVerification.adapters;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.files.rent_auth_module.application.emailVerification.ports.ResendPort;
import com.resend.Resend;
import com.resend.services.emails.model.CreateEmailOptions;

import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Service
public class ResendServiceAdapter implements ResendPort {

    private final Resend resend;

    @Value("${resend.path-verification}")
    private String pathVerification;

    public ResendServiceAdapter(Resend resend) {
        this.resend = resend;
    }

    @Value("${resend.issuer}")
    private String emailIssuer;

    public Mono<Void> sendEmail(String to, String code) {
        return Mono.fromCallable(() -> {
            CreateEmailOptions options = new CreateEmailOptions.Builder()
                    .from(emailIssuer)
                    .to(to)
                    .subject("RENT - VERIFY YOUR EMAIL")
                    .html(createHtml(code))
                    .build();

            return resend.emails().send(options);
        }).subscribeOn(Schedulers.boundedElastic()).then();
    }

    private String createHtml(String code) {

        String pathWithCodeVerification = pathVerification + code;

        String htmlVerification = String.format("""
                <!DOCTYPE html>
                <html lang="es">
                <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Verificación de correo electrónico</title>
                </head>

                <body style="margin:0;padding:0;background-color:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">

                <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
                <tr>
                <td align="center">

                <table width="600" cellpadding="0" cellspacing="0"
                style="
                background:#ffffff;
                border-radius:18px;
                overflow:hidden;
                box-shadow:0 10px 30px rgba(0,0,0,0.12);
                ">

                <tr>
                <td align="center"
                style="
                padding:50px 40px;
                background:#111111;
                ">

                <h1 style="
                margin:0;
                color:#ffffff;
                font-size:34px;
                font-weight:bold;
                letter-spacing:1px;
                ">
                RENT
                </h1>

                <p style="
                margin-top:14px;
                color:#d1d5db;
                font-size:16px;
                ">
                Plataforma integral de gestión de arrendamientos
                </p>

                </td>
                </tr>

                <tr>
                <td style="padding:50px;">

                <h2 style="
                margin-top:0;
                margin-bottom:20px;
                color:#111111;
                font-size:28px;
                ">
                Verifica tu correo electrónico
                </h2>

                <p style="
                font-size:16px;
                color:#4b5563;
                line-height:1.8;
                ">
                Bienvenido a <strong>RENT</strong>.
                Para activar tu cuenta y comenzar a utilizar la plataforma,
                es necesario verificar tu dirección de correo electrónico.
                </p>

                <p style="
                font-size:16px;
                color:#4b5563;
                line-height:1.8;
                ">
                Haz clic en el siguiente botón para completar el proceso de verificación.
                </p>

                <table width="100%%" cellpadding="0" cellspacing="0" style="margin:40px 0;">
                <tr>
                <td align="center">

                <a href="%s"
                style="
                background:#111111;
                color:#ffffff;
                text-decoration:none;
                padding:16px 36px;
                border-radius:10px;
                display:inline-block;
                font-size:16px;
                font-weight:bold;
                ">
                Verificar Correo
                </a>

                </td>
                </tr>
                </table>

                <p style="
                font-size:14px;
                color:#6b7280;
                line-height:1.8;
                ">
                Si el botón anterior no funciona, copia y pega el siguiente enlace en tu navegador:
                </p>

                <p style="
                word-break:break-all;
                font-size:13px;
                color:#111111;
                font-weight:bold;
                ">
                %s
                </p>

                <hr style="
                border:none;
                border-top:1px solid #e5e7eb;
                margin:35px 0;
                ">

                <p style="
                font-size:14px;
                color:#6b7280;
                line-height:1.8;
                ">
                Si no solicitaste la creación de una cuenta en RENT,
                puedes ignorar este mensaje de forma segura.
                </p>

                </td>
                </tr>

                <tr>
                <td align="center"
                style="
                padding:24px;
                background:#fafafa;
                border-top:1px solid #e5e7eb;
                ">

                <p style="
                margin:0;
                font-size:13px;
                color:#6b7280;
                ">
                © 2026 BR7 RENT. Todos los derechos reservados.
                </p>

                </td>
                </tr>

                </table>

                </td>
                </tr>
                </table>

                </body>
                </html>
                """, pathWithCodeVerification, pathWithCodeVerification);

        return htmlVerification;
    }

}
