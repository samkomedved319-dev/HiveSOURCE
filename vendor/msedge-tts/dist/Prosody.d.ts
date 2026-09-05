export declare class ProsodyOptions {
    pitch?: PITCH | string;
    rate?: RATE | string | number;
    volume?: VOLUME | string | number;
}
export declare enum RATE {
    X_SLOW = "x-slow",
    SLOW = "slow",
    MEDIUM = "medium",
    FAST = "fast",
    X_FAST = "x-fast",
    DEFAULT = "default"
}
export declare enum PITCH {
    X_LOW = "x-low",
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    X_HIGH = "x-high",
    DEFAULT = "default"
}
export declare enum VOLUME {
    SILENT = "silent",
    X_SOFT = "x-soft",
    SOFT = "soft",
    MEDIUM = "medium",
    LOUD = "loud",
    X_LOUD = "x-LOUD",
    DEFAULT = "default"
}
