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
exports.quickDiscoveryTools = quickDiscoveryTools;
exports.quickDiscovery = quickDiscovery;
exports.assertToolDir = assertToolDir;
exports.discoverRelativeTools = discoverRelativeTools;
exports.searchDiscovery = searchDiscovery;
exports.suggestStagingPath = suggestStagingPath;
const IGameStore_1 = require("../../../types/IGameStore");
const CustomErrors_1 = require("../../../util/CustomErrors");
const exeIcon_1 = __importDefault(require("../../../util/exeIcon"));
const fs = __importStar(require("../../../util/fs"));
const GameStoreHelper_1 = __importDefault(require("../../../util/GameStoreHelper"));
const getNormalizeFunc_1 = __importDefault(require("../../../util/getNormalizeFunc"));
const getVortexPath_1 = __importDefault(require("../../../util/getVortexPath"));
const log_1 = require("../../../util/log");
const platform_1 = require("../../../util/platform");
const StarterInfo_1 = __importDefault(require("../../../util/StarterInfo"));
const storeHelper_1 = require("../../../util/storeHelper");
const util_1 = require("../../../util/util");
const selectors_1 = require("../../mod_management/selectors");
const Progress_1 = __importDefault(require("./Progress"));
// TODO: Remove Bluebird import - using native Promise;
const fsExtra = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const turbowalk_1 = __importDefault(require("turbowalk"));
const macOSGameDiscovery_1 = require("../../../util/macOSGameDiscovery");
const macOSGameCompatibility_1 = require("../../../util/macOSGameCompatibility");
const platform_2 = require("../../../util/platform");
const winapi = (0, platform_1.isWindows)() ? ((0, platform_1.isWindows)() ? require('winapi-bindings') : undefined) : undefined;
function quickDiscoveryTools(gameId, tools, onDiscoveredTool) {
    if (tools === undefined) {
        return Promise.resolve();
    }
    return Promise.all(tools.map(tool => {
        if (tool.queryPath === undefined) {
            return Promise.resolve();
        }
        try {
            const toolPath = tool.queryPath();
            if (typeof (toolPath) === 'string') {
                if (toolPath) {
                    return autoGenIcon(tool, toolPath, gameId)
                        .then(() => {
                        onDiscoveredTool(gameId, Object.assign(Object.assign({}, tool), { path: path.join(toolPath, tool.executable(toolPath)), hidden: false, parameters: tool.parameters || [], custom: false }));
                    });
                }
                else {
                    (0, log_1.log)('debug', 'tool not found', tool.id);
                    return Promise.resolve();
                }
            }
            else {
                return toolPath
                    .then((resolvedPath) => {
                    if (resolvedPath) {
                        return autoGenIcon(tool, resolvedPath, gameId)
                            .then(() => {
                            onDiscoveredTool(gameId, Object.assign(Object.assign({}, tool), { path: path.join(resolvedPath, tool.executable(resolvedPath)), hidden: false, parameters: tool.parameters || [], custom: false }));
                        });
                    }
                    return Promise.resolve();
                })
                    .catch((err) => {
                    (0, log_1.log)('debug', 'tool not found', { id: tool.id, err: err.message });
                });
            }
        }
        catch (err) {
            (0, log_1.log)('error', 'failed to determine tool setup', err);
            return Promise.resolve();
        }
    }))
        .then(() => null);
}
function updateManuallyConfigured(discoveredGames, game, onDiscoveredGame) {
    var _a, _b, _c, _d, _e;
    if ((((_a = discoveredGames[game.id]) === null || _a === void 0 ? void 0 : _a.path) !== undefined)
        && (((_b = discoveredGames[game.id]) === null || _b === void 0 ? void 0 : _b.store) === undefined)) {
        return GameStoreHelper_1.default.identifyStore((_c = discoveredGames[game.id]) === null || _c === void 0 ? void 0 : _c.path)
            .then(store => {
            if (store !== undefined) {
                (0, log_1.log)('debug', 'updating previously discovered game', {
                    gameId: game.id,
                    store,
                });
                onDiscoveredGame(game.id, Object.assign(Object.assign({}, discoveredGames[game.id]), { store }));
            }
        })
            .catch(err => {
            (0, log_1.log)('error', 'failed to identify store for game', err.message);
        });
    }
    else {
        (0, log_1.log)('debug', 'leaving alone previously discovered game', {
            gameId: game.id,
            path: (_d = discoveredGames[game.id]) === null || _d === void 0 ? void 0 : _d.path,
            store: (_e = discoveredGames[game.id]) === null || _e === void 0 ? void 0 : _e.store,
        });
        return Promise.resolve();
    }
}
function queryByArgs(discoveredGames, game) {
    return GameStoreHelper_1.default.find(game.queryArgs)
        .then(results => Promise.all(results.map(res => fs.statAsync(res.gamePath)
        .then(() => res)
        .catch(() => undefined))))
        .then(results => results.filter(res => res !== undefined))
        .then(results => {
        var _a;
        if (results.length === 0) {
            return Promise.resolve(undefined);
        }
        const discoveredStore = (_a = discoveredGames[game.id]) === null || _a === void 0 ? void 0 : _a.store;
        const prio = (entry) => {
            var _a;
            if ((discoveredStore !== undefined)
                && (entry.gameStoreId === discoveredStore)) {
                return 0;
            }
            else {
                return (_a = entry.priority) !== null && _a !== void 0 ? _a : 100;
            }
        };
        results = results.sort((lhs, rhs) => prio(lhs) - prio(rhs));
        return Promise.resolve(results[0]);
    });
}
function queryByCB(game) {
    let gamePath;
    try {
        gamePath = game.queryPath();
        if (typeof gamePath === 'function') {
            throw new CustomErrors_1.SetupError('queryPath must be a string or a promise that resolves to a string');
        }
    }
    catch (err) {
        (0, log_1.log)('warn', 'failed to query game location', {
            game: game.id,
            error: err.message,
        });
        return Promise.reject(err);
    }
    const prom = (typeof (gamePath) === 'string')
        ? Promise.resolve(gamePath)
        : (gamePath !== null && gamePath !== void 0 ? gamePath : Promise.resolve(undefined));
    let store;
    return prom
        .then(resolvedInfo => {
        if (typeof (resolvedInfo) === 'string') {
            return GameStoreHelper_1.default.identifyStore(resolvedInfo)
                .catch(err => {
                (0, log_1.log)('error', 'failed to identify store for game', err.message);
                return undefined;
            })
                .then((storeDetected) => {
                // storeDetected may be undefined, in that case we use default handling
                store = storeDetected;
                return resolvedInfo;
            });
        }
        else if (resolvedInfo === undefined) {
            return Promise.reject(new IGameStore_1.GameEntryNotFound(game.id, 'unknown'));
        }
        else {
            store = resolvedInfo.gameStoreId;
            return resolvedInfo.gamePath;
        }
    })
        .then(resolvedPath => resolvedPath === undefined
        ? Promise.resolve(undefined)
        : fs.statAsync(resolvedPath)
            .then(() => ({ gamePath: resolvedPath, gameStoreId: store }))
            .catch(err => {
            if (err.code === 'ENOENT') {
                (0, log_1.log)('warn', 'rejecting game discovery, directory doesn\'t exist', resolvedPath);
                return Promise.resolve(undefined);
            }
            return Promise.reject(err);
        }));
}
function handleDiscoveredGame(game, resolvedPath, store, discoveredGames, onDiscoveredGame, onDiscoveredTool) {
    if (!(0, util_1.truthy)(resolvedPath)) {
        return undefined;
    }
    (0, log_1.log)('info', 'found game', { name: game.name, location: resolvedPath, store });
    const exe = game.executable(resolvedPath);
    const disco = {
        path: resolvedPath,
        executable: (exe !== game.executable()) ? exe : undefined,
        store,
    };
    onDiscoveredGame(game.id, disco);
    return (0, getNormalizeFunc_1.default)(resolvedPath)
        .then(normalize => discoverRelativeTools(game, resolvedPath, discoveredGames, onDiscoveredTool, normalize))
        .then(() => game.id)
        .catch((err) => {
        onDiscoveredGame(game.id, undefined);
        if (err.message !== undefined) {
            (0, log_1.log)('debug', 'game not found', { id: game.id, err: err.message.replace(/(?:\r\n|\r|\n)/g, '; ') });
        }
        else {
            (0, log_1.log)('warn', 'game not found - invalid exception', { id: game.id, err });
        }
        return undefined;
    });
}
/**
 * run the "quick" discovery using functions provided by the game extension
 *
 * @export
 * @param {IGame[]} knownGames
 * @param {DiscoveredCB} onDiscoveredGame
 * @param {DiscoveredToolCB} onDiscoveredTool
 * @param {Function} onProgress optional progress callback
 * @return the list of gameIds that were discovered
 */
function quickDiscovery(knownGames, discoveredGames, onDiscoveredGame, onDiscoveredTool, onProgress) {
    // On macOS, use platform-specific discovery with priority ordering
    if ((0, platform_2.isMacOS)()) {
        return (0, macOSGameDiscovery_1.discoverMacOSGames)(knownGames, discoveredGames, onDiscoveredGame, onDiscoveredTool, onProgress)
            .then(macResults => {
            // Continue with standard discovery for any games not found by macOS discovery
            const remainingGames = knownGames.filter(game => !macResults.includes(game.id) &&
                !(0, storeHelper_1.getSafe)(discoveredGames, [game.id, 'pathSetManually'], false));
            if (remainingGames.length === 0) {
                return macResults;
            }
            return standardQuickDiscovery(remainingGames, discoveredGames, onDiscoveredGame, onDiscoveredTool)
                .then(standardResults => [...macResults, ...standardResults]);
        });
    }
    // Use standard discovery for non-macOS platforms
    return standardQuickDiscovery(knownGames, discoveredGames, onDiscoveredGame, onDiscoveredTool);
}
function standardQuickDiscovery(knownGames, discoveredGames, onDiscoveredGame, onDiscoveredTool) {
    return Promise.all(knownGames.map(game => quickDiscoveryTools(game.id, game.supportedTools, onDiscoveredTool)
        .then(() => {
        if ((0, storeHelper_1.getSafe)(discoveredGames, [game.id, 'pathSetManually'], false)) {
            // don't override manually set game location but maybe update some settings
            return updateManuallyConfigured(discoveredGames, game, onDiscoveredGame)
                .then(() => Promise.resolve(undefined));
        }
        (0, log_1.log)('debug', 'discovering game', game.id);
        let prom;
        if (game.queryArgs !== undefined) {
            prom = queryByArgs(discoveredGames, game)
                .then(result => {
                if (result !== undefined) {
                    return handleDiscoveredGame(game, result.gamePath, result.gameStoreId, discoveredGames, onDiscoveredGame, onDiscoveredTool);
                }
                else {
                    return Promise.resolve(undefined);
                }
            });
        }
        else if (game.queryPath !== undefined) {
            prom = queryByCB(game)
                .then(result => {
                if (result === undefined) {
                    return Promise.resolve(undefined);
                }
                return handleDiscoveredGame(game, result.gamePath, result.gameStoreId, discoveredGames, onDiscoveredGame, onDiscoveredTool);
            });
        }
        else {
            prom = Promise.resolve(undefined);
        }
        return prom.catch(err => {
            if (!(err instanceof IGameStore_1.GameEntryNotFound)
                && !(err instanceof CustomErrors_1.ProcessCanceled)
                // probably an extension using registry for discovery but I don't like
                // ignoring these
                && !(err.name === 'WinApiException')) {
                (0, log_1.log)('error', 'failed to use game support plugin', { id: game.id, err: err.message, stack: err.stack });
            }
            // don't escalate exception because a single game shouldn't break everything
            return Promise.resolve(undefined);
        });
    })))
        .then(gameNames => gameNames.filter(name => name !== undefined));
}
/**
 * recursively walk the specified directory, calling
 * the resultCB whenever a file or directory from the
 * matchList was hit.
 *
 * @param {string} searchPath
 * @param {Set<string>} matchList
 * @param {(path: string) => void} resultCB
 * @param {Progress} progress
 * @param {Normalize} normalize a function to normalize a filename for the
 *                    search folder, i.e. in a case-insensitive fs
 *                    it will upper-case the input. the entries of
 *                    matchList and blackList will be normalized within
 *                    the same function.
 * @returns number of directories read
 */
function walk(searchPath, matchList, resultCB, progress, normalize) {
    // we can't actually know the progress percentage because for
    // that we'd need to search the disk twice, first to know the number of directories
    // just so we can show progress for the second run.
    // So instead we start with an extremely high directory total and gradually converge
    // towards an extrapolation based on progress so far, to get a smoother progress.
    let estimatedDirectories = Math.pow(2, 24);
    const seenTL = new Set();
    let processedTL = 0;
    let seenDirectories = 0;
    let isTL = true;
    return (0, turbowalk_1.default)(searchPath, entries => {
        let doneCount = 0;
        let lastCompleted;
        entries.forEach(entry => {
            if (entry.isTerminator) {
                if (seenTL.has(entry.filePath)) {
                    ++processedTL;
                    // 80% of previous estimate plus a bit more than 20% of new estimate.
                    // this will estimate a bit more than it mathematically should,
                    // so the progress doesn't hang at 100%
                    const estPerTL = seenDirectories / processedTL;
                    estimatedDirectories = (Math.max(estimatedDirectories, seenDirectories) * 0.8 +
                        estPerTL * seenTL.size * 0.202);
                    (0, log_1.log)('debug', 'updated estimate', { searchPath, estimatedDirectories, seenDirectories,
                        topLevelTotal: seenTL.size, processedTL });
                    if (progress) {
                        progress.setStepCount(estimatedDirectories);
                    }
                }
                ++doneCount;
                lastCompleted = entry.filePath;
            }
            else if (entry.isDirectory) {
                ++seenDirectories;
                if (isTL) {
                    if (path.relative(searchPath, entry.filePath).indexOf(path.sep) !==
                        -1) {
                        isTL = false;
                    }
                    else {
                        seenTL.add(entry.filePath);
                    }
                }
            }
            else if (matchList.has(normalize(path.basename(entry.filePath)))) {
                (0, log_1.log)('info', 'potential match', entry.filePath);
                // notify that a searched file was found. If the CB says so
                // we stop looking at this directory
                resultCB(entry.filePath);
            }
        });
        if (progress) {
            // count number of directories to be used as the step counter in the progress bar
            if (estimatedDirectories < seenDirectories) {
                estimatedDirectories = seenDirectories * ((seenTL.size + 1) / Math.max(processedTL, 1));
                progress.setStepCount(estimatedDirectories);
            }
            progress.completed(lastCompleted, doneCount);
        }
    }, { terminators: true })
        .then(() => seenDirectories);
}
function verifyToolDir(tool, testPath) {
    return tool.requiredFiles.reduce((promise, fileName) => {
        return promise.then(() => {
            // our fs overload would try to acquire access to the directory if it's locked, which
            // is not something we want at this point because we don't even know yet if the user
            // wants to manage the game at all.
            // Use macOS compatibility layer for file validation
            if ((0, platform_2.isMacOS)()) {
                return (0, macOSGameCompatibility_1.checkFileWithMacOSFallback)(testPath, fileName, tool.id)
                    .then((exists) => {
                    if (!exists) {
                        const error = new Error(`File not found: ${fileName}`);
                        error.code = 'ENOENT';
                        error.path = path.join(testPath, fileName);
                        throw error;
                    }
                    return undefined;
                });
            }
            else {
                return fsExtra.stat(path.join(testPath, fileName))
                    .then(() => undefined)
                    .catch(err => {
                    return Promise.reject(err);
                });
            }
        });
    }, Promise.resolve())
        .then(() => undefined);
}
function assertToolDir(tool, testPath) {
    if (!(0, util_1.truthy)(testPath)) {
        return Promise.resolve(undefined);
    }
    // Add retry logic for macOS timing issues
    const attemptVerification = (retryCount = 0) => {
        return verifyToolDir(tool, testPath)
            .then(() => testPath)
            .catch(err => {
            if (err.code === 'ENOENT' && retryCount < 2 && process.platform === 'darwin') {
                // On macOS, retry once after a brief delay for timing issues
                (0, log_1.log)('debug', 'game directory verification failed, retrying', {
                    game: tool.name,
                    testPath,
                    missing: err.path,
                    retryCount
                });
                return new Promise((resolve) => setTimeout(() => resolve(), 150 * (retryCount + 1)))
                    .then(() => attemptVerification(retryCount + 1));
            }
            else if (err.code === 'ENOENT') {
                (0, log_1.log)('warn', 'game directory not valid', { game: tool.name, testPath, missing: err.path });
            }
            else if (err.code === 'EPERM') {
                (0, log_1.log)('warn', 'game directory can\'t be read due to file permissions', { game: tool.name, testPath });
                return testPath;
            }
            else {
                (0, log_1.log)('error', 'failed to verify game directory', { testPath, error: err.message });
            }
            return Promise.reject(err);
        });
    };
    return attemptVerification();
}
const nop = () => undefined;
function discoverRelativeTools(game, gamePath, discoveredGames, onDiscoveredTool, normalize) {
    (0, log_1.log)('info', 'discovering relative tools', gamePath);
    const start = Date.now();
    const discoveredTools = (0, storeHelper_1.getSafe)(discoveredGames[game.id], ['tools'], {});
    const relativeTools = (game.supportedTools || [])
        .filter(tool => tool.relative === true)
        .filter(tool => (discoveredTools[tool.id] === undefined)
        || (discoveredTools[tool.id].executable === undefined));
    if (relativeTools.length === 0) {
        return Promise.resolve();
    }
    const files = relativeTools.reduce((prev, tool) => {
        for (const required of tool.requiredFiles) {
            prev.push({
                fileName: normalize(required),
                gameId: game.id,
                application: tool,
            });
        }
        return prev;
    }, []);
    const matchList = new Set(files.map(entry => path.basename(entry.fileName)));
    const onFileCB = filePath => onFile(filePath, files, normalize, discoveredGames, nop, onDiscoveredTool);
    return walk(gamePath, matchList, onFileCB, undefined, normalize)
        .then(() => {
        (0, log_1.log)('debug', 'done discovering relative tools', { elapsed: Date.now() - start });
    });
}
function autoGenIcon(application, exePath, gameId) {
    const iconPath = StarterInfo_1.default.toolIconRW(gameId, application.id);
    return (application.logo === 'auto')
        ? fs.ensureDirWritableAsync(path.dirname(iconPath), () => Promise.resolve())
            .then(() => fs.statAsync(iconPath).then(() => null))
            .catch(() => (0, exeIcon_1.default)(exePath, iconPath))
            .catch(err => (0, log_1.log)('warn', 'failed to fetch exe icon', err.message))
        : Promise.resolve();
}
function testApplicationDirValid(application, testPath, gameId, discoveredGames, onDiscoveredGame, onDiscoveredTool, normalize) {
    verifyToolDir(application, testPath)
        .then(() => {
        const game = application;
        if (game.queryModPath !== undefined) {
            const exe = game.executable(testPath);
            const disco = {
                path: testPath,
                executable: (exe !== game.executable()) ? exe : undefined,
            };
            onDiscoveredGame(gameId, disco);
            return discoverRelativeTools(game, testPath, discoveredGames, onDiscoveredTool, normalize);
        }
        else {
            const exePath = path.join(testPath, application.executable(testPath));
            return autoGenIcon(application, exePath, gameId).then(() => {
                onDiscoveredTool(gameId, Object.assign(Object.assign({}, application), { path: exePath, hidden: false, custom: false }));
            });
        }
    })
        .catch(() => {
        (0, log_1.log)('info', 'invalid', { game: application.id, path: testPath });
    });
}
function toolFilesForGame(game, discoveredTools, normalize) {
    const result = [];
    if (game.supportedTools !== undefined) {
        // all the (non-relative) known tools for the game we haven't found already
        game.supportedTools
            .filter(tool => tool.relative !== true)
            .forEach((tool) => {
            if ((0, storeHelper_1.getSafe)(discoveredTools, [tool.id, 'path'], undefined) === undefined) {
                for (const required of tool.requiredFiles) {
                    result.push({
                        fileName: normalize(required),
                        gameId: game.id,
                        application: tool,
                    });
                }
            }
        });
    }
    return result;
}
function onFile(filePath, files, normalize, discoveredGames, onDiscoveredGame, onDiscoveredTool) {
    const normalized = normalize(filePath);
    const matches = files.filter(entry => normalized.endsWith(entry.fileName));
    for (const match of matches) {
        const testPath = filePath.substring(0, filePath.length - match.fileName.length);
        testApplicationDirValid(match.application, testPath, match.gameId, discoveredGames, onDiscoveredGame, onDiscoveredTool, normalize);
    }
    return false;
}
/**
 * run the "search"-discovery based on required files as specified by the game extension
 *
 * @export
 * @param {IGame[]} knownGames
 * @param {{ [id: string]: any }} discoveredGames
 * @param {string[]} searchPaths
 * @param {DiscoveredCB} onDiscoveredGame
 * @param {Progress} progressObj
 * @returns {Promise<any[]>}
 */
function searchDiscovery(knownGames, discoveredGames, searchPaths, onDiscoveredGame, onDiscoveredTool, onError, progressCB) {
    let totalRead = 0;
    return Promise.all(
    // windows has separate cwds per drive. If we used c: as the search path it would not actually
    // search in the root of drive c but in whatever is currently the working directory on c, so
    // we have to append a backslash. Damn you windows...
    searchPaths.map(searchPath => searchPath.endsWith(':') ? searchPath + path.sep : searchPath)
        .map((searchPath, index) => {
        (0, log_1.log)('info', 'searching for games & tools', { searchPath });
        const progressObj = new Progress_1.default(0, 100, (percent, label) => progressCB(index, percent, label));
        // recurse through the search path and look for known files. use the appropriate file name
        // normalization
        return (0, getNormalizeFunc_1.default)(searchPath, { separators: true, unicode: false, relative: false })
            .then((normalize) => {
            // gather files to look for
            const files = [];
            knownGames.forEach((knownGame) => {
                const discoveredGame = discoveredGames[knownGame.id];
                // the game itself
                if ((discoveredGame === null || discoveredGame === void 0 ? void 0 : discoveredGame.path) === undefined) {
                    for (const required of knownGame.requiredFiles) {
                        files.push({
                            fileName: normalize(required),
                            gameId: knownGame.id,
                            application: knownGame,
                        });
                    }
                }
                // and its tools
                files.push.apply(files, toolFilesForGame(knownGame, (0, storeHelper_1.getSafe)(discoveredGame, ['tools'], {}), normalize));
            }, []);
            // retrieve only the basenames of required files because the walk only ever looks
            // at the last path component of a file
            const matchList = new Set(files.map(entry => path.basename(entry.fileName)));
            const onFileCB = (filePath) => onFile(filePath, files, normalize, discoveredGames, onDiscoveredGame, onDiscoveredTool);
            return walk(searchPath, matchList, onFileCB, progressObj, normalize)
                .then(numRead => {
                totalRead += numRead;
            });
        })
            .then(() => {
            (0, log_1.log)('info', 'finished game search', { searchPath });
        })
            .catch(err => {
            (0, log_1.log)('error', 'game search failed', { error: err.message, searchPath });
            return (err.code === 'ENOENT')
                ? Promise.resolve(onError('A search path doesn\'t exist or is not connected', searchPath))
                : Promise.resolve(onError(err.message, searchPath));
        })
            .then(() => {
            progressObj.completed(searchPath);
            return null;
        });
    }))
        .then(() => totalRead);
}
function suggestStagingPath(api, gameId) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const modPaths = (0, selectors_1.modPathsForGame)(state, gameId);
        let statModPath;
        const idModPath = (testPath) => __awaiter(this, void 0, void 0, function* () {
            try {
                statModPath = yield fs.statAsync(testPath);
            }
            catch (err) {
                if (err.code === 'ENOENT') {
                    yield idModPath(path.dirname(testPath));
                }
                else {
                    throw err;
                }
            }
        });
        yield idModPath(modPaths['']);
        const statUserData = yield fs.statAsync((0, getVortexPath_1.default)('userData'));
        let suggestion;
        if ((statModPath.dev === statUserData.dev)
            || !(0, platform_1.isWindows)()) {
            // main mod folder is on same drive as userdata, use a subdirectory below that
            suggestion = path.join('{USERDATA}', '{game}', 'mods');
        }
        else {
            // different drives, suggest path on same drive
            const volume = winapi.GetVolumePathName(modPaths['']);
            suggestion = path.join(volume, state.settings.mods.suggestInstallPathDirectory, '{game}');
        }
        return suggestion;
    });
}
