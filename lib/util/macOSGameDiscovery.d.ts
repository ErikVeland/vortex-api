/**
 * macOS-specific game discovery utilities
 * Implements priority order: native > app store > steam > other mac stores > windows games
 */
import Bluebird from 'bluebird';
import { IGame } from '../types/IGame';
import { IDiscoveryResult } from '../extensions/gamemode_management/types/IDiscoveryResult';
import { IDiscoveredTool } from '../types/IDiscoveredTool';
type DiscoveredCB = (gameId: string, result: IDiscoveryResult) => void;
type DiscoveredToolCB = (gameId: string, result: IDiscoveredTool) => void;
export interface MacOSGameDiscoveryOptions {
    gameName: string;
    gameId: string;
    windowsExecutable?: string;
    macExecutable?: string;
    appBundleName?: string;
    searchPaths?: string[];
}
export interface MacOSGameCandidate {
    path: string;
    executable: string;
    type: 'native' | 'app' | 'steam' | 'epic' | 'gog' | 'windows' | 'steam-crossover' | 'steam-parallels' | 'epic-crossover' | 'epic-parallels' | 'gog-crossover' | 'gog-parallels' | 'windows-crossover' | 'windows-parallels' | 'other-store' | 'windows-vmware';
    priority: number;
    store?: string;
    manifestData?: {
        appId: string;
        name: string;
        installDir: string;
        manifestPath: string;
        matchConfidence?: string;
        source?: string;
        compatibilityLayer?: string;
        bottlePath?: string;
        vmPath?: string;
        storePath?: string;
        windowsExecutable?: string;
        gameId?: string;
        manifestFile?: string;
    };
}
/**
 * macOS game discovery priority levels
 * Lower numbers = higher priority
 * Enhanced with more granular priorities for better source differentiation
 */
export declare const MACOS_DISCOVERY_PRIORITIES: {
    STEAM_NATIVE: number;
    NATIVE_APP: number;
    APP_STORE: number;
    STEAM_CROSSOVER: number;
    EPIC_NATIVE: number;
    GOG_NATIVE: number;
    STEAM_PARALLELS: number;
    EPIC_CROSSOVER: number;
    GOG_CROSSOVER: number;
    OTHER_MAC_STORES: number;
    EPIC_PARALLELS: number;
    GOG_PARALLELS: number;
    CROSSOVER: number;
    PARALLELS: number;
    VMWARE: number;
    OTHER_WINDOWS: number;
};
/**
 * Discover games on macOS with proper priority order and progress feedback
 */
export declare function discoverMacOSGames(knownGames: IGame[], discoveredGames: {
    [id: string]: IDiscoveryResult;
}, onDiscoveredGame: DiscoveredCB, onDiscoveredTool: DiscoveredToolCB, onProgress?: (gameId: string, step: string, percent: number) => void): Bluebird<string[]>;
/**
 * Internal function for discovering games with progress feedback and parallelization
 */
export declare function discoverMacOSGamesInternal(options: MacOSGameDiscoveryOptions, onProgress?: (step: string, percent: number) => void): Promise<MacOSGameCandidate[]>;
/**
 * Get the best game candidate from discovery results
 * Enhanced with more sophisticated selection logic based on priority and confidence
 */
export declare function getBestMacOSGameCandidate(candidates: MacOSGameCandidate[]): MacOSGameCandidate | null;
export {};
