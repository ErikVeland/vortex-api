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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMacOSAppSupportPath = getMacOSAppSupportPath;
exports.getMacOSCachesPath = getMacOSCachesPath;
exports.getMacOSPreferencesPath = getMacOSPreferencesPath;
exports.getMacOSLogsPath = getMacOSLogsPath;
exports.getMacOSApplicationPath = getMacOSApplicationPath;
exports.getMacOSSteamPath = getMacOSSteamPath;
exports.getMacOSGOGPath = getMacOSGOGPath;
exports.getMacOSOriginPath = getMacOSOriginPath;
exports.getMacOSEpicPath = getMacOSEpicPath;
exports.getMacOSUbisoftPath = getMacOSUbisoftPath;
exports.setupMacOSPaths = setupMacOSPaths;
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
/**
 * Get macOS-specific application directory
 * /Applications/Vortex.app
 */
function getMacOSApplicationPath() {
    return '/Applications/Vortex.app';
}
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
