"use strict";
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
// TODO: Remove Bluebird import - using native Promise;
const log_1 = require("./log");
const bluebird_migration_helpers_local_1 = require("./bluebird-migration-helpers.local");
const platform_1 = require("./platform");
const path = __importStar(require("path"));
const winapiT = (0, platform_1.isWindows)() ? ((0, platform_1.isWindows)() ? require('winapi-bindings') : undefined) : undefined;
const fs = __importStar(require("./fs"));
const getVortexPath_1 = __importDefault(require("./getVortexPath"));
const opn_1 = __importDefault(require("./opn"));
const api_1 = require("../types/api");
const macVirtualization_1 = require("./macVirtualization");
// Use direct conditional require to avoid lazy loader issues in tests
const winapi = (0, platform_1.isWindows)() ? require('winapi-bindings') : undefined;
const ITEM_EXT = '.item';
const STORE_ID = 'epic';
const STORE_NAME = 'Epic Games Launcher';
const STORE_PRIORITY = 60;
/**
 * Epic Store launcher seems to be holding game information inside
 *  .item manifest files which are stored inside the launchers Data folder
 *  "(C:\\ProgramData\\Epic\\EpicGamesLauncher\\Data\\Manifests" by default
 */
class EpicGamesLauncher {
    constructor() {
        this.id = STORE_ID;
        this.name = STORE_NAME;
        this.priority = STORE_PRIORITY;
        this.mDataPath = this.getEpicDataPath();
    }
    getEpicDataPath() {
        if ((0, platform_1.isWindows)()) {
            try {
                // We find the launcher's dataPath
                const epicDataPath = winapi.RegGetValue('HKEY_LOCAL_MACHINE', 'SOFTWARE\\WOW6432Node\\Epic Games\\EpicGamesLauncher', 'AppDataPath');
                return Promise.resolve(epicDataPath.value);
            }
            catch (err) {
                (0, log_1.log)('info', 'Epic games launcher not found', { error: err.message });
                return Promise.resolve(undefined);
            }
        }
        else if ((0, platform_1.isMacOS)()) {
            // macOS: Epic Games Launcher stores data in ~/Library/Application Support/Epic
            const epicDataPath = path.join((0, getVortexPath_1.default)('home'), 'Library', 'Application Support', 'Epic');
            return fs.statAsync(epicDataPath)
                .then(() => epicDataPath)
                .catch(() => this.findMacOSEpicDataPath())
                .catch(() => {
                (0, log_1.log)('info', 'Epic games launcher not found on macOS');
                return undefined;
            });
        }
        else {
            // Linux: Epic Games Launcher is not officially supported, but we can check for Heroic Games Launcher
            // Heroic stores Epic games data in ~/.config/heroic
            const heroicDataPath = path.join((0, getVortexPath_1.default)('home'), '.config', 'heroic');
            return fs.statAsync(heroicDataPath)
                .then(() => heroicDataPath)
                .catch(() => {
                (0, log_1.log)('info', 'Epic games launcher (via Heroic) not found on Linux');
                return undefined;
            });
        }
    }
    launchGame(appInfo, api) {
        const appId = ((typeof (appInfo) === 'object') && ('appId' in appInfo))
            ? appInfo.appId : appInfo.toString();
        return this.getPosixPath(appId)
            .then(posPath => (0, opn_1.default)(posPath).catch(err => Promise.resolve()));
    }
    launchGameStore(api, parameters) {
        const launchCommand = 'com.epicgames.launcher://start';
        return (0, opn_1.default)(launchCommand).catch(err => Promise.resolve());
    }
    getPosixPath(name) {
        const posixPath = `com.epicgames.launcher://apps/${name}?action=launch&silent=true`;
        return Promise.resolve(posixPath);
    }
    queryPath() {
        return this.mDataPath.then(dataPath => path.join(dataPath, this.executable()));
    }
    /**
     * test if a game is installed through the launcher.
     * Please keep in mind that epic seems to internally give third-party games animal names. Kinky.
     * @param name
     */
    isGameInstalled(name) {
        return this.findByAppId(name)
            .catch(() => this.findByName(name))
            .then(() => Promise.resolve(true))
            .catch(() => Promise.resolve(false));
    }
    findByAppId(appId) {
        const matcher = Array.isArray(appId)
            ? (entry) => (appId.includes(entry.appid))
            : (entry) => (appId === entry.appid);
        return this.allGames()
            .then(entries => entries.find(matcher))
            .then(entry => (entry === undefined)
            ? Promise.reject(new api_1.GameEntryNotFound(Array.isArray(appId) ? appId.join(', ') : appId, STORE_ID))
            : Promise.resolve(entry));
    }
    /**
     * Try to find the epic entry object using Epic's internal naming convention.
     *  e.g. "Flour" === "Untitled Goose Game" lol
     * @param name
     */
    findByName(name) {
        const re = new RegExp('^' + name + '$');
        return this.allGames()
            .then(entries => entries.find(entry => re.test(entry.name)))
            .then(entry => (entry === undefined)
            ? Promise.reject(new api_1.GameEntryNotFound(name, STORE_ID))
            : Promise.resolve(entry));
    }
    allGames() {
        if (!this.mCache) {
            // Find the manifest path and then parse manifests
            return this.getGameStorePath().then(storePath => {
                if (storePath) {
                    // On Windows, manifests are in the Manifests subdirectory
                    // On macOS/Linux, manifests are in the Epic Games Launcher data directory
                    const manifestPath = (0, platform_1.isWindows)()
                        ? path.join(path.dirname(storePath), 'Manifests')
                        : path.join(storePath, 'Manifests');
                    this.mCache = this.parseManifests();
                }
                else {
                    this.mCache = Promise.resolve([]);
                }
                return this.mCache;
            });
        }
        return this.mCache;
    }
    findMacOSEpicDataPath() {
        return __awaiter(this, void 0, void 0, function* () {
            // First check the standard macOS Epic path
            const standardPath = path.join((0, getVortexPath_1.default)('home'), 'Library', 'Application Support', 'Epic');
            try {
                if (yield fs.statAsync(standardPath)) {
                    return standardPath;
                }
            }
            catch (err) {
                // Standard path not found, continue searching
            }
            // Check for Epic Games Launcher in Crossover bottles
            try {
                const crossoverPaths = yield (0, macVirtualization_1.getCrossoverPaths)();
                for (const bottlePath of crossoverPaths) {
                    // Epic Games Launcher is typically installed in drive_c/Program Files (x86)/Epic Games/Launcher
                    const crossoverEpicPath = path.join(bottlePath, 'drive_c', 'Program Files (x86)', 'Epic Games', 'Launcher');
                    try {
                        if (yield fs.statAsync(crossoverEpicPath)) {
                            // The data path would be in the Public folder within the bottle
                            return path.join(bottlePath, 'users', 'Public', 'Epic Games');
                        }
                    }
                    catch (err) {
                        // Continue to next path
                    }
                }
            }
            catch (err) {
                (0, log_1.log)('debug', 'Failed to check Crossover Epic paths', { error: err.message });
            }
            // Check for Epic Games Launcher in VMware VMs
            try {
                const vmwarePaths = yield (0, macVirtualization_1.getVMwarePaths)();
                for (const vmPath of vmwarePaths) {
                    // Epic Games Launcher might be installed in drive_c/Program Files (x86)/Epic Games/Launcher in VMware VMs
                    const vmwareEpicPath = path.join(vmPath, 'drive_c', 'Program Files (x86)', 'Epic Games', 'Launcher');
                    try {
                        if (yield fs.statAsync(vmwareEpicPath)) {
                            // The data path would be in the Public folder within the VM
                            return path.join(vmPath, 'users', 'Public', 'Epic Games');
                        }
                    }
                    catch (err) {
                        // Continue to next path
                    }
                }
            }
            catch (err) {
                (0, log_1.log)('debug', 'Failed to check VMware Epic paths', { error: err.message });
            }
            // Check for Epic Games Launcher in VirtualBox VMs
            try {
                const virtualboxPaths = yield (0, macVirtualization_1.getVirtualBoxPaths)();
                for (const vmPath of virtualboxPaths) {
                    // Epic Games Launcher might be installed in drive_c/Program Files (x86)/Epic Games/Launcher in VirtualBox VMs
                    const virtualboxEpicPath = path.join(vmPath, 'drive_c', 'Program Files (x86)', 'Epic Games', 'Launcher');
                    try {
                        if (yield fs.statAsync(virtualboxEpicPath)) {
                            // The data path would be in the Public folder within the VM
                            return path.join(vmPath, 'users', 'Public', 'Epic Games');
                        }
                    }
                    catch (err) {
                        // Continue to next path
                    }
                }
            }
            catch (err) {
                (0, log_1.log)('debug', 'Failed to check VirtualBox Epic paths', { error: err.message });
            }
            // Return undefined if Epic Games Launcher is not found
            return undefined;
        });
    }
    getDataPath() {
        if ((0, platform_1.isWindows)()) {
            // On Windows, the data path is typically in %LOCALAPPDATA%\EpicGamesLauncher\Data
            return Promise.resolve(path.join((0, getVortexPath_1.default)('localAppData'), 'EpicGamesLauncher', 'Data'));
        }
        else if ((0, platform_1.isMacOS)()) {
            // On macOS, the data path is in ~/Library/Application Support/Epic
            return this.findMacOSEpicDataPath();
        }
        else {
            // On Linux, check for Heroic data path
            const heroicPath = path.join((0, getVortexPath_1.default)('home'), '.config', 'heroic');
            return fs.statAsync(heroicPath)
                .then(() => heroicPath)
                .catch(() => {
                // Try flatpak path
                const flatpakPath = path.join((0, getVortexPath_1.default)('home'), '.var', 'app', 'com.heroicgameslauncher.hgl', 'config', 'heroic');
                return fs.statAsync(flatpakPath)
                    .then(() => flatpakPath)
                    .catch(() => undefined);
            });
        }
    }
    reloadGames() {
        this.mCache = this.parseManifests();
        return Promise.resolve(undefined);
    }
    parseManifests() {
        return this.getDataPath().then(dataPath => {
            if (!dataPath) {
                return Promise.resolve([]);
            }
            // Manifests are in the Manifests subdirectory
            const manifestsPath = path.join(dataPath, 'Manifests');
            return fs.readdirAsync(manifestsPath)
                .then(files => {
                // Filter for .item files which are the manifest files
                const manifestFiles = files.filter(file => path.extname(file) === '.item');
                // Parse each manifest file
                return (0, bluebird_migration_helpers_local_1.promiseMap)(manifestFiles, file => {
                    const manifestPath = path.join(manifestsPath, file);
                    return fs.readFileAsync(manifestPath, { encoding: 'utf8' })
                        .then(data => {
                        const manifest = JSON.parse(data);
                        if ((manifest.MainGameAppName !== undefined) && (manifest.AppName !== manifest.MainGameAppName)) {
                            // this is a DLC, not a game
                            return Promise.resolve(undefined);
                        }
                        if ((manifest.LaunchExecutable === undefined) || (manifest.InstallLocation === undefined)) {
                            return Promise.resolve(undefined);
                        }
                        const launchExecutable = manifest.LaunchExecutable.split(path.sep).join(path.posix.sep);
                        const executables = [launchExecutable];
                        if (manifest.OwnedAppNames !== undefined) {
                            // This is a "core" game, and we're looking at the "base" manifest.
                            //  The "OwnedAppNames" attribute contains the name of the actual
                            //  game manifest which we're going to need to resolve the executable
                            //  path.
                            const split = manifest.OwnedAppNames.split('/');
                            const ownedAppName = split[split.length - 1];
                            const ownedManifestPath = path.join(manifestsPath, `${ownedAppName}.item`);
                            return fs.readFileAsync(ownedManifestPath, { encoding: 'utf8' })
                                .then(ownedData => {
                                var _a;
                                const ownedManifest = JSON.parse(ownedData);
                                const ownedExec = (_a = ownedManifest.LaunchExecutable) === null || _a === void 0 ? void 0 : _a.split(path.sep).join(path.posix.sep);
                                if (!!ownedExec && (executables.indexOf(ownedExec) === -1)) {
                                    executables.push(ownedExec);
                                }
                                return Promise.resolve({
                                    appid: manifest.AppName,
                                    name: manifest.DisplayName,
                                    gamePath: manifest.InstallLocation,
                                    gameStoreId: STORE_ID,
                                    parameters: [{
                                            appName: manifest.AppName,
                                            user: manifest.InstalledBy,
                                            executables,
                                        }],
                                });
                            })
                                .catch(err => {
                                (0, log_1.log)('error', 'Cannot read Epic Games manifest', err);
                                return Promise.resolve(undefined);
                            });
                        }
                        else {
                            return Promise.resolve({
                                appid: manifest.AppName,
                                name: manifest.DisplayName,
                                gamePath: manifest.InstallLocation,
                                gameStoreId: STORE_ID,
                                parameters: [{
                                        appName: manifest.AppName,
                                        user: manifest.InstalledBy,
                                        executables,
                                    }],
                            });
                        }
                    })
                        .catch(err => {
                        (0, log_1.log)('error', 'Failed to parse Epic Games manifest', { file, error: err.message });
                        return Promise.resolve(undefined);
                    });
                });
            })
                .then(results => results.filter(result => result !== undefined))
                .catch(err => {
                (0, log_1.log)('error', 'Failed to read Epic Games manifests directory', err);
                return Promise.resolve([]);
            });
        });
    }
    getGameStorePath() {
        const getExecPath = () => {
            if ((0, platform_1.isWindows)()) {
                try {
                    const epicLauncher = winapi.RegGetValue('HKEY_LOCAL_MACHINE', 'SOFTWARE\\Classes\\com.epicgames.launcher\\DefaultIcon', '(Default)');
                    const val = epicLauncher.value;
                    this.mLauncherExecPath = val.toString().split(',')[0];
                    return Promise.resolve(this.mLauncherExecPath);
                }
                catch (err) {
                    (0, log_1.log)('info', 'Epic games launcher not found', { error: err.message });
                    return Promise.resolve(undefined);
                }
            }
            else if ((0, platform_1.isMacOS)()) {
                // macOS: Epic Games Launcher is typically in /Applications
                const epicAppPath = '/Applications/Epic Games Launcher.app';
                return fs.statAsync(epicAppPath)
                    .then(() => {
                    this.mLauncherExecPath = epicAppPath;
                    return epicAppPath;
                })
                    .catch(() => __awaiter(this, void 0, void 0, function* () {
                    // On macOS, also check Crossover and then VMware/VirtualBox
                    try {
                        const crossoverPaths = yield (0, macVirtualization_1.getCrossoverPaths)();
                        for (const bottlePath of crossoverPaths) {
                            const crossoverEpicPath = path.join(bottlePath, 'drive_c', 'Program Files (x86)', 'Epic Games', 'Launcher');
                            try {
                                if (yield fs.statAsync(crossoverEpicPath)) {
                                    this.mLauncherExecPath = crossoverEpicPath;
                                    return crossoverEpicPath;
                                }
                            }
                            catch (err) {
                                // Continue checking other paths
                            }
                        }
                    }
                    catch (err) {
                        // No Crossover paths found
                    }
                    // Check VMware paths
                    try {
                        const vmwarePaths = yield (0, macVirtualization_1.getVMwarePaths)();
                        for (const vmPath of vmwarePaths) {
                            const vmEpicPath = path.join(vmPath, 'Program Files (x86)', 'Epic Games', 'Launcher');
                            try {
                                if (yield fs.statAsync(vmEpicPath)) {
                                    this.mLauncherExecPath = vmEpicPath;
                                    return vmEpicPath;
                                }
                            }
                            catch (err) {
                                // Continue checking other paths
                            }
                        }
                    }
                    catch (err) {
                        // No VMware paths found
                    }
                    // Check VirtualBox paths
                    try {
                        const vboxPaths = yield (0, macVirtualization_1.getVirtualBoxPaths)();
                        for (const vboxPath of vboxPaths) {
                            const vboxEpicPath = path.join(vboxPath, 'Program Files (x86)', 'Epic Games', 'Launcher');
                            try {
                                if (yield fs.statAsync(vboxEpicPath)) {
                                    this.mLauncherExecPath = vboxEpicPath;
                                    return vboxEpicPath;
                                }
                            }
                            catch (err) {
                                // Continue checking other paths
                            }
                        }
                    }
                    catch (err) {
                        // No VirtualBox paths found
                    }
                    // If not found in virtualization paths, return undefined
                    return undefined;
                }));
            }
            else {
                // Linux: Try Heroic Games Launcher
                const heroicPath = '/usr/bin/heroic';
                return fs.statAsync(heroicPath)
                    .then(() => {
                    this.mLauncherExecPath = heroicPath;
                    return heroicPath;
                })
                    .catch(() => {
                    // Try flatpak installation
                    const flatpakPath = '/var/lib/flatpak/exports/bin/com.heroicgameslauncher.hgl';
                    return fs.statAsync(flatpakPath)
                        .then(() => {
                        this.mLauncherExecPath = flatpakPath;
                        return flatpakPath;
                    })
                        .catch(() => {
                        (0, log_1.log)('info', 'Heroic games launcher not found');
                        return undefined;
                    });
                });
            }
        };
        return (!!this.mLauncherExecPath)
            ? Promise.resolve(this.mLauncherExecPath)
            : getExecPath();
    }
    executable() {
        if ((0, platform_1.isWindows)()) {
            return 'EpicGamesLauncher.exe';
        }
        else if ((0, platform_1.isMacOS)()) {
            return 'Epic Games Launcher.app';
        }
        else {
            // Linux: Use Heroic Games Launcher as alternative
            return 'heroic';
        }
    }
}
const instance = new EpicGamesLauncher();
exports.default = instance;
