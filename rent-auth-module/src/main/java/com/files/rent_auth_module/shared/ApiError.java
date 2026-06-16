package com.files.rent_auth_module.shared;

import java.time.LocalDateTime;

public record ApiError(
        LocalDateTime localDateTime,
        String error,
        String message,
        String path) {

}
