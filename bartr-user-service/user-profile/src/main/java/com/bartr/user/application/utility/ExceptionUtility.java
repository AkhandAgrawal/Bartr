package com.bartr.user.application.utility;

import com.bartr.common.core.exception.ServiceException;
import com.bartr.common.core.exception.ErrorConstant;
import com.bartr.user.Constants;
import com.bartr.user.domain.entities.MessageReference;
import com.bartr.user.domain.repositories.MessageReferenceRepository;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
@AllArgsConstructor
public class ExceptionUtility {

    private MessageReferenceRepository messageReferenceRepository;

    private static final String INVALID_FORMAT_MESSAGE = "Invalid messageId format. Expected format: <prefix>-<prefix>-<category>-<severity>-<code>";

    public ServiceException createServiceException(String messageCode) {
        return createServiceException(messageCode, null);
    }

    public ServiceException createServiceException(String messageCode, String custom) {
        return createServiceException(messageCode, null, custom);
    }

    private ServiceException createServiceException(String messageCode, Exception e, String custom) {
        String[] parts = parseMessageCode(messageCode);

        String categoryStr = parts[Constants.TWO];
        String severityStr = parts[Constants.THREE];
        String code = parts[Constants.FOUR];
        int httpStatusCode = extractHttpStatusCode(code);

        ErrorConstant.CATEGORY category = getCategoryEnum(categoryStr);
        ErrorConstant.SEVERITY severity = getSeverityEnum(severityStr);

        String message;
        try {
            MessageReference ref = messageReferenceRepository.findByMessageCode(messageCode);
            message = (ref != null) ? ref.getMessage() : "An error occurred";
        } catch (Exception ex) {
            message = "User profile not found";
        }
        
        if (custom != null) {
            message = custom;
        }

        return new ServiceException(code, message, category, severity, HttpStatus.valueOf(httpStatusCode));
    }

    private static int extractHttpStatusCode(String code) {
        if (code == null || code.length() < 3) {
            throw new IllegalArgumentException(INVALID_FORMAT_MESSAGE);
        }
        return Integer.parseInt(code.substring(0, 3));
    }

    private static String[] parseMessageCode(String messageCode) {
        String[] parts = messageCode.split("-");
        if (parts.length != 5) {
            throw new IllegalArgumentException(INVALID_FORMAT_MESSAGE);
        }
        return parts;
    }

    private static ErrorConstant.CATEGORY getCategoryEnum(String categoryStr) {
        try {
            return ErrorConstant.CATEGORY.valueOf(categoryStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ErrorConstant.CATEGORY.TS;
        }
    }

    private static ErrorConstant.SEVERITY getSeverityEnum(String severityStr) {
        try {
            return ErrorConstant.SEVERITY.valueOf(severityStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ErrorConstant.SEVERITY.C;
        }
    }
}
