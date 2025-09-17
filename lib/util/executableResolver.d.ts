/**
 * Platform-aware executable resolution utilities for game discovery
 * Handles different executable formats (.exe, .app, native binaries) across platforms
 */
export interface ExecutableCandidate {
    path: string;
    type: 'native' | 'app' | 'windows' | 'wine';
    priority: number;
    platform: 'darwin' | 'win32' | 'linux';
}
export interface GameExecutableOptions {
    gameName: string;
    gameId: string;
    basePath: string;
    windowsExecutable?: string;
    macExecutable?: string;
    linuxExecutable?: string;
    appBundleName?: string;
}
/**
 * Resolve platform-appropriate executable for a game
 * Implements macOS priority order: native > app store > steam > other mac stores > windows games
 */
export declare function resolveGameExecutable(options: GameExecutableOptions): Promise<ExecutableCandidate[]>;
/**
 * Get the best executable candidate from a list
 */
export declare function getBestExecutableCandidate(candidates: ExecutableCandidate[]): ExecutableCandidate | null;
/**
 * Legacy function wrapper for backward compatibility
 * Returns the path of the best executable candidate
 */
export declare function getGameExecutablePath(options: GameExecutableOptions): Promise<string | null>;
/**
 * Check if a path points to a macOS app bundle
 */
export declare function isAppBundle(executablePath: string): boolean;
/**
 * Check if a path points to a Windows executable
 */
export declare function isWindowsExecutable(executablePath: string): boolean;
/**
 * Get executable type from path
 */
export declare function getExecutableType(executablePath: string): 'native' | 'app' | 'windows' | 'unknown';
