/**
 * macOS-specific path utilities
 */
/**
 * Get macOS-specific application support directory
 * ~/Library/Application Support/Vortex
 */
export declare function getMacOSAppSupportPath(): string;
/**
 * Get macOS-specific caches directory
 * ~/Library/Caches/Vortex
 */
export declare function getMacOSCachesPath(): string;
/**
 * Get macOS-specific preferences directory
 * ~/Library/Preferences/Vortex
 */
export declare function getMacOSPreferencesPath(): string;
/**
 * Get macOS-specific logs directory
 * ~/Library/Logs/Vortex
 */
export declare function getMacOSLogsPath(): string;
/**
 * Get macOS-specific application directory
 * /Applications/Vortex.app
 */
export declare function getMacOSApplicationPath(): string;
/**
 * Get macOS-specific Steam directory
 * ~/Library/Application Support/Steam
 */
export declare function getMacOSSteamPath(): string;
/**
 * Get macOS-specific GOG Galaxy directory
 * ~/Library/Application Support/GOG.com/Galaxy
 */
export declare function getMacOSGOGPath(): string;
/**
 * Get macOS-specific Origin directory
 * ~/Library/Application Support/Origin
 */
export declare function getMacOSOriginPath(): string;
/**
 * Get macOS-specific Epic Games directory
 * ~/Library/Application Support/Epic
 */
export declare function getMacOSEpicPath(): string;
/**
 * Get macOS-specific Ubisoft Connect directory
 * ~/Library/Application Support/Ubisoft/Ubisoft Game Launcher
 */
export declare function getMacOSUbisoftPath(): string;
/**
 * Override Vortex paths for macOS
 */
export declare function setupMacOSPaths(): void;
