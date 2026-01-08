package com.bartr.chat;

import lombok.Builder;
import lombok.Data;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@Data
@Builder
public class ApiResponse<T> {
    private String status;
    private HttpStatus httpStatus;
    private String message;
    private String msId;
    private boolean success;
    private T data;

    public static <T> ResponseEntity<ApiResponse<T>>  success(T data, String message) {
        return ResponseEntity.status(HttpStatus.OK).body(
                ApiResponse.<T>builder()
                        .status(HttpStatus.OK.name())
                        .httpStatus(HttpStatus.valueOf(200))
                        .message(message)
                        .msId("MS_USER_SERVICE")
                        .data(data)
                        .success(true)
                        .build()
        );

    }

}
