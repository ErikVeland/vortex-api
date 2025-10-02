"use strict";
/**
 * Platform detection utilities for consistent cross-platform behavior
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMacOSWithVirtualization = exports.isWineAvailable = exports.getWineDriveCPath = exports.getWinePrefixPath = exports.normalizePath = exports.isPathCaseSensitive = exports.getDocumentsPath = exports.getHomeDirectory = exports.getAppDataPath = exports.platformSwitch = exports.getLineEnding = exports.getPathSeparator = exports.getExecutableExtension = exports.isUnix = exports.isLinux = exports.isMacOS = exports.isWindows = exports.getCurrentPlatform = void 0;
/**
 * Get the current platform
 */
function getCurrentPlatform() {
    return process.platform;
}
exports.getCurrentPlatform = getCurrentPlatform;
/**
 * Check if running on Windows
 */
function isWindows() {
    return process.platform === 'win32';
}
exports.isWindows = isWindows;
/**
 * Check if running on macOS
 */
function isMacOS() {
    return process.platform === 'darwin';
}
exports.isMacOS = isMacOS;
/**
 * Check if running on Linux
 */
function isLinux() {
    return process.platform === 'linux';
}
exports.isLinux = isLinux;
/**
 * Check if running on a Unix-like system (macOS or Linux)
 */
function isUnix() {
    return isMacOS() || isLinux();
}
exports.isUnix = isUnix;
/**
 * Get platform-specific executable extension
 */
function getExecutableExtension() {
    return isWindows() ? '.exe' : '';
}
exports.getExecutableExtension = getExecutableExtension;
/**
 * Get platform-specific path separator
 */
function getPathSeparator() {
    return isWindows() ? '\\' : '/';
}
exports.getPathSeparator = getPathSeparator;
/**
 * Get platform-specific line ending
 */
function getLineEnding() {
    return isWindows() ? '\r\n' : '\n';
}
exports.getLineEnding = getLineEnding;
/**
 * Execute platform-specific logic
 */
function platformSwitch(options) {
    const platform = getCurrentPlatform();
    if (options[platform]) {
        return options[platform]();
    }
    if (options.default) {
        return options.default();
    }
    throw new Error(`No handler defined for platform: ${platform}`);
}
exports.platformSwitch = platformSwitch;
/**
 * Get platform-specific application data directory
 */
function getAppDataPath() {
    return platformSwitch({
        win32: () => process.env.APPDATA || '',
        darwin: () => process.env.HOME ? `${process.env.HOME}/Library/Application Support` : '',
        linux: () => process.env.XDG_CONFIG_HOME || (process.env.HOME ? `${process.env.HOME}/.config` : ''),
        default: () => ''
    });
}
exports.getAppDataPath = getAppDataPath;
/**
 * Get platform-specific user home directory
 */
function getHomeDirectory() {
    return process.env.HOME || process.env.USERPROFILE || '';
}
exports.getHomeDirectory = getHomeDirectory;
/**
 * Get platform-specific documents directory
 */
function getDocumentsPath() {
    return platformSwitch({
        win32: () => process.env.USERPROFILE ? `${process.env.USERPROFILE}\\Documents` : '',
        darwin: () => process.env.HOME ? `${process.env.HOME}/Documents` : '',
        linux: () => process.env.HOME ? `${process.env.HOME}/Documents` : '',
        default: () => ''
    });
}
exports.getDocumentsPath = getDocumentsPath;
/**
 * Check if a path is case-sensitive on the current platform
 */
function isPathCaseSensitive() {
    return !isWindows();
}
exports.isPathCaseSensitive = isPathCaseSensitive;
/**
 * Normalize path separators for the current platform
 */
function normalizePath(inputPath) {
    if (isWindows()) {
        return inputPath.replace(/\//g, '\\');
    }
    else {
        return inputPath.replace(/\\/g, '/');
    }
}
exports.normalizePath = normalizePath;
/**
 * Get platform-specific Wine prefix path for Linux
 */
function getWinePrefixPath() {
    if (!isLinux()) {
        return '';
    }
    return process.env.WINEPREFIX ||
        (process.env.HOME ? `${process.env.HOME}/.wine` : '');
}
exports.getWinePrefixPath = getWinePrefixPath;
/**
 * Get Wine drive C path for Linux
 */
function getWineDriveCPath() {
    if (!isLinux()) {
        return '';
    }
    const winePrefix = getWinePrefixPath();
    return winePrefix ? `${winePrefix}/drive_c` : '';
}
exports.getWineDriveCPath = getWineDriveCPath;
/**
 * Check if Wine is available on Linux
 */
function isWineAvailable() {
    return isLinux() && !!getWinePrefixPath();
}
exports.isWineAvailable = isWineAvailable;
/**
 * Check if running on macOS with virtualization support
 * This is always true on macOS as we can detect Crossover/Parallels
 */
function isMacOSWithVirtualization() {
    return isMacOS();
}
exports.isMacOSWithVirtualization = isMacOSWithVirtualization;
