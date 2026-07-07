package com.files.rent_auth_module.application.auth.orchestator;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.files.rent_auth_module.application.auth.command.actions.LoginUserUserCommand;
import com.files.rent_auth_module.application.auth.command.actions.RegisterUserCommand;
import com.files.rent_auth_module.application.auth.command.response.LoginUserCommandResult;
import com.files.rent_auth_module.application.auth.command.response.RegisterUserCommandResult;
import com.files.rent_auth_module.application.auth.exceptions.AuthExceptions;
import com.files.rent_auth_module.application.auth.ports.AuthRepositoryPort;
import com.files.rent_auth_module.application.auth.ports.CachePort;
import com.files.rent_auth_module.application.auth.usecases.AuthUseCase;
import com.files.rent_auth_module.application.emailVerification.ports.EmailVerificationPort;
import com.files.rent_auth_module.application.emailVerification.usecases.EmailVerificationUseCase;
import com.files.rent_auth_module.application.refreshToken.command.response.GenerateRefreshTokenCommandResult;
import com.files.rent_auth_module.application.refreshToken.ports.RefreshTokenRepositoryPort;
import com.files.rent_auth_module.application.refreshToken.usecases.RefreshTokenUseCase;
import com.files.rent_auth_module.config.GenerateCodeService;
import com.files.rent_auth_module.domain.auth.UserModel;
import com.files.rent_auth_module.shared.enums.IdentificationEnum;
import com.files.rent_auth_module.shared.enums.RolEnum;

import reactor.core.publisher.Mono;

@Service
public class AuthUseCaseImp implements AuthUseCase {

    private final AuthRepositoryPort authRepositoryPort;
    private final EmailVerificationUseCase emailVerificationUseCase;
    private final EmailVerificationPort emailVerificationPort;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenUseCase refreshTokenUseCase;
    private final RefreshTokenRepositoryPort refreshTokenRepositoryPort;
    private final CachePort cachePort;
    private final GenerateCodeService generateCodeService;

    public AuthUseCaseImp(AuthRepositoryPort authRepositoryPort,
            EmailVerificationUseCase emailVerificationUseCase,
            EmailVerificationPort emailVerificationPort,
            PasswordEncoder passwordEncoder,
            RefreshTokenUseCase refreshTokenUseCase,
            RefreshTokenRepositoryPort refreshTokenRepositoryPort,
            CachePort cachePort,
            GenerateCodeService generateCodeService) {
        this.authRepositoryPort = authRepositoryPort;
        this.passwordEncoder = passwordEncoder;
        this.emailVerificationUseCase = emailVerificationUseCase;
        this.emailVerificationPort = emailVerificationPort;
        this.refreshTokenUseCase = refreshTokenUseCase;
        this.refreshTokenRepositoryPort = refreshTokenRepositoryPort;
        this.cachePort = cachePort;
        this.generateCodeService = generateCodeService;
    }

    @Override
    public Mono<RegisterUserCommandResult> register(RegisterUserCommand cmd) {
        return authRepositoryPort.findByEmail(cmd.email())
                .hasElement()
                .flatMap(exists -> {
                    if (exists) {
                        return Mono.error(AuthExceptions.userAlreadyExistsException());
                    }

                    UserModel user = new UserModel.UserBuilderDraft()
                            .username(cmd.username())
                            .password(passwordEncoder.encode(cmd.password()))
                            .email(cmd.email())
                            .cellphone(cmd.cellphone())
                            .fullname(cmd.fullname())
                            .identificationNumber(cmd.identificationNumber())
                            .identificationType(cmd.identificationType())
                            .build();

                    // retornamos la respuesta y enviamos el email de verificacion
                    return authRepositoryPort.save(user)
                            .flatMap(saved -> emailVerificationUseCase
                                    .sendEmailVerificationToken(saved.getId(), saved.getEmail())
                                    .thenReturn(
                                            new RegisterUserCommandResult(
                                                    saved.getId(),
                                                    "usuario creado satisfactoriamente, por favor verifica tu email para continuar!"))
                                    .onErrorResume(error -> Mono.when(
                                            authRepositoryPort.deleteByUserId(saved.getId()),
                                            refreshTokenRepositoryPort.deleteRefreshTokenByUserId(saved.getId()),
                                            emailVerificationPort.deleteEmailVerificationByUserId(saved.getId()))
                                            .then(Mono.error(error))));
                });
    }

    @Override
    public Mono<LoginUserCommandResult> login(LoginUserUserCommand cmd) {
        return authRepositoryPort.findByEmail(cmd.email())
                .switchIfEmpty(Mono.error(AuthExceptions.userNotFound()))
                .flatMap(user -> {
                    // verificamos la contraseña del usuario
                    if (!passwordEncoder.matches(cmd.password(), user.getPassword())) {
                        return Mono.error(AuthExceptions.passwordIsNotCorrect());
                    }

                    if (!user.isEnabled()) {
                        return Mono.error(AuthExceptions.disabledUser());
                    }

                    return refreshTokenUseCase.generateRefreshTokenAndAccessToken(user)
                            .map(res -> new LoginUserCommandResult(res.refreshToken(), res.accessToken()));
                });
    }

    @Override
    public Mono<String> oauth2Login(String username, String email, String cellphone,
            String fullname) {
        String oAuthSessionID = generateCodeService.randomBase64(32);

        // objetivo retorna un OauthSessionID y guardar el usuario en la aplicacion
        // ademas de sus credenciales
        Mono<UserModel> userMono = authRepositoryPort.findByEmail(email)
                .switchIfEmpty(
                        Mono.defer(() -> {
                            // registramos el usuario
                            UserModel newUser = new UserModel.UserBuilder()
                                    .id(UUID.randomUUID())
                                    .username(username)
                                    .password("")
                                    .email(email)
                                    .cellphone(cellphone)
                                    .fullname(fullname)
                                    .identificationType(IdentificationEnum.CC)
                                    .identificationNumber("")
                                    .createAt(Instant.now())
                                    .updateAt(Instant.now())
                                    .rols(Set.of(RolEnum.USER))
                                    .isEnabled(true)
                                    .build();

                            return authRepositoryPort.save(newUser);
                        }));

        return userMono.flatMap(user -> {
            // guardamos el refresh y accessToken en redis con su respectivo OAuthSessionID
            // creamos el refresh y accessToken
            return refreshTokenUseCase.generateRefreshTokenAndAccessToken(user)
                    .flatMap(res -> cachePort.saveOauth2Session(oAuthSessionID, res.refreshToken(),
                            res.accessToken()))
                    .thenReturn(oAuthSessionID);
        });
    }

    @Override
    public Mono<GenerateRefreshTokenCommandResult> oauth2GetCredentials(String oauth2SessionID) {
        return cachePort.oauth2GetCredentials(oauth2SessionID)
                .flatMap(res -> {

                    if (!res.containsKey("accessToken")
                            || !res.containsKey("refreshToken")) {

                        return Mono.error(AuthExceptions.oauthSessionIDNotFound());
                    }

                    return Mono.just(
                            new GenerateRefreshTokenCommandResult(
                                    res.get("refreshToken"),
                                    res.get("accessToken")));
                });
    }

    @Override
    public Mono<String> logout() {
        return refreshTokenUseCase.revokedAllRefresh().thenReturn("se cerró la session correctamente!");
    }
}
