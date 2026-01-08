package com.bartr.common.feign;

/**
 * ThreadLocal holder for authentication tokens from WebSocket sessions.
 * This allows Feign clients to access the token from the current WebSocket message processing context.
 */
public class AuthTokenHolder {
    private static final ThreadLocal<String> tokenHolder = new ThreadLocal<>();

    public static void setToken(String token) {
        tokenHolder.set(token);
    }

    public static String getToken() {
        return tokenHolder.get();
    }

    public static void clear() {
        tokenHolder.remove();
    }
}

