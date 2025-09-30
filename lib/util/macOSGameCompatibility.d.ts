/**
 * macOS Game Compatibility Layer
 *
 * This module provides compatibility fixes for community game extensions on macOS.
 * It handles URL interception for downloads, executable path resolution, and other
 * macOS-specific adjustments needed for game extensions to work properly.
 *
 * COMMUNITY EXTENSION DEVELOPERS:
 * ===============================
 *
 * This layer provides several utilities to help your extensions work seamlessly on macOS:
 *
 * 1. URL INTERCEPTION FOR DOWNLOADS:
 *    - Automatically converts Windows-specific download URLs to macOS equivalents
 *    - Handles architecture detection (Intel vs Apple Silicon)
 *    - Supports custom URL mappings for your specific tools/mods
 *
 * 2. REGISTERING CUSTOM URL MAPPINGS:
 *    Use registerCustomURLMapping() to add your own URL conversion rules:
 *
 *    ```typescript
 *    import { registerCustomURLMapping, validateURLMapping } from '../util/macOSGameCompatibility';
 *
 *    // Example: Convert MyTool Windows downloads to macOS
 *    const myToolMapping = {
 *      description: 'MyTool for MyGame',
 *      windowsPattern: /https:\/\/github\.com\/myuser\/mytool\/releases\/.*windows.*\.zip/i,
 *      getMacOSUrl: (url: string) => {
 *        return url.replace(/windows/i, 'macos').replace(/\.zip$/, '.tar.gz');
 *      }
 *    };
 *
 *    // Validate before registering (optional but recommended)
 *    const validation = validateURLMapping(myToolMapping, [
 *      'https://github.com/myuser/mytool/releases/download/v1.0/mytool-windows.zip'
 *    ]);
 *
 *    if (validation.success) {
 *      registerCustomURLMapping(myToolMapping);
 *    } else {
 *      console.error('URL mapping validation failed:', validation.errors);
 *    }
 *    ```
 *
 * 3. ARCHITECTURE DETECTION:
 *    Use getMacOSArchitecture() to detect the current macOS architecture:
 *    - Returns 'arm64' for Apple Silicon Macs
 *    - Returns 'x64' for Intel Macs
 *
 * 4. GAME COMPATIBILITY FIXES:
 *    The layer includes built-in fixes for common games and tools,
 *    handling platform-specific paths and executable locations.
 *
 * 5. BEST PRACTICES:
 *    - Always validate your URL mappings with test URLs
 *    - Handle both Intel and Apple Silicon architectures when relevant
 *    - Use descriptive names for your mappings
 *    - Test your extensions on both architectures if possible
 *    - Log important compatibility actions for debugging
 *
 * For more examples, see the existing mappings in STATIC_DOWNLOAD_URL_MAPPINGS below.
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
interface DownloadURLMapping {
    windowsPattern: RegExp;
    getMacOSUrl: (windowsUrl: string) => string;
    description: string;
}
/**
 * Known macOS compatibility fixes for popular games
 */
declare const MACOS_GAME_FIXES: MacOSGameFix[];
/**
 * Validate a URL mapping before registration
 * @param mapping The URL mapping to validate
 * @param testUrls Optional array of test URLs to validate against
 * @returns Validation result with success status and any errors
 */
export declare function validateURLMapping(mapping: DownloadURLMapping, testUrls?: string[]): {
    success: boolean;
    errors: string[];
    testResults?: Array<{
        url: string;
        matches: boolean;
        convertedUrl?: string;
        error?: string;
    }>;
};
/**
 * Register a custom URL mapping for community extensions
 * @param mapping The URL mapping to register
 * @param validate Whether to validate the mapping before registration (default: true)
 */
export declare function registerCustomURLMapping(mapping: DownloadURLMapping, validate?: boolean): boolean;
/**
 * Export the macOS game fixes array for use in other modules
 */
export { MACOS_GAME_FIXES };
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
 * Enhanced with integration to the path normalization system
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
 * Enhanced with integration to the path normalization system
 * @param basePath Base path where the game is expected to be
 * @param gameId Game ID for specific handling
 * @param expectedExecutable Expected executable name
 * @returns Normalized path or null if not found
 */
export declare function normalizeGamePathForMacOS(basePath: string, gameId: string, expectedExecutable?: string): Promise<any>;
/**
 * Get the appropriate executable path for Cyberpunk 2077 based on redscript availability and platform
 */
/**
 * Generic game process manager for safe profile switching
 */
export declare class GameProcessManager {
    private gameProcesses;
    private profileSwitchQueue;
    private isMonitoring;
    private monitoringInterval?;
    private gameExecutableNames;
    private api;
    constructor(api: any, gameExecutableNames: string[]);
    /**
     * Check if the game is currently running
     */
    isGameRunning(): Promise<boolean>;
    /**
     * Get list of running processes based on platform
     */
    private getRunningProcesses;
    /**
     * Start monitoring game processes
     */
    startMonitoring(): void;
    /**
     * Stop monitoring game processes
     */
    stopMonitoring(): void;
    /**
     * Update game state and process queued profile switches
     */
    private updateGameState;
    /**
     * Queue a profile switch to execute when the game is not running
     */
    queueProfileSwitch(switchFunction: () => void): void;
    /**
     * Check if there are queued profile switches
     */
    hasQueuedSwitches(): boolean;
    /**
     * Clear all queued profile switches
     */
    clearQueue(): void;
}
export declare function getCyberpunkRedscriptAwareExecutable(discoveredPath: string): string;
/**
 * Interface for compatibility validation results
 */
export interface CompatibilityValidationResult {
    isCompatible: boolean;
    incompatibleItems: string[];
    errorMessage?: string;
}
/**
 * Validates if a Cyberpunk 2077 mod is compatible with macOS
 * @param modPath - Path to the mod directory or archive
 * @param modFiles - Array of file paths within the mod
 * @returns Promise<CompatibilityValidationResult> - Validation result with compatibility status and details
 */
export declare function validateCyberpunkMacOSCompatibility(modPath: string, modFiles: string[]): Promise<CompatibilityValidationResult>;
/**
 * Creates a user-friendly error message for incompatible mods
 * @param incompatibleItems - Array of incompatible items found
 * @returns string - Formatted error message
 */
export declare function createMacOSCompatibilityErrorMessage(incompatibleItems: string[]): string;
/**
 * Quick check if a mod contains any Windows-only file extensions
 * @param modFiles - Array of file paths within the mod
 * @returns boolean - True if Windows-only files are detected
 */
export declare function hasWindowsOnlyFiles(modFiles: string[]): boolean;
/**
 * Quick check if a mod contains any Windows-only directories
 * @param modFiles - Array of file paths within the mod
 * @returns boolean - True if Windows-only directories are detected
 */
export declare function hasWindowsOnlyDirectories(modFiles: string[]): boolean;
/**
 * Quick check if a mod contains any Windows-only frameworks
 * @param modFiles - Array of file paths within the mod
 * @returns boolean - True if Windows-only frameworks are detected
 */
export declare function hasWindowsOnlyFrameworks(modFiles: string[]): boolean;
/**
 * Balatro-specific helper functions for enhanced macOS compatibility
 */
/**
 * Detect if Lovely injector is properly installed for Balatro on macOS
 * @param gamePath - Path to the Balatro game installation
 * @returns Promise<boolean> - True if Lovely injector is detected
 */
export declare function detectLovelyInjectorForBalatro(gamePath: string): Promise<boolean>;
/**
 * Detect if SteamModded is properly installed for Balatro on macOS
 * @param gamePath - Path to the Balatro game installation
 * @returns Promise<boolean> - True if SteamModded is detected
 */
export declare function detectSteamModdedForBalatro(gamePath: string): Promise<boolean>;
/**
 * Validate Balatro installation and provide detailed compatibility information
 * @param gamePath - Path to the Balatro game installation
 * @returns Promise<object> - Detailed compatibility information
 */
export interface ExecutableNameMapping {
    windowsExecutable: string;
    macOSExecutable: string;
    description: string;
    gameId?: string;
}
/**
 * Register a custom executable name mapping for community extensions
 * @param mapping The executable name mapping to register
 */
export declare function registerCustomExecutableNameMapping(mapping: ExecutableNameMapping): void;
/**
 * Get all executable name mappings (both static and custom)
 * @param gameId Optional game ID to filter mappings
 * @returns Array of executable name mappings
 */
export declare function getExecutableNameMappings(gameId?: string): ExecutableNameMapping[];
/**
 * Map a Windows executable name to its macOS equivalent
 * @param windowsExecutable The Windows executable name
 * @param gameId Optional game ID for game-specific mappings
 * @returns The macOS executable name, or the original name if no mapping exists
 */
export declare function mapWindowsExecutableToMacOS(windowsExecutable: string, gameId?: string): string;
/**
 * Validate an executable name mapping
 * @param mapping The mapping to validate
 * @returns Validation result with success status and any errors
 */
export declare function validateExecutableNameMapping(mapping: ExecutableNameMapping): {
    success: boolean;
    errors: string[];
};
export declare function validateBalatroPlatformCompatibility(gamePath: string): Promise<{
    isValid: boolean;
    hasLovelyInjector: boolean;
    hasSteamModded: boolean;
    appBundleFound: boolean;
    executablePath: string | null;
    recommendations: string[];
    errors: string[];
}>;
