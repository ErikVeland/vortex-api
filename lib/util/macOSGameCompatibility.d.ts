/**
 * macOS Game Compatibility Layer
 *
 * This module provides compatibility fixes for community game extensions
 * that may not properly handle macOS-specific executable formats.
 */
export interface MacOSGameFix {
    /** Game ID to apply the fix to */
    gameId: string;
    /** Windows executable name that the extension expects */
    windowsExecutable: string;
    /** macOS app bundle name to look for instead */
    macOSAppBundle: string;
    /** Alternative files to check for validation */
    alternativeFiles?: string[];
}
/**
 * Get macOS compatibility fix for a game
 */
export declare function getMacOSGameFix(gameId: string): MacOSGameFix | undefined;
/**
 * Check if a file exists, with macOS-specific fallbacks
 */
export declare function checkFileWithMacOSFallback(basePath: string, fileName: string, gameId: string): Promise<boolean>;
/**
 * Validate required files with macOS compatibility
 */
export declare function validateRequiredFilesWithMacOSCompat(basePath: string, requiredFiles: string[], gameId: string): Promise<void>;
/**
 * Get the appropriate executable path for the current platform
 */
export declare function getExecutablePathForPlatform(basePath: string, gameId: string, windowsExecutable?: string): string | null;
/**
 * Detects the current macOS architecture (ARM64 or Intel x64)
 * @returns 'arm64' for Apple Silicon Macs, 'x64' for Intel Macs
 */
export declare function getMacOSArchitecture(): 'arm64' | 'x64';
/**
 * Intercept and modify download URLs for macOS compatibility
 */
export declare function interceptDownloadURLForMacOS(url: string): string;
/**
 * Find macOS app bundle in a directory
 * @param basePath Base directory to search in
 * @param appBundleName Expected app bundle name
 * @returns Full path to app bundle or null if not found
 */
export declare function findMacOSAppBundle(basePath: string, appBundleName: string): Promise<string>;
/**
 * Get the actual executable path inside a macOS app bundle
 * @param appBundlePath Path to the .app bundle
 * @returns Path to the actual executable inside the bundle
 */
export declare function getExecutableFromAppBundle(appBundlePath: string): Promise<string>;
/**
 * Normalize a game path for macOS
 * This handles cases where the game might be in different locations
 * @param basePath Base path where the game is expected to be
 * @param gameId Game ID for specific handling
 * @param expectedExecutable Expected executable name
 * @returns Normalized path or null if not found
 */
export declare function normalizeGamePathForMacOS(basePath: string, gameId: string, expectedExecutable?: string): Promise<string>;
