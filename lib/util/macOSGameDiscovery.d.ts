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
    type: 'native' | 'app' | 'steam' | 'epic' | 'gog' | 'windows';
    priority: number;
    store?: string;
}
/**
 * macOS game discovery priority levels
 */
export declare const MACOS_DISCOVERY_PRIORITIES: {
    NATIVE_APP: number;
    APP_STORE: number;
    STEAM: number;
    EPIC: number;
    GOG: number;
    OTHER_MAC_STORES: number;
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
 */
export declare function getBestMacOSGameCandidate(candidates: MacOSGameCandidate[]): MacOSGameCandidate | null;
export {};
