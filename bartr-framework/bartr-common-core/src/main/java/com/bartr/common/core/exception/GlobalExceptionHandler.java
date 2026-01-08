package com.bartr.common.core.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@ControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss");

    @ExceptionHandler(ServiceException.class)
    public ResponseEntity<Map<String, Object>> handleServiceException(ServiceException ex) {

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", ex.getHttpStatus().name());
        response.put("httpStatus", ex.getHttpStatus().value());
        response.put("message", ex.getMessage());
        response.put("msId", "MS_USER_SERVICE");

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("errorId", UUID.randomUUID().toString());
        data.put("errorCode", ex.getCode());
        data.put("errorCategory", ex.getCategory());
        data.put("errorSeverity", ex.getSeverity());
        data.put("errorDate", LocalDateTime.now().format(DATE_FORMATTER));

        if (ex.getErrorContext() != null) {
            data.putAll(ex.getErrorContext());
        }

        response.put("data", data);

        return ResponseEntity.status(ex.getHttpStatus()).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", "INTERNAL_SERVER_ERROR");
        response.put("httpStatus", 500);
        response.put("message", "An unexpected error occurred");
        response.put("msId", "MS_USER_SERVICE");

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("errorId", UUID.randomUUID().toString());
        data.put("errorCode", "INTERNAL_ERROR");
        data.put("errorCategory", "SYSTEM");
        data.put("errorSeverity", "HIGH");
        data.put("errorDate", LocalDateTime.now().format(DATE_FORMATTER));

        response.put("data", data);

        return ResponseEntity.status(500).body(response);
    }
}