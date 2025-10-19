"use strict";
// TODO: Remove Bluebird import - using native Promise;
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
exports.GameNotFound = void 0;
const fs = __importStar(require("./fs"));
const promise_helpers_1 = require("./promise-helpers");
const log_1 = require("./log");
const platform_1 = require("./platform");
const storeHelper_1 = require("./storeHelper");
const macVirtualization_1 = require("./macVirtualization");
const fsOG = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const simple_vdf_1 = require("simple-vdf");
const winapi = (0, platform_1.isWindows)() ? ((0, platform_1.isWindows)() ? require('winapi-bindings') : undefined) : undefined;
const opn_1 = __importDefault(require("./opn"));
const IGameStore_1 = require("../types/IGameStore");
const getVortexPath_1 = __importDefault(require("./getVortexPath"));
const macosPaths_1 = require("./macosPaths");
// const Promise = Bluebird; // removed to avoid TS2529 (duplicate identifier 'Promise')
const STORE_ID = 'steam';
const STORE_NAME = 'Steam';
const STEAM_EXEC = (0, platform_1.isWindows)() ? 'Steam.exe' : 'steam.sh';
const STORE_PRIORITY = 40;
/// obsolete, no longer used. But it's exported through the api
class GameNotFound extends Error {
    constructor(search) {
        super('Not in Steam library');
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
        this.mSearch = search;
    }
    get search() {
        return this.mSearch;
    }
}
exports.GameNotFound = GameNotFound;
/**
 * base class to interact with local steam installation
 * @class Steam
 */
class Steam {
    constructor() {
        this.id = STORE_ID;
        this.name = STORE_NAME;
        this.priority = STORE_PRIORITY;
        if ((0, platform_1.isWindows)()) {
            // windows
            try {
                const steamPath = winapi.RegGetValue('HKEY_CURRENT_USER', 'Software\\Valve\\Steam', 'SteamPath');
                this.mBaseFolder = Promise.resolve(steamPath.value);
            }
            catch (err) {
                (0, log_1.log)('info', 'steam not found', { error: err.message });
                this.mBaseFolder = Promise.resolve(undefined);
            }
        }
        else if ((0, platform_1.isMacOS)()) {
            // macOS - Check both native and virtualized environments
            this.mBaseFolder = Promise.resolve(this.findMacOSSteamPath());
        }
        else {
            // linux and others
            this.mBaseFolder = Promise.resolve(path.resolve((0, getVortexPath_1.default)('home'), '.steam', 'steam'));
        }
    }
    /**
     * find the first game that matches the specified name pattern
     */
    findByName(namePattern) {
        const re = new RegExp('^' + namePattern + '$');
        return this.allGames()
            .then(entries => entries.find(entry => re.test(entry.name)))
            .then(entry => {
            if (entry === undefined) {
                return Promise.reject(new IGameStore_1.GameEntryNotFound(namePattern, STORE_ID));
            }
            else {
                return Promise.resolve(entry);
            }
        });
    }
    launchGame(appInfo, api) {
        // We expect appInfo to be one of three things at this point:
        //  - The game extension's details object if provided, in which case
        //      we want to extract the steamAppId entry. (preferred case as this
        //      is used by the gameinfo-steam extension as well).
        //  - The steam Id in string form.
        //  - The directory path which contains the game's executable.
        if (this.isCustomExecObject(appInfo) && (appInfo.launchType === 'gamestore')) {
            return this.getPosixPath(appInfo)
                .then(posix => (0, opn_1.default)(posix).catch(err => Promise.resolve()));
        }
        const info = (!!appInfo.steamAppId)
            ? appInfo.steamAppId.toString() : appInfo;
        return this.getExecInfo(info)
            .then(execInfo => api.runExecutable(execInfo.execPath, execInfo.arguments, {
            cwd: path.dirname(execInfo.execPath),
            suggestDeploy: true,
            shell: true,
        }));
    }
    getPosixPath(appInfo) {
        const posixCommand = `steam://launch/${appInfo.appId}/${appInfo.parameters.join()}`;
        return Promise.resolve(posixCommand);
    }
    getExecInfo(appInfo) {
        var _a;
        // Steam uses numeric values to id games internally; if the provided appId
        //  contains path separators, it's a clear indication that the game
        //  extension did not provide a steam id and the starter info object
        //  provided the game executables dirname instead.
        let appId;
        let parameters = [];
        if (this.isCustomExecObject(appInfo)) {
            appId = appInfo.appId;
            parameters = (_a = appInfo.parameters) !== null && _a !== void 0 ? _a : [];
        }
        else {
            appId = appInfo.toString();
        }
        const isDirPath = (appId.indexOf(path.sep) !== -1);
        return this.allGames()
            .then(entries => {
            const found = entries.find(entry => (!isDirPath)
                ? (entry.appid === appId)
                // Checking by gamepath is inefficient but I can't think of a different
                //  way to ascertain whether the launcher has this game entry with the
                //  provided information...
                : (appId.toLowerCase().indexOf(entry.gamePath.toLowerCase()) !== -1));
            if (found === undefined) {
                return Promise.reject(new IGameStore_1.GameEntryNotFound(appId, STORE_ID));
            }
            return this.mBaseFolder.then((basePath) => {
                const steamExec = {
                    execPath: path.join(basePath, STEAM_EXEC),
                    arguments: ['-applaunch', appId, ...parameters],
                };
                return Promise.resolve(steamExec);
            });
        });
    }
    /**
     * find the first game with the specified appid or one of the specified appids
     */
    findByAppId(appId) {
        // support searching for one app id or one out of a list (when there are multiple
        // variants of a game)
        const matcher = Array.isArray(appId)
            ? entry => appId.indexOf(entry.appid) !== -1
            : entry => entry.appid === appId;
        return this.allGames()
            .then(entries => {
            const entry = entries.find(matcher);
            if (entry === undefined) {
                return Promise.reject(new IGameStore_1.GameEntryNotFound(Array.isArray(appId) ? appId.join(', ') : appId, STORE_ID));
            }
            else {
                return Promise.resolve(entry);
            }
        });
    }
    allGames() {
        if (!this.mCache) {
            this.mCache = this.parseManifests();
        }
        return this.mCache.catch(err => {
            // If cache initialization fails, retry once after a brief delay
            // This helps with timing issues on macOS
            (0, log_1.log)('warn', 'Steam cache initialization failed, retrying', { error: err.message });
            return new Promise((resolve) => setTimeout(() => resolve(), 200)).then(() => {
                this.mCache = this.parseManifests();
                return this.mCache;
            });
        });
    }
    getGameStorePath() {
        return this.mBaseFolder.then((baseFolder) => __awaiter(this, void 0, void 0, function* () {
            if ((0, platform_1.isMacOS)()) {
                // On macOS, prefer the system Applications bundle first
                try {
                    if (yield fs.statAsync('/Applications/Steam.app')) {
                        return '/Applications/Steam.app';
                    }
                }
                catch (err) {
                    // ignore, fall back to base folder
                }
                if (baseFolder === undefined) {
                    return undefined;
                }
                return path.join(baseFolder, 'Steam.app');
            }
            // Other platforms
            if (baseFolder === undefined) {
                return undefined;
            }
            return Promise.resolve(path.join(baseFolder, STEAM_EXEC));
        }));
    }
    reloadGames() {
        this.mCache = this.parseManifests();
        return Promise.resolve();
    }
    findMacOSSteamPath() {
        return __awaiter(this, void 0, void 0, function* () {
            // First check the standard macOS Steam path (Application Support)
            const standardPath = (0, macosPaths_1.getMacOSSteamPath)();
            try {
                if (yield fs.statAsync(standardPath)) {
                    return standardPath;
                }
            }
            catch (err) {
                // Standard path not found, continue searching
            }
            // Fallback to legacy ~/.steam/steam folder
            try {
                const fallbackPath = path.resolve((0, getVortexPath_1.default)('home'), '.steam', 'steam');
                if (yield fs.statAsync(fallbackPath)) {
                    return fallbackPath;
                }
            }
            catch (err) {
                // Fallback not found, continue searching
            }
            // Check for Steam in Crossover bottles
            try {
                const crossoverPaths = yield (0, macVirtualization_1.getCrossoverPaths)();
                for (const bottlePath of crossoverPaths) {
                    // Steam is typically installed in drive_c/Program Files (x86)/Steam
                    const crossoverSteamPath = path.join(bottlePath, 'drive_c', 'Program Files (x86)', 'Steam');
                    try {
                        if (yield fs.statAsync(crossoverSteamPath)) {
                            return crossoverSteamPath;
                        }
                    }
                    catch (err) {
                        // Continue to next path
                    }
                }
            }
            catch (err) {
                (0, log_1.log)('debug', 'Failed to check Crossover Steam paths', { error: err.message });
            }
            // Check for Steam in VMware VMs
            try {
                const vmwarePaths = yield (0, macVirtualization_1.getVMwarePaths)();
                for (const vmPath of vmwarePaths) {
                    // Steam might be installed in drive_c/Program Files (x86)/Steam in VMware VMs
                    const vmwareSteamPath = path.join(vmPath, 'drive_c', 'Program Files (x86)', 'Steam');
                    try {
                        if (yield fs.statAsync(vmwareSteamPath)) {
                            return vmwareSteamPath;
                        }
                    }
                    catch (err) {
                        // Continue to next path
                    }
                }
            }
            catch (err) {
                (0, log_1.log)('debug', 'Failed to check VMware Steam paths', { error: err.message });
            }
            // Check for Steam in VirtualBox VMs
            try {
                const virtualboxPaths = yield (0, macVirtualization_1.getVirtualBoxPaths)();
                for (const vmPath of virtualboxPaths) {
                    // Steam might be installed in drive_c/Program Files (x86)/Steam in VirtualBox VMs
                    const virtualboxSteamPath = path.join(vmPath, 'drive_c', 'Program Files (x86)', 'Steam');
                    try {
                        if (yield fs.statAsync(virtualboxSteamPath)) {
                            return virtualboxSteamPath;
                        }
                    }
                    catch (err) {
                        // Continue to next path
                    }
                }
            }
            catch (err) {
                (0, log_1.log)('debug', 'Failed to check VirtualBox Steam paths', { error: err.message });
            }
            return undefined;
        });
    }
    identifyGame(gamePath, fallback) {
        const custom = gamePath.toLowerCase().split(path.sep).includes('steamapps');
        return Promise.resolve(fallback(gamePath))
            .then((fbResult) => {
            if (fbResult !== custom) {
                (0, log_1.log)('warn', '(steam) game identification inconclusive', {
                    gamePath,
                    custom,
                    fallback,
                });
            }
            return custom || fbResult;
        });
    }
    isCustomExecObject(object) {
        if (typeof (object) !== 'object') {
            return false;
        }
        return ('appId' in object);
    }
    resolveSteamPaths() {
        (0, log_1.log)('debug', 'resolving Steam game paths');
        return this.mBaseFolder.then((basePath) => {
            if (basePath === undefined) {
                // Steam not found/installed
                return Promise.resolve([]);
            }
            const steamPaths = [basePath];
            // On Windows, libraryfolders.vdf is typically under `config/`,
            // on macOS/Linux it usually resides under `steamapps/`.
            const primaryLibFile = (0, platform_1.isWindows)()
                ? path.resolve(basePath, 'config', 'libraryfolders.vdf')
                : path.resolve(basePath, 'steamapps', 'libraryfolders.vdf');
            const secondaryLibFile = (0, platform_1.isWindows)()
                ? path.resolve(basePath, 'steamapps', 'libraryfolders.vdf')
                : path.resolve(basePath, 'config', 'libraryfolders.vdf');
            return fs.readFileAsync(primaryLibFile)
                .catch(err => (err && err.code === 'ENOENT')
                ? fs.readFileAsync(secondaryLibFile)
                : Promise.reject(err))
                .then((data) => {
                if (data === undefined) {
                    return Promise.resolve(steamPaths);
                }
                let parsedObj;
                try {
                    parsedObj = (0, simple_vdf_1.parse)(data.toString());
                }
                catch (err) {
                    (0, log_1.log)('warn', 'unable to parse steamfolders.vdf', err);
                    return Promise.resolve(steamPaths);
                }
                const libObj = (0, storeHelper_1.getSafeCI)(parsedObj, ['libraryfolders'], {});
                let counter = libObj.hasOwnProperty('0') ? 0 : 1;
                while (libObj.hasOwnProperty(`${counter}`)) {
                    const libPath = libObj[`${counter}`]['path'];
                    if (libPath && !steamPaths.includes(libPath)) {
                        steamPaths.push(libObj[`${counter}`]['path']);
                    }
                    ++counter;
                }
                (0, log_1.log)('debug', 'found steam install folders', { steamPaths });
                return Promise.resolve(steamPaths);
            })
                .catch(err => {
                // A Steam update has changed the way we resolve the steam library paths
                //  (we used to get these from config.vdf) the libraryfolders.vdf file
                //  appears to at times hold a reference to _all_ library folders; other times
                //  it only holds the path to the alternate steam libraries (the ones that aren't
                //  part of the base Steam installation folder)
                (0, log_1.log)('warn', 'failed to read steam library folders file', err);
                return ['EPERM', 'ENOENT'].includes(err.code)
                    ? Promise.resolve(steamPaths)
                    : Promise.reject(err);
            });
        });
    }
    parseManifests() {
        return this.resolveSteamPaths()
            .then((steamPaths) => {
            // First, read libraryfolders.vdf to get app-to-library mapping
            return this.getAppLibraryMapping(steamPaths)
                .then((appLibraryMap) => {
                return (0, promise_helpers_1.promiseMapSeries)(steamPaths, steamPath => {
                    (0, log_1.log)('debug', 'reading steam install folder', { steamPath });
                    const steamAppsPath = path.join(steamPath, 'steamapps');
                    return Promise.resolve(fsOG.readdir(steamAppsPath))
                        .then(names => {
                        const filtered = names.filter(name => name.startsWith('appmanifest_') && (path.extname(name) === '.acf'));
                        (0, log_1.log)('debug', 'got steam manifests', { manifests: filtered });
                        return (0, promise_helpers_1.promiseMap)(filtered, (name) => fs.readFileAsync(path.join(steamAppsPath, name)).then(manifestData => ({
                            manifestData, name,
                        })));
                    })
                        .then(appsData => {
                        return appsData
                            .map(appData => {
                            const { name, manifestData } = appData;
                            try {
                                return { obj: (0, simple_vdf_1.parse)(manifestData.toString()), name };
                            }
                            catch (err) {
                                (0, log_1.log)('warn', 'failed to parse steam manifest', { name, error: err.message });
                                return undefined;
                            }
                        })
                            .map(res => {
                            if (res === undefined) {
                                return undefined;
                            }
                            const { obj, name } = res;
                            if ((obj === undefined)
                                || (obj['AppState'] === undefined)
                                || (obj['AppState']['installdir'] === undefined)) {
                                (0, log_1.log)('debug', 'invalid appmanifest', name);
                                return undefined;
                            }
                            try {
                                const appId = obj['AppState']['appid'];
                                const installDir = obj['AppState']['installdir'];
                                // Use the app-to-library mapping to find the correct library path
                                const correctLibraryPath = appLibraryMap.get(appId) || steamPath;
                                const gamePath = path.join(correctLibraryPath, 'steamapps', 'common', installDir);
                                (0, log_1.log)('debug', 'resolved game path', {
                                    appId,
                                    installDir,
                                    manifestLibrary: steamPath,
                                    correctLibrary: correctLibraryPath,
                                    gamePath
                                });
                                return {
                                    appid: appId,
                                    gameStoreId: STORE_ID,
                                    name: obj['AppState']['name'],
                                    gamePath: gamePath,
                                    lastUser: obj['AppState']['LastOwner'],
                                    lastUpdated: new Date(obj['AppState']['LastUpdated'] * 1000),
                                    manifestData: obj,
                                };
                            }
                            catch (err) {
                                (0, log_1.log)('warn', 'failed to parse steam manifest', { name, error: err.message });
                                return undefined;
                            }
                        })
                            .filter(obj => obj !== undefined);
                    })
                        .catch(err => {
                        if (err.code === 'ENOENT') {
                            // no biggy, this can happen for example if the steam library is on a removable medium
                            // which is currently removed
                            (0, log_1.log)('info', 'Steam library not found', { error: err.message });
                            return undefined;
                        }
                    })
                        .catch(err => {
                        (0, log_1.log)('warn', 'Failed to read steam library', { path: steamPath, error: err.message });
                        return []; // Return empty array instead of undefined
                    });
                });
            });
        })
            .then((games) => games.reduce((prev, current) => current !== undefined ? prev.concat(current) : prev, []))
            .then((result) => {
            (0, log_1.log)('info', 'done reading steam libraries');
            return result; // Return the result instead of void
        });
    }
    getAppLibraryMapping(steamPaths) {
        const appLibraryMap = new Map();
        // Try to read libraryfolders.vdf from the main Steam installation
        const mainSteamPath = steamPaths[0]; // First path is usually the main Steam installation
        if (!mainSteamPath) {
            return Promise.resolve(appLibraryMap);
        }
        const libFoldersFile = (0, platform_1.isWindows)()
            ? path.resolve(mainSteamPath, 'config', 'libraryfolders.vdf')
            : path.resolve(mainSteamPath, 'steamapps', 'libraryfolders.vdf');
        return fs.readFileAsync(libFoldersFile)
            .then((data) => {
            try {
                const parsedObj = (0, simple_vdf_1.parse)(data.toString());
                const libObj = (0, storeHelper_1.getSafeCI)(parsedObj, ['libraryfolders'], {});
                // Iterate through each library folder
                let counter = libObj.hasOwnProperty('0') ? 0 : 1;
                while (libObj.hasOwnProperty(`${counter}`)) {
                    const libraryEntry = libObj[`${counter}`];
                    const libraryPath = libraryEntry['path'];
                    const apps = libraryEntry['apps'] || {};
                    // Map each app ID to this library path
                    Object.keys(apps).forEach(appId => {
                        appLibraryMap.set(appId, libraryPath);
                    });
                    (0, log_1.log)('debug', 'mapped apps to library', {
                        libraryPath,
                        appCount: Object.keys(apps).length,
                        apps: Object.keys(apps)
                    });
                    ++counter;
                }
                (0, log_1.log)('debug', 'created app-to-library mapping', {
                    totalApps: appLibraryMap.size,
                    libraries: Array.from(new Set(appLibraryMap.values()))
                });
                return appLibraryMap;
            }
            catch (err) {
                (0, log_1.log)('warn', 'failed to parse libraryfolders.vdf for app mapping', err);
                return appLibraryMap;
            }
        })
            .catch(err => {
            (0, log_1.log)('warn', 'failed to read libraryfolders.vdf for app mapping', err);
            return appLibraryMap;
        });
    }
}
const instance = new Steam();
exports.default = instance;
