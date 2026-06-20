package com.files.rent_auth_module.config;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

import org.springframework.stereotype.Component;

@Component
public class GenerateCodeService {
    private final SecureRandom secureRandom = new SecureRandom(); // <- generador de numeros aleatorios con gran
                                                                  // entropia

    public String sha256(String value) {
        try {
            MessageDigest sha = MessageDigest.getInstance("SHA-256");
            byte[] digest = sha.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public String randomBase64(int bytes) {
        byte[] b = new byte[bytes];

        // asigna a cada bit de b un bit con entropia para usar
        secureRandom.nextBytes(b);
        /**
         * Convierte a base64 especializado para url gracias a UrlEncoder
         * 
         * -> withoutPadding() -> es para eliminar el tipico ' = ' cuando es multiplo de
         * 3
         */
        return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }

    public boolean slowEquals(String originalHash, String hashToCompare) {
        if (originalHash == null || hashToCompare == null) {
            return false;
        }

        // obtenemos los bytes de cada cadena hash
        byte[] a = originalHash.getBytes(StandardCharsets.UTF_8);
        byte[] b = hashToCompare.getBytes(StandardCharsets.UTF_8);

        // comparamos si son iguales
        return MessageDigest.isEqual(a, b);
    }
}
