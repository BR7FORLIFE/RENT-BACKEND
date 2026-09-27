package com.files.rent_auth_module.config;

import java.io.IOException;
import java.security.KeyFactory;
import java.security.NoSuchAlgorithmException;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RSAKeyExtract {

        @Value("${jwt.private-key}")
        private String privateKey;

        @Value("${jwt.public-key}")
        private String publicKey;

        @Bean
        public RSAPublicKey rsaPublicKey() throws IOException, NoSuchAlgorithmException, InvalidKeySpecException {
                String pem = new String(
                                Base64.getDecoder().decode(publicKey),
                                java.nio.charset.StandardCharsets.UTF_8);

                String key = pem.replace("-----BEGIN PUBLIC KEY-----", "").replace("-----END PUBLIC KEY-----", "")
                                .replaceAll("\\s", "");

                byte[] decoded = Base64.getDecoder()
                                .decode(key);

                X509EncodedKeySpec spec = new X509EncodedKeySpec(decoded);

                KeyFactory keyFactory = KeyFactory.getInstance("RSA");

                return (RSAPublicKey) keyFactory.generatePublic(spec);
        }

        @Bean
        public RSAPrivateKey rsaPrivateKey() throws IOException, NoSuchAlgorithmException, InvalidKeySpecException {
                String pem = new String(
                                Base64.getDecoder().decode(privateKey),
                                java.nio.charset.StandardCharsets.UTF_8);

                String key = pem
                                .replace(
                                                "-----BEGIN PRIVATE KEY-----",
                                                "")
                                .replace(
                                                "-----END PRIVATE KEY-----",
                                                "")
                                .replaceAll("\\s", "");

                byte[] decoded = Base64.getDecoder()
                                .decode(key);

                PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(decoded);

                KeyFactory keyFactory = KeyFactory.getInstance("RSA");

                return (RSAPrivateKey) keyFactory.generatePrivate(spec);
        }
}
