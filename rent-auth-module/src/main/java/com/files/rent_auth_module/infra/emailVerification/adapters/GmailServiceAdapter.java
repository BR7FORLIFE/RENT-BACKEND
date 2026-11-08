package com.files.rent_auth_module.infra.emailVerification.adapters;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Hashtable;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;
import java.util.regex.Pattern;

import javax.naming.NamingException;
import javax.naming.directory.Attributes;
import javax.naming.directory.InitialDirContext;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import com.files.rent_auth_module.application.emailVerification.ports.EmailSenderPort;
import com.files.rent_auth_module.infra.emailVerification.exceptions.DomainEmailNotExists;
import com.files.rent_auth_module.infra.emailVerification.exceptions.EmailProviderException;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

/**
 * Envia correos mediante la API de Gmail (users.messages.send) usando OAuth2
 * con refresh token. El access token se cachea hasta poco antes de expirar.
 */
@Slf4j
@Service
public class GmailServiceAdapter implements EmailSenderPort {

    private static final String TOKEN_URL = "https://oauth2.googleapis.com/token";
    private static final String SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";
    private static final Pattern EMAIL_REGEX = Pattern.compile(
            "^[A-Za-z0-9._%+\\-]+@[A-Za-z0-9](?:[A-Za-z0-9\\-]*[A-Za-z0-9])?(?:\\.[A-Za-z0-9](?:[A-Za-z0-9\\-]*[A-Za-z0-9])?)+$");

    private record CachedToken(String value, Instant expiresAt) {
    }

    private final WebClient webClient;
    private final AtomicReference<CachedToken> cachedToken = new AtomicReference<>();

    @Value("${gmail.client-id}")
    private String clientId;

    @Value("${gmail.client-secret}")
    private String clientSecret;

    @Value("${gmail.refresh-token}")
    private String refreshToken;

    @Value("${gmail.issuer}")
    private String emailIssuer;

    @Value("${gmail.path-verification}")
    private String pathVerification;

    public GmailServiceAdapter() {
        this.webClient = WebClient.create();
    }

    @Override
    public Mono<Void> sendEmail(String to, String code) {
        String recipient = to == null ? "" : to.trim();
        System.out.println(recipient + " RECIPIENT " + code + " CODE");
        return validateRecipient(recipient)
                .then(getAccessToken())
                .flatMap(token -> webClient.post()
                        .uri(SEND_URL)
                        .headers(h -> h.setBearerAuth(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(Map.of("raw", buildRawMessage(recipient, "RENT - VERIFY YOUR EMAIL",
                                createHtml(code))))
                        .retrieve()
                        .toBodilessEntity())
                .onErrorMap(WebClientResponseException.class, this::mapGmailError)
                .then();
    }

    /** Valida formato y que el dominio pueda recibir correo (registros MX/A). */
    private Mono<Void> validateRecipient(String email) {
        if (!EMAIL_REGEX.matcher(email).matches()) {
            log.warn("Email rechazado por formato: '{}'", email);
            return Mono.error(new DomainEmailNotExists());
        }
        String domain = email.substring(email.indexOf('@') + 1);
        return Mono.fromCallable(() -> domainAcceptsMail(domain))
                .subscribeOn(Schedulers.boundedElastic())
                .flatMap(ok -> {
                    if (!ok) {
                        log.warn("Email rechazado: el dominio '{}' no tiene registros DNS", domain);
                    }
                    return ok ? Mono.<Void>empty() : Mono.error(new DomainEmailNotExists());
                });
    }

    private boolean domainAcceptsMail(String domain) {
        // 1) resolvedor del sistema (el mismo que usa el contenedor para llamar a Gmail)
        try {
            InetAddress.getAllByName(domain);
            return true;
        } catch (UnknownHostException e) {
            log.debug("Sin registro A/AAAA para '{}', se intenta MX", domain);
        }

        // 2) dominios que solo tienen MX (sin A)
        Hashtable<String, String> env = new Hashtable<>();
        env.put("java.naming.factory.initial", "com.sun.jndi.dns.DnsContextFactory");
        env.put("com.sun.jndi.dns.timeout.initial", "3000");
        env.put("com.sun.jndi.dns.timeout.retries", "1");
        try {
            var ctx = new InitialDirContext(env);
            try {
                Attributes attrs = ctx.getAttributes(domain, new String[] { "MX" });
                return attrs != null && attrs.size() > 0;
            } finally {
                ctx.close();
            }
        } catch (javax.naming.NameNotFoundException e) {
            return false;
        } catch (NamingException e) {
            log.warn("Fallo DNS al validar '{}', se omite la validacion: {}", domain, e.toString());
            return true;
        }
    }

    private Mono<String> getAccessToken() {
        CachedToken current = cachedToken.get();
        System.out.println("ACCESS TOKEN: " + current);
        if (current != null && current.expiresAt().isAfter(Instant.now().plusSeconds(60))) {
            return Mono.just(current.value());
        }

        return webClient.post()
                .uri(TOKEN_URL)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData("client_id", clientId)
                        .with("client_secret", clientSecret)
                        .with("refresh_token", refreshToken)
                        .with("grant_type", "refresh_token"))
                .retrieve()
                .bodyToMono(Map.class)
                .map(res -> {
                    String token = (String) res.get("access_token");
                    if (token == null) {
                        throw new EmailProviderException();
                    }
                    long ttl = res.get("expires_in") instanceof Number n ? n.longValue() : 3300L;
                    cachedToken.set(new CachedToken(token, Instant.now().plusSeconds(ttl)));
                    return token;
                })
                .onErrorMap(WebClientResponseException.class, e -> new EmailProviderException());
    }

    private Throwable mapGmailError(WebClientResponseException e) {
        if (e.getStatusCode().value() == 401) {
            cachedToken.set(null);
        }
        if (e.getStatusCode().value() == 400) {
            String body = e.getResponseBodyAsString();
            log.error("Gmail API respondio {}: {}", e.getStatusCode(), body);
            if (body.toLowerCase().contains("invalid to header")) {
                return new DomainEmailNotExists();
            }
        } else {
            log.error("Gmail API respondio {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
        }
        return new EmailProviderException();
    }

    private String buildRawMessage(String to, String subject, String html) {
        Base64.Encoder mime = Base64.getMimeEncoder(76, "\r\n".getBytes(StandardCharsets.US_ASCII));
        String encodedSubject = "=?UTF-8?B?"
                + Base64.getEncoder().encodeToString(subject.getBytes(StandardCharsets.UTF_8)) + "?=";

        String message = "From: " + emailIssuer + "\r\n"
                + "To: " + to + "\r\n"
                + "Subject: " + encodedSubject + "\r\n"
                + "MIME-Version: 1.0\r\n"
                + "Content-Type: text/html; charset=UTF-8\r\n"
                + "Content-Transfer-Encoding: base64\r\n\r\n"
                + mime.encodeToString(html.getBytes(StandardCharsets.UTF_8));

        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(message.getBytes(StandardCharsets.UTF_8));
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
