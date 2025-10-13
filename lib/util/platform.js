"use strict";
/**
 * Platform detection utilities for consistent cross-platform behavior
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentPlatform = getCurrentPlatform;
exports.isWindows = isWindows;
exports.isMacOS = isMacOS;
exports.isLinux = isLinux;
exports.isUnix = isUnix;
exports.getExecutableExtension = getExecutableExtension;
exports.getPathSeparator = getPathSeparator;
exports.getLineEnding = getLineEnding;
exports.platformSwitch = platformSwitch;
exports.getAppDataPath = getAppDataPath;
exports.getHomeDirectory = getHomeDirectory;
exports.getDocumentsPath = getDocumentsPath;
exports.isPathCaseSensitive = isPathCaseSensitive;
exports.normalizePath = normalizePath;
exports.getWinePrefixPath = getWinePrefixPath;
exports.getWineDriveCPath = getWineDriveCPath;
exports.isWineAvailable = isWineAvailable;
exports.isMacOSWithVirtualization = isMacOSWithVirtualization;
/**
 * Get the current platform
 */
function getCurrentPlatform() {
    return process.platform;
}
/**
 * Check if running on Windows
 */
function isWindows() {
    return process.platform === 'win32';
}
/**
 * Check if running on macOS
 */
function isMacOS() {
    return process.platform === 'darwin';
}
/**
 * Check if running on Linux
 */
function isLinux() {
    return process.platform === 'linux';
}
/**
 * Check if running on a Unix-like system (macOS or Linux)
 */
function isUnix() {
    return isMacOS() || isLinux();
}
/**
 * Get platform-specific executable extension
 */
function getExecutableExtension() {
    return isWindows() ? '.exe' : '';
}
/**
 * Get platform-specific path separator
 */
function getPathSeparator() {
    return isWindows() ? '\\' : '/';
}
/**
 * Get platform-specific line ending
 */
function getLineEnding() {
    return isWindows() ? '\r\n' : '\n';
}
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
/**
 * Get platform-specific user home directory
 */
function getHomeDirectory() {
    return process.env.HOME || process.env.USERPROFILE || '';
}
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
/**
 * Check if a path is case-sensitive on the current platform
 */
function isPathCaseSensitive() {
    return !isWindows();
}
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
/**
 * Check if Wine is available on Linux
 */
function isWineAvailable() {
    return isLinux() && !!getWinePrefixPath();
}
/**
 * Check if running on macOS with virtualization support
 * This is always true on macOS as we can detect Crossover/Parallels
 */
function isMacOSWithVirtualization() {
    return isMacOS();
}
