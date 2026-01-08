package com.bartr.common.core.exception;

import lombok.Generated;
import org.springframework.http.HttpStatus;

import java.util.Collections;
import java.util.Map;

public class ServiceException extends RuntimeException {
    private final String code;
    private final HttpStatus httpStatus;
    private final String category;
    private final String severity;
    private final String message;
    private final Map<String, Object> errorContext;

    public ServiceException(String code, String message, ErrorConstant.CATEGORY category, ErrorConstant.SEVERITY severity) {
        this(code, message, category, severity, HttpStatus.BAD_REQUEST);
    }

    public ServiceException(String code, String message, ErrorConstant.CATEGORY category, ErrorConstant.SEVERITY severity, Map<String, Object> errorContext) {
        this(code, message, category, severity, HttpStatus.BAD_REQUEST, errorContext);
    }

    public ServiceException(String code, String message, ErrorConstant.CATEGORY category, ErrorConstant.SEVERITY severity, HttpStatus httpStatus) {
        this(code, message, httpStatus, category.toString(), severity.toString());
    }

    public ServiceException(String code, String message, ErrorConstant.CATEGORY category, ErrorConstant.SEVERITY severity, HttpStatus httpStatus, Map<String, Object> errorContext) {
        this(code, message, httpStatus, category.toString(), severity.toString(), errorContext);
    }

    private ServiceException(String code, String message, HttpStatus httpStatus, String category, String severity) {
        super(message);
        this.code = code;
        this.httpStatus = httpStatus;
        this.category = category;
        this.severity = severity;
        this.message = message;
        this.errorContext = null;
    }

    private ServiceException(String code, String message, HttpStatus httpStatus, String category, String severity, Map<String, Object> errorContext) {
        super(message);
        this.code = code;
        this.httpStatus = httpStatus;
        this.category = category;
        this.severity = severity;
        this.message = message;
        this.errorContext = Collections.unmodifiableMap(errorContext);
    }

    @Generated
    public String getCode() {
        return this.code;
    }

    @Generated
    public HttpStatus getHttpStatus() {
        return this.httpStatus;
    }

    @Generated
    public String getCategory() {
        return this.category;
    }

    @Generated
    public String getSeverity() {
        return this.severity;
    }

    @Generated
    @Override
    public String getMessage() {
        return this.message;
    }

    @Generated
    public Map<String, Object> getErrorContext() {
        return this.errorContext;
    }
}