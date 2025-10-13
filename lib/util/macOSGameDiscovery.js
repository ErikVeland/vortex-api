"use strict";
/**
 * macOS-specific game discovery utilities
 * Implements priority order: steam(manifests) > native apps > other mac stores > CrossOver/Parallels > other Windows games
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MACOS_DISCOVERY_PRIORITIES = void 0;
exports.discoverMacOSGames = discoverMacOSGames;
exports.discoverMacOSGamesInternal = discoverMacOSGamesInternal;
exports.getBestMacOSGameCandidate = getBestMacOSGameCandidate;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const util_1 = require("util");
const bluebird_1 = __importDefault(require("bluebird"));
const platform_1 = require("./platform");
const log_1 = require("./log");
const executableResolver_1 = require("./executableResolver");
const macOSGameCompatibility_1 = require("./macOSGameCompatibility");
const discoveryCache = {};
// Cache management functions
function getCacheKey(options) {
    return `${options.gameId}-${options.gameName}-${options.windowsExecutable || ''}-${options.macExecutable || ''}`;
}
// No checksum: rely on stable cache keys + TTL for invalidation
function getCachedResult(options) {
    const key = getCacheKey(options);
    const cached = discoveryCache[key];
    if (!cached) {
        return null;
    }
    // Cache expires after 5 minutes
    const now = Date.now();
    const cacheAge = now - cached.timestamp;
    const maxAge = 5 * 60 * 1000; // 5 minutes
    if (cacheAge > maxAge) {
        delete discoveryCache[key];
        return null;
    }
    (0, log_1.log)('debug', 'Using cached macOS discovery result', { gameId: options.gameId, cacheAge });
    return cached.candidates;
}
function setCachedResult(options, candidates) {
    const key = getCacheKey(options);
    discoveryCache[key] = {
        candidates: [...candidates], // Deep copy to avoid mutations
        timestamp: Date.now(),
    };
}
const readdir = (0, util_1.promisify)(fs.readdir);
const stat = (0, util_1.promisify)(fs.stat);
/**
 * macOS game discovery priority levels
 * Lower numbers = higher priority
 * Enhanced with more granular priorities for better source differentiation
 */
exports.MACOS_DISCOVERY_PRIORITIES = {
    STEAM_NATIVE: 5, // Native Steam macOS games (highest priority)
    NATIVE_APP: 10, // Native macOS applications
    APP_STORE: 15, // Mac App Store games
    STEAM_CROSSOVER: 20, // Steam games running through CrossOver
    EPIC_NATIVE: 25, // Native Epic Games Store macOS games
    GOG_NATIVE: 30, // Native GOG Galaxy macOS games
    STEAM_PARALLELS: 35, // Steam games running through Parallels
    EPIC_CROSSOVER: 40, // Epic games running through CrossOver
    GOG_CROSSOVER: 45, // GOG games running through CrossOver
    OTHER_MAC_STORES: 50, // Other Mac game stores (Itch.io, Humble Bundle, etc.)
    EPIC_PARALLELS: 55, // Epic games running through Parallels
    GOG_PARALLELS: 60, // GOG games running through Parallels
    CROSSOVER: 70, // Generic CrossOver Windows games
    PARALLELS: 80, // Generic Parallels Windows games
    VMWARE: 90, // VMware Windows games
    OTHER_WINDOWS: 100 // Other Windows compatibility layers
};
/**
 * Common macOS application directories
 * Note: Limit to `/Applications` and user apps; avoid System and Utilities which never contain games
 */
const MACOS_APP_DIRECTORIES = [
    '/Applications', // Main applications directory (filter out Steam shortcuts)
    '~/Applications' // User applications folder
];
/**
 * Directories to ignore during game discovery (contain Steam shortcuts or irrelevant utilities)
 */
const IGNORED_DISCOVERY_DIRECTORIES = [
    '/Applications/Utilities', // System utilities - never contains games
    '/System/Applications',
    '/System/Applications/Utilities',
    '/System/Library/CoreServices',
    '/Applications/Xcode.app',
    '/Applications/Setapp'
];
/**
 * Check if a path should be ignored during discovery
 */
function shouldIgnoreDiscoveryPath(targetPath) {
    const expandedIgnoredPaths = IGNORED_DISCOVERY_DIRECTORIES.map(dir => dir.replace('~', process.env.HOME || ''));
    return expandedIgnoredPaths.some(ignoredPath => targetPath.startsWith(ignoredPath));
}
/**
 * Check if an app bundle is likely a Steam shortcut
 */
function isSteamShortcut(appPath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const infoPlistPath = path.join(appPath, 'Contents', 'Info.plist');
            const stats = yield stat(infoPlistPath);
            if (!stats.isFile()) {
                return false;
            }
            // Read the Info.plist file to check for Steam-specific identifiers
            const plistContent = yield fs.promises.readFile(infoPlistPath, 'utf8');
            // Steam shortcuts typically have specific bundle identifiers or executable names
            const steamIndicators = [
                'com.valvesoftware.steam',
                'steam_osx',
                'SteamLaunch',
                'steam://rungameid'
            ];
            return steamIndicators.some(indicator => plistContent.toLowerCase().includes(indicator.toLowerCase()));
        }
        catch (err) {
            // If we can't read the plist, assume it's not a Steam shortcut
            return false;
        }
    });
}
/**
 * Steam base paths on macOS (not the library itself). We expand to steamapps below.
 */
const MACOS_STEAM_BASE_PATHS = [
    '~/Library/Application Support/Steam',
    '/Library/Application Support/Steam'
];
function expandHome(p) {
    return p.replace('~', process.env.HOME || '');
}
/**
 * Resolve all Steam library steamapps paths including external libraries from libraryfolders.vdf
 */
function getSteamAppsPaths(baseSteamPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const steamApps = path.join(baseSteamPath, 'steamapps');
        const paths = [];
        try {
            const stats = yield stat(steamApps);
            if (!stats.isDirectory()) {
                return [];
            }
            paths.push(steamApps);
            const libraryFoldersPath = path.join(steamApps, 'libraryfolders.vdf');
            try {
                const content = yield fs.promises.readFile(libraryFoldersPath, 'utf8');
                const { parse } = yield Promise.resolve().then(() => __importStar(require('simple-vdf')));
                const data = parse(content);
                // Handle both old and new formats
                const folders = (data.libraryfolders || data.LibraryFolders || data);
                for (const key of Object.keys(folders)) {
                    const entry = folders[key];
                    const libPath = ((entry === null || entry === void 0 ? void 0 : entry.path) || (entry === null || entry === void 0 ? void 0 : entry.Path) || (typeof entry === 'string' ? entry : null));
                    if (libPath && typeof libPath === 'string') {
                        const appsPath = path.join(libPath, 'steamapps');
                        try {
                            const s = yield stat(appsPath);
                            if (s.isDirectory()) {
                                paths.push(appsPath);
                            }
                        }
                        catch (_) {
                            // ignore missing external library
                        }
                    }
                }
            }
            catch (err) {
                (0, log_1.log)('debug', 'libraryfolders.vdf not available; using default steamapps only', {
                    baseSteamPath,
                    error: err.message
                });
            }
        }
        catch (err) {
            // base steamapps not accessible
            (0, log_1.log)('debug', 'Steam base path not accessible', { baseSteamPath, error: err.message });
        }
        // Ensure unique
        return Array.from(new Set(paths));
    });
}
/**
 * Epic Games Store paths on macOS
 */
const MACOS_EPIC_PATHS = [
    '~/Library/Application Support/Epic/EpicGamesLauncher/Data/Manifests'
];
/**
 * GOG Galaxy paths on macOS
 */
const MACOS_GOG_PATHS = [
    '~/Library/Application Support/GOG.com/Galaxy/Applications'
];
/**
 * CrossOver bottle paths
 */
const CROSSOVER_PATHS = [
    '~/Library/Application Support/CrossOver/Bottles',
    '/Applications/CrossOver.app/Contents/SharedSupport/CrossOver/Bottles'
];
/**
 * Parallels Desktop paths
 */
const PARALLELS_PATHS = [
    '~/Parallels',
    '~/Documents/Parallels'
];
/**
 * Discover games on macOS with proper priority order and progress feedback
 */
function discoverMacOSGames(knownGames, discoveredGames, onDiscoveredGame, onDiscoveredTool, onProgress) {
    if (!(0, platform_1.isMacOS)()) {
        return bluebird_1.default.resolve([]);
    }
    const discoveredGameIds = [];
    return bluebird_1.default.map(knownGames, (game, gameIndex) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            // Use macOS compatibility fixes to improve discovery accuracy
            const winExec = (_a = game.executable) === null || _a === void 0 ? void 0 : _a.call(game);
            const fix = (0, macOSGameCompatibility_1.getMacOSGameFix)(game.id);
            const mappedMacExec = winExec ? (0, macOSGameCompatibility_1.mapWindowsExecutableToMacOS)(winExec, game.id) : undefined;
            const options = {
                gameName: game.name,
                gameId: game.id,
                windowsExecutable: winExec,
                // Prefer a mapped mac executable name rather than reusing the Windows one
                macExecutable: mappedMacExec,
                // Prefer compatibility-provided app bundle name when available
                appBundleName: (fix === null || fix === void 0 ? void 0 : fix.macOSAppBundle) || game.name
            };
            // Create progress callback for this specific game
            const gameProgressCallback = (step, percent) => {
                onProgress === null || onProgress === void 0 ? void 0 : onProgress(game.id, step, percent);
                (0, log_1.log)('debug', 'macOS discovery progress', {
                    gameId: game.id,
                    step,
                    percent,
                    gameIndex: gameIndex + 1,
                    totalGames: knownGames.length
                });
            };
            const candidates = yield discoverMacOSGamesInternal(options, gameProgressCallback);
            if (candidates.length > 0) {
                const bestCandidate = getBestMacOSGameCandidate(candidates);
                if (bestCandidate) {
                    const discoveryResult = {
                        path: bestCandidate.path,
                        tools: {},
                        hidden: false,
                        environment: {},
                        executable: bestCandidate.executable,
                        store: bestCandidate.store
                    };
                    onDiscoveredGame(game.id, discoveryResult);
                    discoveredGameIds.push(game.id);
                    (0, log_1.log)('info', 'macOS game discovered', {
                        gameId: game.id,
                        store: bestCandidate.store,
                        type: bestCandidate.type,
                        path: bestCandidate.path
                    });
                }
            }
        }
        catch (err) {
            (0, log_1.log)('warn', 'Error discovering macOS game', { gameId: game.id, error: err.message });
        }
        return game.id;
    }), { concurrency: 3 }) // Reduced concurrency to avoid overwhelming the system
        .then(() => discoveredGameIds);
}
/**
 * Internal function for discovering games with progress feedback and parallelization
 */
function discoverMacOSGamesInternal(options, onProgress) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(0, platform_1.isMacOS)()) {
            return [];
        }
        // Check cache first
        const cachedResult = getCachedResult(options);
        if (cachedResult) {
            onProgress === null || onProgress === void 0 ? void 0 : onProgress('Using cached results', 100);
            return cachedResult;
        }
        const candidates = [];
        try {
            // Define discovery methods with their names for progress tracking
            const discoveryMethods = [
                { name: 'Steam', method: () => discoverSteamGames(options), priority: 1 },
                { name: 'Native Apps', method: () => discoverNativeApps(options), priority: 2 },
                { name: 'Epic Games', method: () => discoverEpicGames(options), priority: 3 },
                { name: 'GOG Galaxy', method: () => discoverGOGGames(options), priority: 4 },
                { name: 'Other Mac Stores', method: () => discoverOtherMacStores(options), priority: 5 },
                { name: 'CrossOver', method: () => discoverCrossOverGames(options), priority: 6 },
                { name: 'Parallels', method: () => discoverParallelsGames(options), priority: 7 },
                { name: 'VMware', method: () => discoverVMwareGames(options), priority: 8 },
                { name: 'Windows Volumes', method: () => discoverWindowsGamesOnMacVolumes(options), priority: 9 }
            ];
            // Run discovery methods in parallel with progress tracking
            const results = yield Promise.allSettled(discoveryMethods.map((discovery, index) => __awaiter(this, void 0, void 0, function* () {
                try {
                    onProgress === null || onProgress === void 0 ? void 0 : onProgress(discovery.name, Math.floor((index / discoveryMethods.length) * 100));
                    (0, log_1.log)('debug', `Starting ${discovery.name} discovery for ${options.gameId}`, {
                        priority: discovery.priority,
                        method: discovery.name
                    });
                    const startTime = Date.now();
                    const result = yield discovery.method();
                    const duration = Date.now() - startTime;
                    (0, log_1.log)('debug', `Completed ${discovery.name} discovery for ${options.gameId}`, {
                        duration: `${duration}ms`,
                        found: result.length,
                        priority: discovery.priority
                    });
                    onProgress === null || onProgress === void 0 ? void 0 : onProgress(discovery.name, Math.floor(((index + 1) / discoveryMethods.length) * 100));
                    return result;
                }
                catch (err) {
                    (0, log_1.log)('warn', `Error in ${discovery.name} discovery`, {
                        gameId: options.gameId,
                        error: err.message,
                        priority: discovery.priority
                    });
                    return [];
                }
            })));
            // Collect all successful results
            results.forEach((result) => {
                if (result.status === 'fulfilled') {
                    candidates.push(...result.value);
                }
            });
            onProgress === null || onProgress === void 0 ? void 0 : onProgress('Complete', 100);
            // Cache the results
            setCachedResult(options, candidates);
        }
        catch (err) {
            (0, log_1.log)('warn', 'Error during macOS game discovery', { error: err.message, options });
        }
        // Sort by priority (lower number = higher priority)
        return candidates.sort((a, b) => a.priority - b.priority);
    });
}
/**
 * Discover native macOS applications
 */
function discoverNativeApps(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const candidates = [];
        // Check if we have a compatibility fix for this game
        const gameFix = (0, macOSGameCompatibility_1.getMacOSGameFix)(options.gameId);
        for (const appDir of MACOS_APP_DIRECTORIES) {
            const expandedPath = appDir.replace('~', process.env.HOME || '');
            // Skip ignored directories
            if (shouldIgnoreDiscoveryPath(expandedPath)) {
                (0, log_1.log)('debug', 'Skipping ignored discovery directory', {
                    gameId: options.gameId,
                    directory: expandedPath
                });
                continue;
            }
            try {
                // Look for app bundle using compatibility system first
                if (gameFix) {
                    const appBundlePath = yield (0, macOSGameCompatibility_1.findMacOSAppBundle)(expandedPath, gameFix.macOSAppBundle);
                    if (appBundlePath) {
                        candidates.push({
                            path: path.dirname(appBundlePath),
                            executable: appBundlePath,
                            type: 'app',
                            priority: exports.MACOS_DISCOVERY_PRIORITIES.NATIVE_APP,
                            store: 'native',
                            manifestData: {
                                appId: 'compatibility-system',
                                name: options.gameId,
                                installDir: path.dirname(appBundlePath),
                                manifestPath: 'compatibility-system',
                                source: 'compatibility-system',
                                gameId: options.gameId,
                                matchConfidence: 'high'
                            }
                        });
                        (0, log_1.log)('debug', 'Found native macOS app bundle via compatibility system', {
                            gameId: options.gameId,
                            appPath: appBundlePath,
                            directory: expandedPath
                        });
                    }
                    // Also check alternative files
                    if (gameFix.alternativeFiles) {
                        for (const altFile of gameFix.alternativeFiles) {
                            const altPath = path.join(expandedPath, altFile);
                            try {
                                const stats = yield stat(altPath);
                                if (stats.isFile() || (stats.isDirectory() && altFile.endsWith('.app'))) {
                                    candidates.push({
                                        path: path.dirname(altPath),
                                        executable: altPath,
                                        type: altFile.endsWith('.app') ? 'app' : 'native',
                                        priority: exports.MACOS_DISCOVERY_PRIORITIES.NATIVE_APP,
                                        store: 'native'
                                    });
                                    (0, log_1.log)('debug', 'Found alternative file via compatibility system', {
                                        gameId: options.gameId,
                                        altPath,
                                        directory: expandedPath
                                    });
                                }
                            }
                            catch (err) {
                                // Alternative file not found, continue
                            }
                        }
                    }
                }
                // Look for app bundle using original method as fallback
                if (options.appBundleName) {
                    const appName = options.appBundleName.endsWith('.app') ? options.appBundleName : `${options.appBundleName}.app`;
                    const appPath = path.join(expandedPath, appName);
                    try {
                        const stats = yield stat(appPath);
                        if (stats.isDirectory()) {
                            // Verify it's a valid app bundle
                            const infoPlistPath = path.join(appPath, 'Contents', 'Info.plist');
                            yield stat(infoPlistPath);
                            // Check if this is a Steam shortcut and skip it
                            if (yield isSteamShortcut(appPath)) {
                                (0, log_1.log)('debug', 'Skipping Steam shortcut app bundle', {
                                    gameId: options.gameId,
                                    appPath,
                                    directory: expandedPath
                                });
                                continue;
                            }
                            candidates.push({
                                path: path.dirname(appPath),
                                executable: appPath,
                                type: 'app',
                                priority: exports.MACOS_DISCOVERY_PRIORITIES.NATIVE_APP,
                                store: 'native'
                            });
                            (0, log_1.log)('debug', 'Found native macOS app bundle', {
                                gameId: options.gameId,
                                appPath,
                                directory: expandedPath
                            });
                        }
                    }
                    catch (err) {
                        (0, log_1.log)('debug', 'App bundle not found in directory', {
                            gameId: options.gameId,
                            appName,
                            directory: expandedPath,
                            error: err.message
                        });
                    }
                }
                // Look for native executable
                if (options.macExecutable) {
                    const execPath = path.join(expandedPath, options.macExecutable);
                    try {
                        const stats = yield stat(execPath);
                        if (stats.isFile() && (stats.mode & parseInt('111', 8))) {
                            candidates.push({
                                path: path.dirname(execPath),
                                executable: execPath,
                                type: 'native',
                                priority: exports.MACOS_DISCOVERY_PRIORITIES.NATIVE_APP,
                                store: 'native'
                            });
                            (0, log_1.log)('debug', 'Found native macOS executable', {
                                gameId: options.gameId,
                                execPath,
                                directory: expandedPath
                            });
                        }
                    }
                    catch (err) {
                        (0, log_1.log)('debug', 'Native executable not found in directory', {
                            gameId: options.gameId,
                            executable: options.macExecutable,
                            directory: expandedPath,
                            error: err.message
                        });
                        // Fallback: try mapping Windows executable to macOS name
                        if (options.windowsExecutable) {
                            const mapped = (0, macOSGameCompatibility_1.mapWindowsExecutableToMacOS)(options.windowsExecutable, options.gameId);
                            if (mapped && mapped !== options.macExecutable) {
                                const mappedExecPath = path.join(expandedPath, mapped);
                                try {
                                    const mappedStats = yield stat(mappedExecPath);
                                    if (mappedStats.isFile() && (mappedStats.mode & parseInt('111', 8))) {
                                        candidates.push({
                                            path: path.dirname(mappedExecPath),
                                            executable: mappedExecPath,
                                            type: 'native',
                                            priority: exports.MACOS_DISCOVERY_PRIORITIES.NATIVE_APP,
                                            store: 'native'
                                        });
                                        (0, log_1.log)('debug', 'Found native macOS executable via mapping fallback', {
                                            gameId: options.gameId,
                                            windowsExecutable: options.windowsExecutable,
                                            mappedExecutable: mapped,
                                            directory: expandedPath
                                        });
                                    }
                                }
                                catch (mapErr) {
                                    (0, log_1.log)('debug', 'Mapped native executable not found', {
                                        gameId: options.gameId,
                                        windowsExecutable: options.windowsExecutable,
                                        mappedExecutable: mapped,
                                        directory: expandedPath,
                                        error: mapErr.message
                                    });
                                }
                            }
                        }
                    }
                }
            }
            catch (err) {
                (0, log_1.log)('debug', 'Could not access native app directory', {
                    gameId: options.gameId,
                    directory: expandedPath,
                    error: err.message
                });
            }
        }
        return candidates;
    });
}
/**
 * Discover Mac App Store applications
 */
function discoverAppStoreApps(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const candidates = [];
        // App Store apps are typically in /Applications with specific bundle identifiers
        // This is a simplified implementation - a full implementation would check bundle IDs
        const appStoreDir = '/Applications';
        if (options.appBundleName) {
            const appName = options.appBundleName.endsWith('.app') ? options.appBundleName : `${options.appBundleName}.app`;
            const appPath = path.join(appStoreDir, appName);
            try {
                const stats = yield stat(appPath);
                if (stats.isDirectory()) {
                    // Check if it's an App Store app by looking for receipt
                    const receiptPath = path.join(appPath, 'Contents', '_MASReceipt', 'receipt');
                    try {
                        yield stat(receiptPath);
                        candidates.push({
                            path: path.dirname(appPath),
                            executable: appPath,
                            type: 'app',
                            priority: exports.MACOS_DISCOVERY_PRIORITIES.APP_STORE,
                            store: 'appstore'
                        });
                        (0, log_1.log)('debug', 'Found App Store game', {
                            gameId: options.gameId,
                            appPath,
                            receiptPath
                        });
                    }
                    catch (err) {
                        (0, log_1.log)('debug', 'App does not have App Store receipt', {
                            gameId: options.gameId,
                            appPath,
                            receiptPath,
                            error: err.message
                        });
                    }
                }
            }
            catch (err) {
                (0, log_1.log)('debug', 'App Store app not found', {
                    gameId: options.gameId,
                    appName,
                    appPath,
                    error: err.message
                });
            }
        }
        return candidates;
    });
}
/**
 * Discover Steam games on macOS using manifest files for better detection
 */
function discoverSteamGames(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const candidates = [];
        // First try manifest-based discovery (highest priority)
        try {
            const manifestCandidates = yield discoverSteamGamesFromManifests(options);
            candidates.push(...manifestCandidates);
            if (manifestCandidates.length > 0) {
                (0, log_1.log)('debug', 'Found Steam games via manifest discovery', {
                    gameId: options.gameId,
                    count: manifestCandidates.length
                });
            }
        }
        catch (err) {
            (0, log_1.log)('debug', 'Steam manifest discovery failed, falling back to directory search', {
                gameId: options.gameId,
                error: err.message
            });
        }
        // Fallback to directory-based discovery if manifest discovery didn't find anything
        if (candidates.length === 0) {
            const dirCandidates = yield discoverSteamGamesFromDirectories(options);
            candidates.push(...dirCandidates);
        }
        return candidates;
    });
}
/**
 * Discover Steam games using Steam manifest files (appmanifest_*.acf)
 */
function discoverSteamGamesFromManifests(options) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const candidates = [];
        for (const baseSteamPath of MACOS_STEAM_BASE_PATHS) {
            const expandedBase = expandHome(baseSteamPath);
            const steamAppsPaths = yield getSteamAppsPaths(expandedBase);
            for (const steamAppsPath of steamAppsPaths) {
                try {
                    const manifestFiles = yield readdir(steamAppsPath);
                    const appManifests = manifestFiles.filter(name => name.startsWith('appmanifest_') && name.endsWith('.acf'));
                    for (const manifestFile of appManifests) {
                        try {
                            const manifestPath = path.join(steamAppsPath, manifestFile);
                            const manifestContent = yield fs.promises.readFile(manifestPath, 'utf8');
                            // Parse Steam VDF format
                            const { parse } = yield Promise.resolve().then(() => __importStar(require('simple-vdf')));
                            const manifestData = parse(manifestContent);
                            if (!(manifestData === null || manifestData === void 0 ? void 0 : manifestData.AppState)) {
                                continue;
                            }
                            const appState = manifestData.AppState;
                            const gameName = ((_a = appState.name) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || '';
                            const installDir = appState.installdir;
                            // Check if this manifest matches our target game
                            const targetGameName = options.gameName.toLowerCase();
                            if (gameName.includes(targetGameName) || targetGameName.includes(gameName)) {
                                const gameDir = path.join(steamAppsPath, 'common', installDir);
                                // Verify the game directory exists
                                try {
                                    const stats = yield stat(gameDir);
                                    if (stats.isDirectory()) {
                                        // Try to find the executable
                                        const execCandidates = yield resolveGameExecutableWithRetry(options, gameDir);
                                        const bestExec = execCandidates.find(c => c.type === 'native' || c.type === 'app');
                                        if (bestExec) {
                                            // Determine if this is a native Steam game or running through compatibility layer
                                            const isNativeSteam = gameDir.includes('steamapps/common') && !gameDir.includes('CrossOver') && !gameDir.includes('Parallels');
                                            const isCrossOverSteam = gameDir.includes('CrossOver');
                                            const isParallelsSteam = gameDir.includes('Parallels');
                                            const priority = isNativeSteam ? exports.MACOS_DISCOVERY_PRIORITIES.STEAM_NATIVE :
                                                isCrossOverSteam ? exports.MACOS_DISCOVERY_PRIORITIES.STEAM_CROSSOVER :
                                                    isParallelsSteam ? exports.MACOS_DISCOVERY_PRIORITIES.STEAM_PARALLELS :
                                                        exports.MACOS_DISCOVERY_PRIORITIES.STEAM_NATIVE; // fallback
                                            candidates.push({
                                                path: gameDir,
                                                executable: bestExec.path,
                                                type: isNativeSteam ? 'steam' : isCrossOverSteam ? 'steam-crossover' : 'steam-parallels',
                                                priority: priority,
                                                store: 'steam',
                                                manifestData: {
                                                    appId: appState.appid,
                                                    name: appState.name,
                                                    installDir: installDir,
                                                    manifestPath: manifestPath,
                                                    compatibilityLayer: isNativeSteam ? 'native' : isCrossOverSteam ? 'crossover' : 'parallels'
                                                }
                                            });
                                            (0, log_1.log)('debug', 'Found Steam game via manifest', {
                                                gameId: options.gameId,
                                                appId: appState.appid,
                                                gameName: appState.name,
                                                gameDir,
                                                executable: bestExec.path,
                                                manifestFile
                                            });
                                        }
                                    }
                                }
                                catch (dirErr) {
                                    (0, log_1.log)('debug', 'Steam game directory not accessible', {
                                        gameId: options.gameId,
                                        gameDir,
                                        error: dirErr.message
                                    });
                                }
                            }
                        }
                        catch (manifestErr) {
                            (0, log_1.log)('debug', 'Failed to parse Steam manifest', {
                                gameId: options.gameId,
                                manifestFile,
                                error: manifestErr.message
                            });
                        }
                    }
                }
                catch (err) {
                    (0, log_1.log)('debug', 'Steam library not accessible for manifest discovery', {
                        gameId: options.gameId,
                        steamPath: steamAppsPath,
                        error: err.message
                    });
                }
            }
        }
        return candidates;
    });
}
/**
 * Fallback Steam discovery using directory search (legacy method)
 */
function discoverSteamGamesFromDirectories(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const candidates = [];
        for (const baseSteamPath of MACOS_STEAM_BASE_PATHS) {
            const expandedBase = expandHome(baseSteamPath);
            const steamAppsPaths = yield getSteamAppsPaths(expandedBase);
            for (const steamAppsPath of steamAppsPaths) {
                try {
                    const gameDir = path.join(steamAppsPath, 'common', options.gameName);
                    const stats = yield stat(gameDir);
                    if (stats.isDirectory()) {
                        const execCandidates = yield resolveGameExecutableWithRetry(options, gameDir);
                        const bestExec = execCandidates.find(c => c.type === 'native' || c.type === 'app');
                        if (bestExec) {
                            candidates.push({
                                path: gameDir,
                                executable: bestExec.path,
                                type: 'steam',
                                priority: exports.MACOS_DISCOVERY_PRIORITIES.STEAM_NATIVE,
                                store: 'steam'
                            });
                            (0, log_1.log)('debug', 'Found Steam game via directory search', {
                                gameId: options.gameId,
                                gameDir,
                                executable: bestExec.path,
                                steamPath: steamAppsPath
                            });
                        }
                    }
                }
                catch (err) {
                    (0, log_1.log)('debug', 'Steam game not found via directory search', {
                        gameId: options.gameId,
                        steamPath: steamAppsPath,
                        error: err.message
                    });
                }
            }
        }
        return candidates;
    });
}
/**
 * Discover Windows games on mounted macOS volumes (e.g., BOOTCAMP)
 */
function discoverWindowsGamesOnMacVolumes(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const candidates = [];
        if (!options.windowsExecutable) {
            return candidates;
        }
        const volumesDir = '/Volumes';
        try {
            const volumes = yield readdir(volumesDir);
            const windowsVolumeNames = ['BOOTCAMP', 'Windows', 'WIN', 'OS', 'Untitled'];
            for (const vol of volumes) {
                const volPath = path.join(volumesDir, vol);
                const stats = yield stat(volPath);
                if (!stats.isDirectory())
                    continue;
                // Heuristics: only check likely Windows volumes
                if (!windowsVolumeNames.some(name => vol.toLowerCase().includes(name.toLowerCase()))) {
                    continue;
                }
                const searchRoots = [
                    path.join(volPath, 'Program Files'),
                    path.join(volPath, 'Program Files (x86)'),
                    path.join(volPath, 'Games'),
                    path.join(volPath, 'Users', process.env.USER || 'Public', 'Desktop')
                ];
                for (const root of searchRoots) {
                    try {
                        const gameCandidate = yield findWindowsGameInPath(root, options);
                        if (gameCandidate) {
                            candidates.push({
                                path: gameCandidate.path,
                                executable: gameCandidate.executable,
                                type: 'windows',
                                priority: exports.MACOS_DISCOVERY_PRIORITIES.OTHER_WINDOWS,
                                store: 'windows',
                                manifestData: {
                                    appId: options.gameId,
                                    name: options.gameName,
                                    installDir: gameCandidate.path,
                                    manifestPath: 'windows-volume',
                                    source: 'windows-volume',
                                    gameId: options.gameId,
                                    windowsExecutable: options.windowsExecutable
                                }
                            });
                        }
                    }
                    catch (_) {
                        // ignore inaccessible roots
                    }
                }
            }
        }
        catch (err) {
            (0, log_1.log)('debug', 'Volumes directory not accessible for Windows scan', { error: err.message });
        }
        return candidates;
    });
}
/**
 * Helper function to resolve game executable with retry logic
 */
function resolveGameExecutableWithRetry(options, gameDir) {
    return __awaiter(this, void 0, void 0, function* () {
        let execCandidates = [];
        let retryCount = 0;
        const maxRetries = 3;
        while (retryCount < maxRetries) {
            try {
                const execOptions = {
                    gameName: options.gameName,
                    gameId: options.gameId,
                    basePath: gameDir,
                    windowsExecutable: options.windowsExecutable,
                    macExecutable: options.macExecutable,
                    appBundleName: options.appBundleName
                };
                execCandidates = yield (0, executableResolver_1.resolveGameExecutable)(execOptions);
                if (execCandidates.length > 0) {
                    break; // Success, exit retry loop
                }
            }
            catch (execErr) {
                retryCount++;
                if (retryCount >= maxRetries) {
                    throw execErr; // Re-throw on final attempt
                }
                // Wait briefly before retry to allow file system operations to complete
                yield new Promise(resolve => setTimeout(resolve, 100 * retryCount));
            }
        }
        return execCandidates;
    });
}
/**
 * Discover Epic Games Store games
 */
function discoverEpicGames(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const candidates = [];
        for (const epicPath of MACOS_EPIC_PATHS) {
            const expandedPath = epicPath.replace('~', process.env.HOME || '');
            try {
                const manifests = yield readdir(expandedPath);
                for (const manifest of manifests) {
                    if (manifest.endsWith('.item')) {
                        try {
                            const manifestPath = path.join(expandedPath, manifest);
                            const manifestContent = yield fs.promises.readFile(manifestPath, 'utf8');
                            const manifestData = JSON.parse(manifestContent);
                            // Check if this manifest matches our game
                            if (manifestData.DisplayName &&
                                manifestData.DisplayName.toLowerCase().includes(options.gameName.toLowerCase())) {
                                const installLocation = manifestData.InstallLocation;
                                if (installLocation) {
                                    // Try to find the executable
                                    try {
                                        const execOptions = {
                                            gameName: options.gameName,
                                            gameId: options.gameId,
                                            basePath: installLocation,
                                            windowsExecutable: options.windowsExecutable,
                                            macExecutable: options.macExecutable,
                                            appBundleName: options.appBundleName
                                        };
                                        const execCandidates = yield (0, executableResolver_1.resolveGameExecutable)(execOptions);
                                        const bestExec = execCandidates.find(c => c.type === 'native' || c.type === 'app');
                                        if (bestExec) {
                                            // Determine if this is a native Epic game or running through compatibility layer
                                            const isNativeEpic = installLocation.includes('Epic Games') && !installLocation.includes('CrossOver') && !installLocation.includes('Parallels');
                                            const isCrossOverEpic = installLocation.includes('CrossOver');
                                            const isParallelsEpic = installLocation.includes('Parallels');
                                            const priority = isNativeEpic ? exports.MACOS_DISCOVERY_PRIORITIES.EPIC_NATIVE :
                                                isCrossOverEpic ? exports.MACOS_DISCOVERY_PRIORITIES.EPIC_CROSSOVER :
                                                    isParallelsEpic ? exports.MACOS_DISCOVERY_PRIORITIES.EPIC_PARALLELS :
                                                        exports.MACOS_DISCOVERY_PRIORITIES.EPIC_NATIVE; // fallback
                                            candidates.push({
                                                path: installLocation,
                                                executable: bestExec.path,
                                                type: isNativeEpic ? 'epic' : isCrossOverEpic ? 'epic-crossover' : 'epic-parallels',
                                                priority: priority,
                                                store: 'epic',
                                                manifestData: {
                                                    appId: manifestData.AppName || manifestData.DisplayName,
                                                    name: manifestData.DisplayName,
                                                    installDir: installLocation,
                                                    manifestPath: manifestPath,
                                                    source: 'epic-manifest',
                                                    manifestFile: manifest,
                                                    gameId: options.gameId,
                                                    compatibilityLayer: isNativeEpic ? 'native' : isCrossOverEpic ? 'crossover' : 'parallels'
                                                }
                                            });
                                            (0, log_1.log)('debug', 'Found Epic Games Store game', {
                                                gameId: options.gameId,
                                                displayName: manifestData.DisplayName,
                                                installLocation,
                                                executable: bestExec.path
                                            });
                                        }
                                    }
                                    catch (execErr) {
                                        (0, log_1.log)('warn', 'Failed to resolve executable for Epic game', {
                                            gameId: options.gameId,
                                            installLocation,
                                            error: execErr.message
                                        });
                                    }
                                }
                            }
                        }
                        catch (err) {
                            (0, log_1.log)('debug', 'Failed to parse Epic manifest', {
                                gameId: options.gameId,
                                manifestPath: path.join(expandedPath, manifest),
                                error: err.message
                            });
                        }
                    }
                }
            }
            catch (err) {
                // Epic path doesn't exist
            }
        }
        return candidates;
    });
}
/**
 * Discover GOG Galaxy games
 */
function discoverGOGGames(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const candidates = [];
        for (const gogPath of MACOS_GOG_PATHS) {
            const expandedPath = gogPath.replace('~', process.env.HOME || '');
            try {
                const games = yield readdir(expandedPath);
                for (const gameDir of games) {
                    const gamePath = path.join(expandedPath, gameDir);
                    const stats = yield stat(gamePath);
                    if (stats.isDirectory() &&
                        gameDir.toLowerCase().includes(options.gameName.toLowerCase())) {
                        // Try to find the executable
                        const execOptions = {
                            gameName: options.gameName,
                            gameId: options.gameId,
                            basePath: gamePath,
                            windowsExecutable: options.windowsExecutable,
                            macExecutable: options.macExecutable,
                            appBundleName: options.appBundleName
                        };
                        const execCandidates = yield (0, executableResolver_1.resolveGameExecutable)(execOptions);
                        const bestExec = execCandidates.find(c => c.type === 'native' || c.type === 'app');
                        if (bestExec) {
                            // Determine if this is a native GOG game or running through compatibility layer
                            const isNativeGOG = gamePath.includes('GOG Galaxy') && !gamePath.includes('CrossOver') && !gamePath.includes('Parallels');
                            const isCrossOverGOG = gamePath.includes('CrossOver');
                            const isParallelsGOG = gamePath.includes('Parallels');
                            const priority = isNativeGOG ? exports.MACOS_DISCOVERY_PRIORITIES.GOG_NATIVE :
                                isCrossOverGOG ? exports.MACOS_DISCOVERY_PRIORITIES.GOG_CROSSOVER :
                                    isParallelsGOG ? exports.MACOS_DISCOVERY_PRIORITIES.GOG_PARALLELS :
                                        exports.MACOS_DISCOVERY_PRIORITIES.GOG_NATIVE; // fallback
                            candidates.push({
                                path: gamePath,
                                executable: bestExec.path,
                                type: isNativeGOG ? 'gog' : isCrossOverGOG ? 'gog-crossover' : 'gog-parallels',
                                priority: priority,
                                store: 'gog',
                                manifestData: {
                                    appId: gameDir,
                                    name: gameDir,
                                    installDir: gamePath,
                                    manifestPath: 'gog-galaxy',
                                    source: 'gog-galaxy',
                                    gameId: options.gameId,
                                    compatibilityLayer: isNativeGOG ? 'native' : isCrossOverGOG ? 'crossover' : 'parallels'
                                }
                            });
                        }
                    }
                }
            }
            catch (err) {
                // GOG path doesn't exist
            }
        }
        return candidates;
    });
}
/**
 * Discover CrossOver Windows games
 */
function discoverCrossOverGames(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const candidates = [];
        for (const crossoverPath of CROSSOVER_PATHS) {
            const expandedPath = crossoverPath.replace('~', process.env.HOME || '');
            try {
                const bottles = yield readdir(expandedPath);
                for (const bottle of bottles) {
                    const bottlePath = path.join(expandedPath, bottle);
                    const driveC = path.join(bottlePath, 'drive_c');
                    try {
                        yield stat(driveC);
                        // Look for the Windows executable in common game directories
                        const commonDirs = [
                            'Program Files',
                            'Program Files (x86)',
                            'Games'
                        ];
                        for (const dir of commonDirs) {
                            const searchPath = path.join(driveC, dir);
                            const gameCandidate = yield findWindowsGameInPath(searchPath, options);
                            if (gameCandidate) {
                                // Determine the specific type of CrossOver game based on path
                                const isSteamGame = options.windowsExecutable && options.windowsExecutable.includes('Steam');
                                const isEpicGame = options.windowsExecutable && options.windowsExecutable.includes('Epic');
                                const isGOGGame = options.windowsExecutable && options.windowsExecutable.includes('GOG');
                                const priority = isSteamGame ? exports.MACOS_DISCOVERY_PRIORITIES.STEAM_CROSSOVER :
                                    isEpicGame ? exports.MACOS_DISCOVERY_PRIORITIES.EPIC_CROSSOVER :
                                        isGOGGame ? exports.MACOS_DISCOVERY_PRIORITIES.GOG_CROSSOVER :
                                            exports.MACOS_DISCOVERY_PRIORITIES.CROSSOVER;
                                const store = isSteamGame ? 'steam-crossover' :
                                    isEpicGame ? 'epic-crossover' :
                                        isGOGGame ? 'gog-crossover' :
                                            'crossover';
                                const type = isSteamGame ? 'steam-crossover' :
                                    isEpicGame ? 'epic-crossover' :
                                        isGOGGame ? 'gog-crossover' :
                                            'windows-crossover';
                                candidates.push({
                                    path: gameCandidate.path,
                                    executable: gameCandidate.executable,
                                    type: type,
                                    priority: priority,
                                    store: store,
                                    manifestData: {
                                        appId: bottle,
                                        name: bottle,
                                        installDir: bottlePath,
                                        manifestPath: 'crossover',
                                        source: 'crossover',
                                        bottlePath: bottlePath,
                                        gameId: options.gameId,
                                        windowsExecutable: options.windowsExecutable,
                                        compatibilityLayer: 'crossover'
                                    }
                                });
                            }
                        }
                    }
                    catch (err) {
                        // Bottle doesn't exist or can't be accessed
                    }
                }
            }
            catch (err) {
                // CrossOver path doesn't exist
            }
        }
        return candidates;
    });
}
/**
 * Discover Parallels Windows games
 */
function discoverParallelsGames(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const candidates = [];
        // Enhanced Parallels discovery with VM configuration parsing
        for (const parallelsPath of PARALLELS_PATHS) {
            const expandedPath = parallelsPath.replace('~', process.env.HOME || '');
            try {
                // Look for Parallels VM configurations
                const vmDirs = yield readdir(expandedPath);
                for (const vmDir of vmDirs) {
                    const vmPath = path.join(expandedPath, vmDir);
                    const stats = yield stat(vmPath);
                    if (stats.isDirectory()) {
                        // Look for Windows executables in the VM
                        // This is a simplified implementation - a full implementation would parse .pvm files
                        const gameCandidate = yield findWindowsGameInParallelsVM(vmPath, options);
                        if (gameCandidate) {
                            // Determine the specific type of Parallels game based on executable
                            const isSteamGame = options.windowsExecutable && options.windowsExecutable.includes('Steam');
                            const isEpicGame = options.windowsExecutable && options.windowsExecutable.includes('Epic');
                            const isGOGGame = options.windowsExecutable && options.windowsExecutable.includes('GOG');
                            const priority = isSteamGame ? exports.MACOS_DISCOVERY_PRIORITIES.STEAM_PARALLELS :
                                isEpicGame ? exports.MACOS_DISCOVERY_PRIORITIES.EPIC_PARALLELS :
                                    isGOGGame ? exports.MACOS_DISCOVERY_PRIORITIES.GOG_PARALLELS :
                                        exports.MACOS_DISCOVERY_PRIORITIES.PARALLELS;
                            const store = isSteamGame ? 'steam-parallels' :
                                isEpicGame ? 'epic-parallels' :
                                    isGOGGame ? 'gog-parallels' :
                                        'parallels';
                            const type = isSteamGame ? 'steam-parallels' :
                                isEpicGame ? 'epic-parallels' :
                                    isGOGGame ? 'gog-parallels' :
                                        'windows-parallels';
                            candidates.push({
                                path: gameCandidate.path,
                                executable: gameCandidate.executable,
                                type: type,
                                priority: priority,
                                store: store,
                                manifestData: {
                                    appId: vmDir,
                                    name: vmDir,
                                    installDir: vmPath,
                                    manifestPath: 'parallels',
                                    source: 'parallels',
                                    vmPath: vmPath,
                                    gameId: options.gameId,
                                    windowsExecutable: options.windowsExecutable,
                                    compatibilityLayer: 'parallels'
                                }
                            });
                        }
                    }
                }
            }
            catch (err) {
                // Parallels path doesn't exist or can't be accessed
                (0, log_1.log)('debug', 'Parallels path not accessible', {
                    parallelsPath: expandedPath,
                    error: err.message
                });
            }
        }
        return candidates;
    });
}
/**
 * Discover games from other Mac game stores (Itch.io, Humble Bundle, etc.)
 */
function discoverOtherMacStores(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const candidates = [];
        // Common paths for other Mac game stores
        const otherStorePaths = [
            '~/Library/Application Support/itch',
            '~/Library/Application Support/Humble App',
            '~/Library/Application Support/Glyph', // Trion Worlds
            '~/Library/Application Support/Origin', // EA App
            '~/Library/Application Support/Uplay' // Ubisoft Connect
        ];
        for (const storePath of otherStorePaths) {
            const expandedPath = storePath.replace('~', process.env.HOME || '');
            try {
                const stats = yield stat(expandedPath);
                if (stats.isDirectory()) {
                    // Look for game executables in common subdirectories
                    const commonDirs = ['games', 'Apps', 'Applications'];
                    for (const dir of commonDirs) {
                        const searchPath = path.join(expandedPath, dir);
                        try {
                            const entries = yield readdir(searchPath);
                            for (const entry of entries) {
                                const entryPath = path.join(searchPath, entry);
                                const entryStats = yield stat(entryPath);
                                if (entryStats.isDirectory() && entry.toLowerCase().includes(options.gameName.toLowerCase())) {
                                    // Try to find the executable
                                    const execOptions = {
                                        gameName: options.gameName,
                                        gameId: options.gameId,
                                        basePath: entryPath,
                                        windowsExecutable: options.windowsExecutable,
                                        macExecutable: options.macExecutable,
                                        appBundleName: options.appBundleName
                                    };
                                    const execCandidates = yield (0, executableResolver_1.resolveGameExecutable)(execOptions);
                                    const bestExec = execCandidates.find(c => c.type === 'native' || c.type === 'app');
                                    if (bestExec) {
                                        candidates.push({
                                            path: entryPath,
                                            executable: bestExec.path,
                                            type: 'other-store',
                                            priority: exports.MACOS_DISCOVERY_PRIORITIES.OTHER_MAC_STORES,
                                            store: 'other',
                                            manifestData: {
                                                appId: entry,
                                                name: entry,
                                                installDir: entryPath,
                                                manifestPath: 'other-store',
                                                source: 'other-store',
                                                storePath: expandedPath,
                                                gameId: options.gameId
                                            }
                                        });
                                        (0, log_1.log)('debug', 'Found game in other Mac store', {
                                            gameId: options.gameId,
                                            storePath: expandedPath,
                                            gamePath: entryPath,
                                            executable: bestExec.path
                                        });
                                    }
                                }
                            }
                        }
                        catch (err) {
                            // Directory doesn't exist or can't be accessed
                        }
                    }
                }
            }
            catch (err) {
                // Store path doesn't exist
            }
        }
        return candidates;
    });
}
/**
 * Discover VMware Windows games
 */
function discoverVMwareGames(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const candidates = [];
        // VMware paths
        const vmwarePaths = [
            '~/Documents/Virtual Machines',
            '~/Virtual Machines'
        ];
        for (const vmwarePath of vmwarePaths) {
            const expandedPath = vmwarePath.replace('~', process.env.HOME || '');
            try {
                const vmDirs = yield readdir(expandedPath);
                for (const vmDir of vmDirs) {
                    const vmPath = path.join(expandedPath, vmDir);
                    const stats = yield stat(vmPath);
                    if (stats.isDirectory()) {
                        // Look for Windows executables in the VM
                        const gameCandidate = yield findWindowsGameInVMwareVM(vmPath, options);
                        if (gameCandidate) {
                            candidates.push({
                                path: gameCandidate.path,
                                executable: gameCandidate.executable,
                                type: 'windows-vmware',
                                priority: exports.MACOS_DISCOVERY_PRIORITIES.VMWARE,
                                store: 'vmware',
                                manifestData: {
                                    appId: vmDir,
                                    name: vmDir,
                                    installDir: vmPath,
                                    manifestPath: 'vmware',
                                    source: 'vmware',
                                    vmPath: vmPath,
                                    gameId: options.gameId,
                                    windowsExecutable: options.windowsExecutable,
                                    compatibilityLayer: 'vmware'
                                }
                            });
                        }
                    }
                }
            }
            catch (err) {
                // VMware path doesn't exist or can't be accessed
                (0, log_1.log)('debug', 'VMware path not accessible', {
                    vmwarePath: expandedPath,
                    error: err.message
                });
            }
        }
        return candidates;
    });
}
/**
 * Helper function to find Windows games in a VMware VM
 */
function findWindowsGameInVMwareVM(vmPath, options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!options.windowsExecutable) {
            return null;
        }
        try {
            // VMware VMs typically have virtual disk files (.vmdk)
            // This is a simplified approach - a full implementation would mount the VM disk
            const windowsPaths = [
                path.join(vmPath, 'Documents and Settings'), // Older Windows versions
                path.join(vmPath, 'Users'), // Newer Windows versions
                path.join(vmPath, 'Program Files'),
                path.join(vmPath, 'Program Files (x86)')
            ];
            for (const windowsPath of windowsPaths) {
                try {
                    const gameCandidate = yield findWindowsGameInPath(windowsPath, options);
                    if (gameCandidate) {
                        return gameCandidate;
                    }
                }
                catch (err) {
                    // Continue to next path
                }
            }
        }
        catch (err) {
            // VM path doesn't exist or can't be accessed
            (0, log_1.log)('debug', 'Could not access VMware VM path', {
                vmPath,
                error: err.message
            });
        }
        return null;
    });
}
/**
 * Helper function to find Windows games in a specific path
 */
function findWindowsGameInPath(searchPath, options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!options.windowsExecutable) {
            return null;
        }
        try {
            const entries = yield readdir(searchPath);
            for (const entry of entries) {
                const entryPath = path.join(searchPath, entry);
                const stats = yield stat(entryPath);
                if (stats.isDirectory()) {
                    // Check if this directory contains our game
                    const execPath = path.join(entryPath, options.windowsExecutable);
                    try {
                        yield stat(execPath);
                        return {
                            path: entryPath,
                            executable: execPath
                        };
                    }
                    catch (err) {
                        // Executable not found, continue searching
                    }
                }
            }
        }
        catch (err) {
            // Directory doesn't exist or can't be accessed
        }
        return null;
    });
}
/**
 * Helper function to find Windows games in a Parallels VM
 * This is a simplified implementation - a full implementation would parse .pvm files
 */
function findWindowsGameInParallelsVM(vmPath, options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!options.windowsExecutable) {
            return null;
        }
        try {
            // In a typical Parallels setup, Windows executables would be in the VM's drive
            // This is a simplified approach - a full implementation would mount the VM disk
            const windowsPaths = [
                path.join(vmPath, 'Documents and Settings'), // Older Windows versions
                path.join(vmPath, 'Users'), // Newer Windows versions
                path.join(vmPath, 'Program Files'),
                path.join(vmPath, 'Program Files (x86)')
            ];
            for (const windowsPath of windowsPaths) {
                try {
                    const gameCandidate = yield findWindowsGameInPath(windowsPath, options);
                    if (gameCandidate) {
                        return gameCandidate;
                    }
                }
                catch (err) {
                    // Continue to next path
                }
            }
        }
        catch (err) {
            // VM path doesn't exist or can't be accessed
            (0, log_1.log)('debug', 'Could not access Parallels VM path', {
                vmPath,
                error: err.message
            });
        }
        return null;
    });
}
/**
 * Get the best game candidate from discovery results
 * Enhanced with more sophisticated selection logic based on priority and confidence
 */
function getBestMacOSGameCandidate(candidates) {
    if (candidates.length === 0) {
        return null;
    }
    // Sort by priority first (lowest number = highest priority)
    candidates.sort((a, b) => a.priority - b.priority);
    // If we have multiple candidates with the same priority, try to select the best one
    const highestPriority = candidates[0].priority;
    const samePriorityCandidates = candidates.filter(c => c.priority === highestPriority);
    if (samePriorityCandidates.length > 1) {
        // Prefer candidates with more detailed manifest data
        const candidatesWithManifest = samePriorityCandidates.filter(c => c.manifestData);
        if (candidatesWithManifest.length > 0) {
            // Prefer candidates with higher confidence levels
            candidatesWithManifest.sort((a, b) => {
                var _a, _b;
                const aConfidence = ((_a = a.manifestData) === null || _a === void 0 ? void 0 : _a.matchConfidence) || 'low';
                const bConfidence = ((_b = b.manifestData) === null || _b === void 0 ? void 0 : _b.matchConfidence) || 'low';
                const confidenceLevels = { 'high': 3, 'medium': 2, 'low': 1 };
                return confidenceLevels[bConfidence] - confidenceLevels[aConfidence];
            });
            return candidatesWithManifest[0];
        }
        // If no manifest data, prefer native over compatibility layers
        const nativeCandidates = samePriorityCandidates.filter(c => c.type === 'app' || c.type === 'native' || c.type === 'steam' || c.type === 'epic' || c.type === 'gog');
        if (nativeCandidates.length > 0) {
            return nativeCandidates[0];
        }
    }
    // Return the highest priority candidate
    return candidates[0];
}
