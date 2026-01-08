package com.bartr.matching;

import lombok.Getter;

@Getter
public enum SwipeAction {
    LEFT("LEFT"),
    RIGHT("RIGHT");

    private final String action;

    SwipeAction(String action) {
        this.action = action;
    }

}
