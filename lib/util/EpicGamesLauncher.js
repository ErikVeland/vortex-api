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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const bluebird_1 = __importDefault(require("bluebird"));
const log_1 = require("./log");
const platform_1 = require("./platform");
const path = __importStar(require("path"));
const winapiT = (0, platform_1.isWindows)() ? ((0, platform_1.isWindows)() ? require('winapi-bindings') : undefined) : undefined;
const fs = __importStar(require("./fs"));
const storeHelper_1 = require("./storeHelper");
const getVortexPath_1 = __importDefault(require("./getVortexPath"));
const opn_1 = __importDefault(require("./opn"));
const api_1 = require("../types/api");
const lazyRequire_1 = __importDefault(require("./lazyRequire"));
const macVirtualization_1 = require("./macVirtualization");
// Removed Bluebird alias to avoid TS2529 error with top-level Promise in async modules
const winapi = (0, lazyRequire_1.default)(() => ((0, platform_1.isWindows)() ? require('winapi-bindings') : undefined));
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
                return bluebird_1.default.resolve(epicDataPath.value);
            }
            catch (err) {
                (0, log_1.log)('info', 'Epic games launcher not found', { error: err.message });
                return bluebird_1.default.resolve(undefined);
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
            .then(posPath => (0, opn_1.default)(posPath).catch(err => bluebird_1.default.resolve()));
    }
    launchGameStore(api, parameters) {
        const launchCommand = 'com.epicgames.launcher://start';
        return (0, opn_1.default)(launchCommand).catch(err => bluebird_1.default.resolve());
    }
    getPosixPath(name) {
        const posixPath = `com.epicgames.launcher://apps/${name}?action=launch&silent=true`;
        return bluebird_1.default.resolve(posixPath);
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
            .then(() => bluebird_1.default.resolve(true))
            .catch(() => bluebird_1.default.resolve(false));
    }
    findByAppId(appId) {
        const matcher = Array.isArray(appId)
            ? (entry) => (appId.includes(entry.appid))
            : (entry) => (appId === entry.appid);
        return this.allGames()
            .then(entries => entries.find(matcher))
            .then(entry => (entry === undefined)
            ? bluebird_1.default.reject(new api_1.GameEntryNotFound(Array.isArray(appId) ? appId.join(', ') : appId, STORE_ID))
            : bluebird_1.default.resolve(entry));
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
            ? bluebird_1.default.reject(new api_1.GameEntryNotFound(name, STORE_ID))
            : bluebird_1.default.resolve(entry));
    }
    allGames() {
        if (!this.mCache) {
            this.mCache = this.parseManifests();
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
    reloadGames() {
        this.mCache = this.parseManifests();
        return bluebird_1.default.resolve();
    }
    getGameStorePath() {
        const getExecPath = () => {
            if ((0, platform_1.isWindows)()) {
                try {
                    const epicLauncher = winapi.RegGetValue('HKEY_LOCAL_MACHINE', 'SOFTWARE\\Classes\\com.epicgames.launcher\\DefaultIcon', '(Default)');
                    const val = epicLauncher.value;
                    this.mLauncherExecPath = val.toString().split(',')[0];
                    return bluebird_1.default.resolve(this.mLauncherExecPath);
                }
                catch (err) {
                    (0, log_1.log)('info', 'Epic games launcher not found', { error: err.message });
                    return bluebird_1.default.resolve(undefined);
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
            ? bluebird_1.default.resolve(this.mLauncherExecPath)
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
    parseManifests() {
        let manifestsLocation;
        return this.mDataPath
            .then(dataPath => {
            if (dataPath === undefined) {
                return bluebird_1.default.resolve([]);
            }
            if ((0, platform_1.isLinux)()) {
                // For Heroic Games Launcher on Linux, check for Epic games in the gog_store/installed.json
                manifestsLocation = path.join(dataPath, 'store_cache', 'legendary_library.json');
                return this.parseHeroicManifests(manifestsLocation);
            }
            else {
                // Windows and macOS use the standard Epic manifests
                manifestsLocation = path.join(dataPath, 'Manifests');
                return fs.readdirAsync(manifestsLocation);
            }
        })
            .catch({ code: 'ENOENT' }, err => {
            (0, log_1.log)('info', 'Epic launcher manifests could not be found', err.code);
            return bluebird_1.default.resolve([]);
        })
            .then(entries => {
            if ((0, platform_1.isLinux)()) {
                // Already parsed in parseHeroicManifests
                return entries;
            }
            const manifests = entries.filter(entry => entry.endsWith(ITEM_EXT));
            return bluebird_1.default.map(manifests, manifest => fs.readFileAsync(path.join(manifestsLocation, manifest), { encoding: 'utf8' })
                .then(data => {
                try {
                    const parsed = JSON.parse(data);
                    const gameStoreId = STORE_ID;
                    const gameExec = (0, storeHelper_1.getSafe)(parsed, ['LaunchExecutable'], undefined);
                    const gamePath = (0, storeHelper_1.getSafe)(parsed, ['InstallLocation'], undefined);
                    const name = (0, storeHelper_1.getSafe)(parsed, ['DisplayName'], undefined);
                    const appid = (0, storeHelper_1.getSafe)(parsed, ['AppName'], undefined);
                    return (!!gamePath && !!name && !!appid && !!gameExec)
                        ? fs.statSilentAsync(path.join(gamePath, gameExec))
                            .then(() => bluebird_1.default.resolve({ appid, name, gamePath, gameStoreId }))
                            .catch(() => bluebird_1.default.resolve(undefined))
                        : bluebird_1.default.resolve(undefined);
                }
                catch (err) {
                    (0, log_1.log)('error', 'Cannot parse Epic Games manifest', err);
                    return bluebird_1.default.resolve(undefined);
                }
            })
                .catch(err => {
                (0, log_1.log)('error', 'Cannot read Epic Games manifest', err);
                return bluebird_1.default.resolve(undefined);
            }));
        })
            .then((games) => games.filter(game => game !== undefined))
            .catch(err => {
            (0, log_1.log)('error', 'Failed to parse Epic Games manifests', err);
            return bluebird_1.default.resolve([]);
        });
    }
    parseHeroicManifests(manifestPath) {
        return fs.readFileAsync(manifestPath, { encoding: 'utf8' })
            .then(data => {
            try {
                const parsed = JSON.parse(data);
                const games = [];
                // Heroic stores Epic games in a different format
                if (Array.isArray(parsed)) {
                    for (const game of parsed) {
                        if (game.app_name && game.title && game.install_path) {
                            games.push({
                                appid: game.app_name,
                                name: game.title,
                                gamePath: game.install_path,
                                gameStoreId: STORE_ID
                            });
                        }
                    }
                }
                return Promise.resolve(games);
            }
            catch (err) {
                (0, log_1.log)('error', 'Cannot parse Heroic Games manifest', err);
                return Promise.resolve([]);
            }
        })
            .catch(err => {
            (0, log_1.log)('info', 'Heroic Games manifest not found', err);
            return Promise.resolve([]);
        });
    }
}
const instance = new EpicGamesLauncher();
exports.default = instance;
