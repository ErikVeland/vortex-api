"use strict";
/**
 * Platform-aware executable resolution utilities for game discovery
 * Handles different executable formats (.exe, .app, native binaries) across platforms
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveGameExecutable = resolveGameExecutable;
exports.getBestExecutableCandidate = getBestExecutableCandidate;
exports.getGameExecutablePath = getGameExecutablePath;
exports.isAppBundle = isAppBundle;
exports.isWindowsExecutable = isWindowsExecutable;
exports.getExecutableType = getExecutableType;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const util_1 = require("util");
const platform_1 = require("./platform");
const log_1 = require("./log");
const macOSGameCompatibility_1 = require("./macOSGameCompatibility");
const stat = (0, util_1.promisify)(fs.stat);
const readdir = (0, util_1.promisify)(fs.readdir);
/**
 * Resolve platform-appropriate executable for a game
 * Implements macOS priority order: native > app store > steam > other mac stores > windows games
 */
function resolveGameExecutable(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const candidates = [];
        if ((0, platform_1.isMacOS)()) {
            // Check if we have a compatibility fix for this game
            const gameFix = (0, macOSGameCompatibility_1.getMacOSGameFix)(options.gameId);
            if (gameFix) {
                // Priority 0: Use compatibility system for known games
                const appBundlePath = yield (0, macOSGameCompatibility_1.findMacOSAppBundle)(options.basePath, gameFix.macOSAppBundle);
                if (appBundlePath) {
                    candidates.push({
                        path: appBundlePath,
                        type: 'app',
                        priority: 0,
                        platform: 'darwin'
                    });
                    (0, log_1.log)('debug', 'Found game via compatibility system', {
                        gameId: options.gameId,
                        appBundlePath,
                        basePath: options.basePath
                    });
                }
                // Check alternative files
                if (gameFix.alternativeFiles) {
                    for (const altFile of gameFix.alternativeFiles) {
                        const altPath = path.join(options.basePath, altFile);
                        try {
                            const stats = yield stat(altPath);
                            if (stats.isFile() || (stats.isDirectory() && altFile.endsWith('.app'))) {
                                candidates.push({
                                    path: altPath,
                                    type: altFile.endsWith('.app') ? 'app' : 'native',
                                    priority: 0,
                                    platform: 'darwin'
                                });
                                (0, log_1.log)('debug', 'Found alternative file via compatibility system', {
                                    gameId: options.gameId,
                                    altPath,
                                    basePath: options.basePath
                                });
                            }
                        }
                        catch (err) {
                            // Alternative file not found, continue
                        }
                    }
                }
            }
            // Priority 1: Native macOS executable
            if (options.macExecutable) {
                const nativeCandidate = yield findNativeExecutable(options.basePath, options.macExecutable, options.gameId);
                if (nativeCandidate) {
                    candidates.push({
                        path: nativeCandidate,
                        type: 'native',
                        priority: 1,
                        platform: 'darwin'
                    });
                }
            }
            // Priority 2: macOS App Bundle
            if (options.appBundleName) {
                const appCandidate = yield findAppBundle(options.basePath, options.appBundleName);
                if (appCandidate) {
                    candidates.push({
                        path: appCandidate,
                        type: 'app',
                        priority: 2,
                        platform: 'darwin'
                    });
                }
            }
            // Priority 3: Windows executable via virtualization (CrossOver, Parallels, etc.)
            if (options.windowsExecutable) {
                const windowsCandidate = yield findWindowsExecutable(options.basePath, options.windowsExecutable, options.gameId);
                if (windowsCandidate) {
                    candidates.push({
                        path: windowsCandidate,
                        type: 'windows',
                        priority: 3,
                        platform: 'darwin'
                    });
                }
            }
        }
        else if ((0, platform_1.isWindows)()) {
            // Windows: prioritize native Windows executable
            if (options.windowsExecutable) {
                const windowsCandidate = yield findWindowsExecutable(options.basePath, options.windowsExecutable, options.gameId);
                if (windowsCandidate) {
                    candidates.push({
                        path: windowsCandidate,
                        type: 'native',
                        priority: 1,
                        platform: 'win32'
                    });
                }
            }
        }
        else if ((0, platform_1.isLinux)()) {
            // Linux: prioritize native Linux executable, then Wine
            if (options.linuxExecutable) {
                const linuxCandidate = yield findNativeExecutable(options.basePath, options.linuxExecutable, options.gameId);
                if (linuxCandidate) {
                    candidates.push({
                        path: linuxCandidate,
                        type: 'native',
                        priority: 1,
                        platform: 'linux'
                    });
                }
            }
            if (options.windowsExecutable) {
                const wineCandidate = yield findWindowsExecutable(options.basePath, options.windowsExecutable, options.gameId);
                if (wineCandidate) {
                    candidates.push({
                        path: wineCandidate,
                        type: 'wine',
                        priority: 2,
                        platform: 'linux'
                    });
                }
            }
        }
        // Sort by priority (lower number = higher priority)
        return candidates.sort((a, b) => a.priority - b.priority);
    });
}
/**
 * Find native executable (macOS/Linux binary)
 * Enhanced with executable name mapping for better cross-platform compatibility
 */
function findNativeExecutable(basePath, executableName, gameId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Try to map the Windows executable name to macOS equivalent
            let mappedExecutableName = executableName;
            // Only try mapping if we're on macOS and the executable name looks like a Windows executable
            if (process.platform === 'darwin' && executableName.toLowerCase().endsWith('.exe')) {
                try {
                    const macOSGameCompatibility = require('./macOSGameCompatibility');
                    if (macOSGameCompatibility && typeof macOSGameCompatibility.mapWindowsExecutableToMacOS === 'function') {
                        mappedExecutableName = macOSGameCompatibility.mapWindowsExecutableToMacOS(executableName, gameId);
                        (0, log_1.log)('debug', 'Mapped Windows executable to macOS equivalent', {
                            windowsExecutable: executableName,
                            macOSExecutable: mappedExecutableName,
                            gameId
                        });
                    }
                }
                catch (err) {
                    (0, log_1.log)('debug', 'Could not use executable name mapping, using original name', {
                        executableName,
                        error: err.message
                    });
                }
            }
            const candidates = [
                path.join(basePath, mappedExecutableName),
                path.join(basePath, executableName), // Original name as fallback
                path.join(basePath, 'bin', mappedExecutableName),
                path.join(basePath, 'bin', executableName), // Original name as fallback
                path.join(basePath, 'Contents', 'MacOS', mappedExecutableName), // For app bundles
                path.join(basePath, 'Contents', 'MacOS', executableName), // Original name as fallback
            ];
            // Add candidates with .exe extension removed for macOS
            if (mappedExecutableName.toLowerCase().endsWith('.exe')) {
                const baseName = mappedExecutableName.slice(0, -4);
                candidates.push(path.join(basePath, baseName), path.join(basePath, 'bin', baseName), path.join(basePath, 'Contents', 'MacOS', baseName));
            }
            for (const candidate of candidates) {
                try {
                    const stats = yield stat(candidate);
                    if (stats.isFile() && (stats.mode & parseInt('111', 8))) { // Check if executable
                        return candidate;
                    }
                }
                catch (err) {
                    // File doesn't exist, continue
                }
            }
        }
        catch (err) {
            (0, log_1.log)('warn', 'Error finding native executable', { basePath, executableName, error: err.message });
        }
        return null;
    });
}
/**
 * Find macOS App Bundle
 */
function findAppBundle(basePath, appBundleName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const appName = appBundleName.endsWith('.app') ? appBundleName : `${appBundleName}.app`;
            const candidates = [
                path.join(basePath, appName),
                path.join(basePath, '..', appName), // Sometimes apps are in parent directory
                path.join('/Applications', appName), // System-wide installation
            ];
            for (const candidate of candidates) {
                try {
                    const stats = yield stat(candidate);
                    if (stats.isDirectory()) {
                        // Check if it's a valid app bundle
                        const infoPlistPath = path.join(candidate, 'Contents', 'Info.plist');
                        try {
                            yield stat(infoPlistPath);
                            return candidate;
                        }
                        catch (err) {
                            // Not a valid app bundle
                        }
                    }
                }
                catch (err) {
                    // Directory doesn't exist, continue
                }
            }
        }
        catch (err) {
            (0, log_1.log)('warn', 'Error finding app bundle', { basePath, appBundleName, error: err.message });
        }
        return null;
    });
}
/**
 * Find Windows executable (native on Windows, or via virtualization on macOS/Linux)
 * Enhanced with executable name mapping for better cross-platform compatibility
 */
function findWindowsExecutable(basePath, executableName, gameId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Try to map the Windows executable name to a more appropriate name
            let mappedExecutableName = executableName;
            // On macOS, try to map to a native equivalent when looking for Windows executables
            if (process.platform === 'darwin') {
                try {
                    const macOSGameCompatibility = require('./macOSGameCompatibility');
                    if (macOSGameCompatibility && typeof macOSGameCompatibility.mapWindowsExecutableToMacOS === 'function') {
                        mappedExecutableName = macOSGameCompatibility.mapWindowsExecutableToMacOS(executableName, gameId);
                        (0, log_1.log)('debug', 'Mapped Windows executable to potential macOS equivalent for CrossOver/Parallels', {
                            windowsExecutable: executableName,
                            mappedExecutable: mappedExecutableName,
                            gameId
                        });
                    }
                }
                catch (err) {
                    (0, log_1.log)('debug', 'Could not use executable name mapping for Windows executable, using original name', {
                        executableName,
                        error: err.message
                    });
                }
            }
            const exeName = executableName.endsWith('.exe') ? executableName : `${executableName}.exe`;
            const mappedExeName = mappedExecutableName.endsWith('.exe') ? mappedExecutableName : `${mappedExecutableName}.exe`;
            const candidates = [
                path.join(basePath, mappedExeName),
                path.join(basePath, exeName), // Original name as fallback
                path.join(basePath, 'bin', mappedExeName),
                path.join(basePath, 'bin', exeName), // Original name as fallback
                path.join(basePath, 'Binaries', mappedExeName),
                path.join(basePath, 'Binaries', exeName), // Original name as fallback
                path.join(basePath, 'Game', mappedExeName),
                path.join(basePath, 'Game', exeName), // Original name as fallback
            ];
            // On macOS, also add candidates for native executables
            if (process.platform === 'darwin') {
                candidates.push(path.join(basePath, mappedExecutableName), path.join(basePath, executableName), // Original name as fallback
                path.join(basePath, 'bin', mappedExecutableName), path.join(basePath, 'bin', executableName), // Original name as fallback
                path.join(basePath, 'Binaries', mappedExecutableName), path.join(basePath, 'Binaries', executableName) // Original name as fallback
                );
                // Add candidates with .exe extension removed for macOS
                if (mappedExecutableName.toLowerCase().endsWith('.exe')) {
                    const baseName = mappedExecutableName.slice(0, -4);
                    candidates.push(path.join(basePath, baseName), path.join(basePath, 'bin', baseName), path.join(basePath, 'Binaries', baseName));
                }
            }
            for (const candidate of candidates) {
                try {
                    const stats = yield stat(candidate);
                    if (stats.isFile()) {
                        return candidate;
                    }
                }
                catch (err) {
                    // File doesn't exist, continue
                }
            }
        }
        catch (err) {
            (0, log_1.log)('warn', 'Error finding Windows executable', { basePath, executableName, error: err.message });
        }
        return null;
    });
}
/**
 * Get the best executable candidate from a list
 */
function getBestExecutableCandidate(candidates) {
    if (candidates.length === 0) {
        return null;
    }
    // Return the highest priority candidate (lowest priority number)
    return candidates[0];
}
/**
 * Legacy function wrapper for backward compatibility
 * Returns the path of the best executable candidate
 */
function getGameExecutablePath(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const candidates = yield resolveGameExecutable(options);
        const best = getBestExecutableCandidate(candidates);
        return best ? best.path : null;
    });
}
/**
 * Check if a path points to a macOS app bundle
 */
function isAppBundle(executablePath) {
    return (0, platform_1.isMacOS)() && executablePath.endsWith('.app');
}
/**
 * Check if a path points to a Windows executable
 */
function isWindowsExecutable(executablePath) {
    return executablePath.toLowerCase().endsWith('.exe');
}
/**
 * Get executable type from path
 */
function getExecutableType(executablePath) {
    if (isAppBundle(executablePath)) {
        return 'app';
    }
    if (isWindowsExecutable(executablePath)) {
        return 'windows';
    }
    if ((0, platform_1.isMacOS)() || (0, platform_1.isLinux)()) {
        return 'native';
    }
    return 'unknown';
}
