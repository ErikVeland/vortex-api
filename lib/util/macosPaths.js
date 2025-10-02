"use strict";
/**
 * macOS-specific path utilities
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupMacOSPaths = exports.getMacOSUbisoftPath = exports.getMacOSEpicPath = exports.getMacOSOriginPath = exports.getMacOSGOGPath = exports.getMacOSSteamPath = exports.getMacOSApplicationPath = exports.getMacOSLogsPath = exports.getMacOSPreferencesPath = exports.getMacOSCachesPath = exports.getMacOSAppSupportPath = void 0;
const path = __importStar(require("path"));
const getVortexPath_1 = __importDefault(require("./getVortexPath"));
/**
 * Get macOS-specific application support directory
 * ~/Library/Application Support/Vortex
 */
function getMacOSAppSupportPath() {
    const homeDir = (0, getVortexPath_1.default)('home');
    if (!homeDir) {
        return '';
    }
    return path.join(homeDir, 'Library', 'Application Support', 'Vortex');
}
exports.getMacOSAppSupportPath = getMacOSAppSupportPath;
/**
 * Get macOS-specific caches directory
 * ~/Library/Caches/Vortex
 */
function getMacOSCachesPath() {
    const homeDir = (0, getVortexPath_1.default)('home');
    if (!homeDir) {
        return '';
    }
    return path.join(homeDir, 'Library', 'Caches', 'Vortex');
}
exports.getMacOSCachesPath = getMacOSCachesPath;
/**
 * Get macOS-specific preferences directory
 * ~/Library/Preferences/Vortex
 */
function getMacOSPreferencesPath() {
    const homeDir = (0, getVortexPath_1.default)('home');
    if (!homeDir) {
        return '';
    }
    return path.join(homeDir, 'Library', 'Preferences', 'Vortex');
}
exports.getMacOSPreferencesPath = getMacOSPreferencesPath;
/**
 * Get macOS-specific logs directory
 * ~/Library/Logs/Vortex
 */
function getMacOSLogsPath() {
    const homeDir = (0, getVortexPath_1.default)('home');
    if (!homeDir) {
        return '';
    }
    return path.join(homeDir, 'Library', 'Logs', 'Vortex');
}
exports.getMacOSLogsPath = getMacOSLogsPath;
/**
 * Get macOS-specific application directory
 * /Applications/Vortex.app
 */
function getMacOSApplicationPath() {
    return '/Applications/Vortex.app';
}
exports.getMacOSApplicationPath = getMacOSApplicationPath;
/**
 * Get macOS-specific Steam directory
 * ~/Library/Application Support/Steam
 */
function getMacOSSteamPath() {
    const homeDir = (0, getVortexPath_1.default)('home');
    if (!homeDir) {
        return '';
    }
    return path.join(homeDir, 'Library', 'Application Support', 'Steam');
}
exports.getMacOSSteamPath = getMacOSSteamPath;
/**
 * Get macOS-specific GOG Galaxy directory
 * ~/Library/Application Support/GOG.com/Galaxy
 */
function getMacOSGOGPath() {
    const homeDir = (0, getVortexPath_1.default)('home');
    if (!homeDir) {
        return '';
    }
    return path.join(homeDir, 'Library', 'Application Support', 'GOG.com', 'Galaxy');
}
exports.getMacOSGOGPath = getMacOSGOGPath;
/**
 * Get macOS-specific Origin directory
 * ~/Library/Application Support/Origin
 */
function getMacOSOriginPath() {
    const homeDir = (0, getVortexPath_1.default)('home');
    if (!homeDir) {
        return '';
    }
    return path.join(homeDir, 'Library', 'Application Support', 'Origin');
}
exports.getMacOSOriginPath = getMacOSOriginPath;
/**
 * Get macOS-specific Epic Games directory
 * ~/Library/Application Support/Epic
 */
function getMacOSEpicPath() {
    const homeDir = (0, getVortexPath_1.default)('home');
    if (!homeDir) {
        return '';
    }
    return path.join(homeDir, 'Library', 'Application Support', 'Epic');
}
exports.getMacOSEpicPath = getMacOSEpicPath;
/**
 * Get macOS-specific Ubisoft Connect directory
 * ~/Library/Application Support/Ubisoft/Ubisoft Game Launcher
 */
function getMacOSUbisoftPath() {
    const homeDir = (0, getVortexPath_1.default)('home');
    if (!homeDir) {
        return '';
    }
    return path.join(homeDir, 'Library', 'Application Support', 'Ubisoft', 'Ubisoft Game Launcher');
}
exports.getMacOSUbisoftPath = getMacOSUbisoftPath;
/**
 * Override Vortex paths for macOS
 */
function setupMacOSPaths() {
    // Override userData path to use ~/Library/Application Support/Vortex
    const appSupportPath = getMacOSAppSupportPath();
    if (appSupportPath) {
        // Set userData to ~/Library/Application Support/Vortex
        process.env.VORTEX_USER_DATA = appSupportPath;
    }
    // Override temp path to use ~/Library/Caches/Vortex
    const cachesPath = getMacOSCachesPath();
    if (cachesPath) {
        // Set temp to ~/Library/Caches/Vortex
        process.env.VORTEX_TEMP = path.join(cachesPath, 'temp');
    }
}
exports.setupMacOSPaths = setupMacOSPaths;
