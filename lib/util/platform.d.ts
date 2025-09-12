/**
 * Platform detection utilities for consistent cross-platform behavior
 */
export type Platform = 'win32' | 'darwin' | 'linux';
/**
 * Get the current platform
 */
export declare function getCurrentPlatform(): Platform;
/**
 * Check if running on Windows
 */
export declare function isWindows(): boolean;
/**
 * Check if running on macOS
 */
export declare function isMacOS(): boolean;
/**
 * Check if running on Linux
 */
export declare function isLinux(): boolean;
/**
 * Check if running on a Unix-like system (macOS or Linux)
 */
export declare function isUnix(): boolean;
/**
 * Get platform-specific executable extension
 */
export declare function getExecutableExtension(): string;
/**
 * Get platform-specific path separator
 */
export declare function getPathSeparator(): string;
/**
 * Get platform-specific line ending
 */
export declare function getLineEnding(): string;
/**
 * Execute platform-specific logic
 */
export declare function platformSwitch<T>(options: {
    win32?: () => T;
    darwin?: () => T;
    linux?: () => T;
    default?: () => T;
}): T;
/**
 * Get platform-specific application data directory
 */
export declare function getAppDataPath(): string;
/**
 * Get platform-specific user home directory
 */
export declare function getHomeDirectory(): string;
/**
 * Get platform-specific documents directory
 */
export declare function getDocumentsPath(): string;
/**
 * Check if a path is case-sensitive on the current platform
 */
export declare function isPathCaseSensitive(): boolean;
/**
 * Normalize path separators for the current platform
 */
export declare function normalizePath(inputPath: string): string;
/**
 * Get platform-specific Wine prefix path for Linux
 */
export declare function getWinePrefixPath(): string;
/**
 * Get Wine drive C path for Linux
 */
export declare function getWineDriveCPath(): string;
/**
 * Check if Wine is available on Linux
 */
export declare function isWineAvailable(): boolean;
/**
 * Check if running on macOS with virtualization support
 * This is always true on macOS as we can detect Crossover/Parallels
 */
export declare function isMacOSWithVirtualization(): boolean;
