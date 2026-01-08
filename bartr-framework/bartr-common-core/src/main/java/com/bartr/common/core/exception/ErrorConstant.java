package com.bartr.common.core.exception;

public final class ErrorConstant {
    public static final String PLATFORM_ID = "bartr-platform-exception";

    ErrorConstant() {
        throw new IllegalStateException("Utility class");
    }

    public static enum CATEGORY {
        BV,
        TW,
        TU,
        NT,
        TS,
        TH,
        TD,
        TI,
        PT;

        private CATEGORY() {
        }
    }

    public static enum SEVERITY {
        C,
        M,
        L,
        I;

        private SEVERITY() {
        }
    }
}
