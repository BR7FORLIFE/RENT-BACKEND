package com.files.rent_auth_module.infra.microserviceIdentification.repository;

import org.springframework.stereotype.Repository;

import com.files.rent_auth_module.application.microserviceIdentification.ports.MicroserviceIdentificationPort;
import com.files.rent_auth_module.domain.microservicesIdentification.MicroserviceIdentificationModel;
import com.files.rent_auth_module.infra.microserviceIdentification.mapper.MicroserviceIdentificationMapper;

import reactor.core.publisher.Mono;

@Repository
public class MicroserviceIdentificationRepositoryAdapter implements MicroserviceIdentificationPort {

    private final IMicroserviceIdentificationRepository microserviceIdentificationRepository;

    public MicroserviceIdentificationRepositoryAdapter(
            IMicroserviceIdentificationRepository microserviceIdentificationRepository) {
        this.microserviceIdentificationRepository = microserviceIdentificationRepository;
    }

    @Override
    public Mono<MicroserviceIdentificationModel> findByClientId(String clientId) {
        return microserviceIdentificationRepository.findByClientId(clientId)
                .map(MicroserviceIdentificationMapper::toDomain);
    }

    @Override
    public Mono<Void> saveMicroserviceIdentification(String microserviceName, String clientId, String clientSecret) {
        MicroserviceIdentificationModel model = MicroserviceIdentificationModel.createDraft(microserviceName, clientId,
                clientSecret);
        return microserviceIdentificationRepository.save(MicroserviceIdentificationMapper.toEntity(model)).then();
    }
}
