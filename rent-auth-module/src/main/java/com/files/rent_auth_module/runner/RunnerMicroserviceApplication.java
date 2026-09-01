package com.files.rent_auth_module.runner;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.files.rent_auth_module.application.microserviceIdentification.ports.MicroserviceIdentificationPort;

//este command line runner me ayudará a recrear los clientId y clientSecret de cada microservicio
@Component
public class RunnerMicroserviceApplication implements CommandLineRunner {

    @Value("${microservicesIdentification.rentFinancialSecret}")
    private String rentFinancialSecret;

    private final MicroserviceIdentificationPort microserviceIdentificationPort;
    private final PasswordEncoder passwordEncoder;

    public RunnerMicroserviceApplication(MicroserviceIdentificationPort microserviceIdentificationPort,
            PasswordEncoder passwordEncoder) {
        this.microserviceIdentificationPort = microserviceIdentificationPort;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // microservicio de financial
        this.microserviceIdentificationPort
                .findByClientId("rent-financial")
                .switchIfEmpty(
                        this.microserviceIdentificationPort
                                .saveMicroserviceIdentification(
                                        "financial",
                                        "rent-financial",
                                        passwordEncoder.encode(rentFinancialSecret))
                                .then(
                                        this.microserviceIdentificationPort
                                                .findByClientId("rent-financial")))
                .then()
                .subscribe();
    }
}
