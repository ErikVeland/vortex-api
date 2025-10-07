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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readExtensionsSync = exports.readExtensibleDir = exports.downloadGithubRaw = exports.downloadFile = exports.downloadGithubRelease = exports.downloadFromNexus = exports.downloadAndInstallExtension = exports.fetchAvailableExtensions = exports.readExtensions = exports.readExtensionInfo = exports.sanitize = exports.selectorMatch = void 0;
const CustomErrors_1 = require("../../util/CustomErrors");
const fs = __importStar(require("../../util/fs"));
const fsAtomic_1 = require("../../util/fsAtomic");
const getVortexPath_1 = __importDefault(require("../../util/getVortexPath"));
const log_1 = require("../../util/log");
const network_1 = require("../../util/network");
const storeHelper_1 = require("../../util/storeHelper");
const util_1 = require("../../util/util");
const electron_1 = require("electron");
const state_1 = require("../download_management/actions/state");
const DownloadManager_1 = require("../download_management/DownloadManager");
const selectors_1 = require("../download_management/selectors");
const constants_1 = require("../gamemode_management/constants");
const installExtension_1 = __importDefault(require("./installExtension"));
const bluebird_1 = __importDefault(require("bluebird"));
const _ = __importStar(require("lodash"));
const node_7z_1 = __importDefault(require("node-7z"));
const path = __importStar(require("path"));
const shortid_1 = require("shortid");
const caches = {};
// don't fetch more than once per hour
const UPDATE_FREQUENCY = 60 * 60 * 1000;
const GAMES_BRANCH = 'release';
function githubApiUrl(repo, api, args) {
    return `https://api.github.com/repos/${repo}/${api}/${args}`;
}
function githubRawUrl(repo, branch, repoPath) {
    return `https://raw.githubusercontent.com/${repo}/${branch}/${repoPath}`;
}
//const EXTENSION_FORMAT = '1_8';
const EXTENSION_FILENAME = `extensions-manifest.json`;
const EXTENSION_PATH = 'out/';
const EXTENSION_URL = githubRawUrl('Nexus-Mods/Vortex-Backend', 'main', EXTENSION_PATH + EXTENSION_FILENAME);
/**
 * Helper function to retrieve extension state with consistent error handling
 * Reduces duplicated debug messages across multiple functions
 */
function getExtensionStateForFiltering() {
    let persistentState = {};
    try {
        // Try to get the extension state from the main process
        if (electron_1.ipcRenderer !== undefined) {
            persistentState = electron_1.ipcRenderer.sendSync('__get_extension_state') || {};
        }
    }
    catch (err) {
        // If we can't get the state, continue without filtering
        (0, log_1.log)('debug', 'could not retrieve extension state for filtering', { error: err.message });
    }
    return persistentState;
}
function getAllDirectories(searchPath) {
    return fs.readdirAsync(searchPath)
        .filter((fileName) => {
        if (path.extname(fileName) === '.installing') {
            // ignore directories during installation
            return bluebird_1.default.resolve(false);
        }
        return fs.statAsync(path.join(searchPath, fileName))
            .then(stat => stat.isDirectory())
            .catch(err => {
            if (err.code !== 'ENOENT') {
                (0, log_1.log)('error', '❌ failed to stat file/directory', {
                    searchPath, fileName, error: err.message,
                });
            }
            // the stat may fail if the directory has been removed/renamed between reading the dir
            // and the stat. Specifically this can happen while installing an extension for the
            // temporary ".installing" directory
            return bluebird_1.default.resolve(false);
        });
    })
        .catch({ code: 'ENOENT' }, () => []);
}
function applyExtensionInfo(id, bundled, values, fallback) {
    const res = {
        name: values.name || fallback.name || id,
        author: values.author || fallback.author || 'Unknown',
        version: values.version || fallback.version || '0.0.0',
        description: values.description || fallback.description || 'Missing',
    };
    // add optional settings if we have them
    const add = (key, value, fallbackValue) => {
        if (value !== undefined) {
            res[key] = value;
        }
        else if (fallbackValue !== undefined) {
            res[key] = fallbackValue;
        }
    };
    add('type', values.type, fallback.type);
    add('path', values.path, fallback.path);
    add('bundled', bundled, undefined);
    add('modId', values.modId, fallback.modId);
    return res;
}
function selectorMatch(ext, selector) {
    if (selector === undefined) {
        return false;
    }
    else if ((0, util_1.truthy)(selector.modId)) {
        return ext.modId === selector.modId;
    }
    else if ((0, util_1.truthy)(selector.githubRawPath)) {
        return (ext.github === selector.github) && (ext.githubRawPath === selector.githubRawPath);
    }
    else {
        return (ext.github === selector.github);
    }
}
exports.selectorMatch = selectorMatch;
function sanitize(input) {
    return input.replace(util_1.INVALID_FILENAME_RE, '_');
}
exports.sanitize = sanitize;
function readExtensionInfo(extensionPath, bundled, fallback = {}) {
    const finalPath = extensionPath.replace(/\.installing$/, '');
    return fs.readFileAsync(path.join(extensionPath, 'info.json'), { encoding: 'utf-8' })
        .then(info => {
        const data = JSON.parse(info);
        data.path = finalPath;
        // Strip archive extensions when falling back to path basename for ID
        const baseName = path.basename(finalPath);
        const id = data.id || baseName.replace(/\.(7z|zip|rar|tar|gz|bz2|xz|tgz)$/i, '');
        return {
            id,
            info: applyExtensionInfo(id, bundled, data, fallback),
        };
    })
        .catch(() => {
        // Strip archive extensions when falling back to path basename for ID
        const baseName = path.basename(finalPath);
        const id = baseName.replace(/\.(7z|zip|rar|tar|gz|bz2|xz|tgz)$/i, '');
        return {
            id,
            info: applyExtensionInfo(id, bundled, {}, fallback),
        };
    });
}
exports.readExtensionInfo = readExtensionInfo;
function readExtensionDir(pluginPath, bundled) {
    return getAllDirectories(pluginPath)
        .map((extPath) => path.join(pluginPath, extPath))
        .map((fullPath) => readExtensionInfo(fullPath, bundled));
}
function readExtensions(force) {
    if ((caches.__installedExtensions === undefined) || force) {
        caches.__installedExtensions = doReadExtensions();
    }
    return caches.__installedExtensions;
}
exports.readExtensions = readExtensions;
function doReadExtensions() {
    const bundledPath = (0, getVortexPath_1.default)('bundledPlugins');
    const extensionsPath = path.join((0, getVortexPath_1.default)('userData'), 'plugins');
    // Get the current extension state to check for extensions marked for removal
    const persistentState = getExtensionStateForFiltering();
    return bluebird_1.default.all([readExtensionDir(bundledPath, true),
        readExtensionDir(extensionsPath, false)])
        .then(extLists => [].concat(...extLists))
        .reduce((prev, value) => {
        var _a;
        // Skip extensions marked for removal in persistent state
        if (!((_a = persistentState[value.id]) === null || _a === void 0 ? void 0 : _a.remove)) {
            prev[value.id] = value.info;
        }
        return prev;
    }, {});
}
function fetchAvailableExtensions(forceCache, forceDownload = false) {
    if ((caches.__availableExtensions === undefined) || forceCache || forceDownload) {
        caches.__availableExtensions = doFetchAvailableExtensions(forceDownload);
    }
    return caches.__availableExtensions;
}
exports.fetchAvailableExtensions = fetchAvailableExtensions;
function downloadExtensionList(cachePath) {
    (0, log_1.log)('info', '📥 downloading extension list', { url: EXTENSION_URL });
    return bluebird_1.default.resolve((0, network_1.jsonRequest)(EXTENSION_URL))
        .then(manifest => {
        (0, log_1.log)('debug', '📋 extension list received');
        return manifest.extensions.filter(ext => ext.name !== undefined);
    })
        .tap(extensions => (0, fsAtomic_1.writeFileAtomic)(cachePath, JSON.stringify({ extensions }, undefined, 2)))
        .tapCatch(err => (0, log_1.log)('error', '❌ failed to download extension list', err));
}
function doFetchAvailableExtensions(forceDownload) {
    const cachePath = path.join((0, getVortexPath_1.default)('temp'), EXTENSION_FILENAME);
    let time = new Date();
    const checkCache = forceDownload
        ? bluebird_1.default.resolve(true)
        : fs.statAsync(cachePath).then(stat => {
            if ((Date.now() - stat.mtimeMs) > UPDATE_FREQUENCY) {
                return true;
            }
            else {
                time = stat.mtime;
                return false;
            }
        });
    return checkCache
        .then(needsDownload => {
        if (needsDownload) {
            (0, log_1.log)('info', '🔄 extension list outdated, will update');
        }
        else {
            (0, log_1.log)('info', '✅ extension list up-to-date');
        }
        return needsDownload
            ? downloadExtensionList(cachePath)
            : fs.readFileAsync(cachePath, { encoding: 'utf8' })
                .then(data => {
                try {
                    return JSON.parse(data).extensions;
                }
                catch (err) {
                    return bluebird_1.default.reject(new CustomErrors_1.DataInvalid('Extension cache invalid, please try again later'));
                }
            });
    })
        .catch({ code: 'ENOENT' }, () => {
        (0, log_1.log)('info', '📋 extension list missing, will update');
        return downloadExtensionList(cachePath);
    })
        .catch(err => {
        (0, log_1.log)('error', '❌ failed to fetch list of extensions', err);
        return bluebird_1.default.resolve([]);
    })
        .filter((ext) => ext.description !== undefined)
        .then(extensions => ({ time, extensions }));
}
function downloadAndInstallExtension(api, ext) {
    let download;
    let dlPromise;
    // Show activity notification for better UX
    const notificationId = `installing-extension-${Date.now()}`;
    api.sendNotification({
        id: notificationId,
        type: 'activity',
        message: `Downloading ${ext.name}...`,
        displayMS: 10000,
    });
    if ((0, util_1.truthy)(ext.modId)) {
        dlPromise = downloadFromNexus(api, ext);
    }
    else if ((0, util_1.truthy)(ext.githubRawPath)) {
        dlPromise = downloadGithubRaw(api, ext);
    }
    else if ((0, util_1.truthy)(ext.githubRelease)) {
        dlPromise = downloadGithubRelease(api, ext);
    }
    else {
        // don't report an error if the extension list contains invalid data
        // Dismiss the activity notification
        api.dismissNotification(notificationId);
        return bluebird_1.default.resolve(false);
    }
    const sourceName = (0, util_1.truthy)(ext.modId)
        ? 'nexusmods.com'
        : 'github.com';
    return dlPromise
        .then((dlIds) => {
        // Update notification to show installation phase
        api.sendNotification({
            id: notificationId,
            type: 'activity',
            message: `Installing ${ext.name}...`,
            displayMS: 10000,
        });
        const state = api.store.getState();
        if ((dlIds === undefined) || (dlIds.length !== 1)) {
            // Dismiss the activity notification
            api.dismissNotification(notificationId);
            return bluebird_1.default.reject(new CustomErrors_1.ProcessCanceled('No download found'));
        }
        api.store.dispatch((0, state_1.setDownloadModInfo)(dlIds[0], 'internal', true));
        download = (0, storeHelper_1.getSafe)(state, ['persistent', 'downloads', 'files', dlIds[0]], undefined);
        if (download === undefined) {
            // Dismiss the activity notification
            api.dismissNotification(notificationId);
            return bluebird_1.default.reject(new Error('Download not found'));
        }
        return fetchAvailableExtensions(false);
    })
        .then((availableExtensions) => {
        const extDetail = availableExtensions.extensions
            .find(iter => ((ext.modId === undefined) || (iter.modId === ext.modId))
            && ((ext.fileId === undefined) || (iter.fileId === ext.fileId))
            && (ext.name === iter.name));
        const info = (extDetail !== undefined)
            ? Object.assign(Object.assign({}, _.pick(extDetail, ['id', 'name', 'author', 'version', 'type'])), { bundled: false, description: extDetail.description.short, modId: ext.modId }) : undefined;
        const state = api.store.getState();
        const downloadPath = (0, selectors_1.downloadPathForGame)(state, constants_1.SITE_ID);
        return (0, installExtension_1.default)(api, path.join(downloadPath, download.localPath), info);
    })
        .then(() => {
        // Dismiss the activity notification
        api.dismissNotification(notificationId);
        return bluebird_1.default.resolve(true);
    })
        .catch(CustomErrors_1.UserCanceled, () => {
        // Dismiss the activity notification
        api.dismissNotification(notificationId);
        return null;
    })
        .catch(CustomErrors_1.ProcessCanceled, () => {
        // Dismiss the activity notification
        api.dismissNotification(notificationId);
        api.showDialog('error', 'Installation failed', {
            text: 'Failed to install the extension "{{extensionName}}" from "{{sourceName}}", '
                + 'please check the notifications.',
            parameters: {
                extensionName: ext.name,
                sourceName,
            },
            options: {
                hideMessage: true,
            },
        }, [
            { label: 'Close' },
        ]);
        return bluebird_1.default.resolve(false);
    })
        .catch(CustomErrors_1.ServiceTemporarilyUnavailable, err => {
        // Dismiss the activity notification
        api.dismissNotification(notificationId);
        (0, log_1.log)('warn', '⚠️ Failed to download from github', { message: err.message });
        return bluebird_1.default.resolve(false);
    })
        .catch(err => {
        // Dismiss the activity notification
        api.dismissNotification(notificationId);
        api.showDialog('error', 'Installation failed', {
            text: 'Failed to install the extension "{{extensionName}}" from "{{sourceName}}"',
            parameters: {
                extensionName: ext.name,
                sourceName,
            },
            message: err.stack,
            options: {
                hideMessage: true,
            },
        }, [
            { label: 'Close' },
        ]);
        return bluebird_1.default.resolve(false);
    });
}
exports.downloadAndInstallExtension = downloadAndInstallExtension;
const UPDATE_PREFIX = 'Vortex Extension Update -';
function archiveFileName(ext) {
    const name = ext.name.startsWith('Game:')
        ? ext.name.replace('Game:', UPDATE_PREFIX)
        : UPDATE_PREFIX + ' ' + ext.name;
    return (ext['version'] !== undefined)
        ? `${sanitize(name)} v${ext['version']}.7z`
        : `${sanitize(name)}.7z`;
}
function downloadFromNexus(api, ext) {
    if ((ext.fileId === undefined) && (ext.modId !== undefined)) {
        const state = api.getState();
        const availableExt = state.session.extensions.available.find(iter => iter.modId === ext.modId);
        if (availableExt !== undefined) {
            ext.fileId = availableExt.fileId;
        }
        else {
            return bluebird_1.default.reject(new Error('unavailable nexus extension'));
        }
    }
    (0, log_1.log)('debug', '📥 download from nexus', archiveFileName(ext));
    return api.emitAndAwait('nexus-download', constants_1.SITE_ID, ext.modId, ext.fileId, archiveFileName(ext), false);
}
exports.downloadFromNexus = downloadFromNexus;
function downloadGithubRelease(api, ext) {
    return new bluebird_1.default((resolve, reject) => {
        api.events.emit('start-download', [ext.githubRelease], { game: constants_1.SITE_ID }, archiveFileName(ext), (err, dlId) => {
            if (err !== null) {
                if (err instanceof DownloadManager_1.AlreadyDownloaded) {
                    const state = api.getState();
                    const downloads = state.persistent.downloads.files;
                    const existingId = Object.keys(downloads).find(iter => downloads[iter].localPath === err.fileName);
                    return (existingId !== undefined)
                        ? resolve([existingId])
                        : reject(err);
                }
                return reject(err);
            }
            else {
                return resolve([dlId]);
            }
        }, 'always', { allowInstall: 'force' });
    })
        .catch(DownloadManager_1.AlreadyDownloaded, (err) => {
        const state = api.getState();
        const downloads = state.persistent.downloads.files;
        const dlId = Object.keys(downloads).find(iter => downloads[iter].localPath === err.fileName);
        return [dlId];
    });
}
exports.downloadGithubRelease = downloadGithubRelease;
function downloadFile(url, outputPath) {
    // Import the macOS compatibility function
    const { interceptDownloadURLForMacOS } = require('../../util/macOSGameCompatibility');
    // Apply macOS URL interception
    const interceptedUrl = interceptDownloadURLForMacOS(url);
    return bluebird_1.default.resolve((0, network_1.rawRequest)(interceptedUrl))
        .then((data) => fs.writeFileAsync(outputPath, data));
}
exports.downloadFile = downloadFile;
function downloadGithubRawRecursive(repo, source, destination) {
    const apiUrl = githubApiUrl(repo, 'contents', source) + '?ref=' + GAMES_BRANCH;
    return bluebird_1.default.resolve((0, network_1.rawRequest)(apiUrl, { encoding: 'utf8' }))
        .then((content) => {
        const data = JSON.parse(content);
        if (!Array.isArray(data)) {
            if ((typeof (data) === 'object') && (data.message !== undefined)) {
                return bluebird_1.default.reject(new CustomErrors_1.ServiceTemporarilyUnavailable(data.message));
            }
            else {
                (0, log_1.log)('info', '⚠️ unexpected response from github', content);
                return bluebird_1.default.reject(new Error('Unexpected response from github (see log file)'));
            }
        }
        const repoFiles = data.filter(iter => iter.type === 'file').map(iter => iter.name);
        const repoDirs = data.filter(iter => iter.type === 'dir').map(iter => iter.name);
        return bluebird_1.default.map(repoFiles, fileName => downloadFile(githubRawUrl(repo, GAMES_BRANCH, `${source}/${fileName}`), path.join(destination, fileName)))
            .then(() => bluebird_1.default.map(repoDirs, fileName => {
            const sourcePath = `${source}/${fileName}`;
            const outPath = path.join(destination, fileName);
            return fs.mkdirAsync(outPath)
                .then(() => downloadGithubRawRecursive(repo, sourcePath, outPath));
        }));
    });
}
function downloadGithubRaw(api, ext) {
    const state = api.store.getState();
    const downloadPath = (0, selectors_1.downloadPathForGame)(state, constants_1.SITE_ID);
    const archiveName = archiveFileName(ext);
    const { files } = state.persistent.downloads;
    const existing = Object.keys(files).find(dlId => { var _a; return ((_a = files[dlId].game) !== null && _a !== void 0 ? _a : []).includes(constants_1.SITE_ID) && files[dlId].localPath === archiveName; });
    // the only plausible reason the file could already exist is if a previous install failed
    // or if we don't know the version. We could create a new new, numbered, download, but considering
    // these are small files I think that is more likely to frustrate the user
    const cleanProm = existing !== undefined
        ? fs.removeAsync(path.join(downloadPath, archiveName))
            .then(() => { api.events.emit('remove-download', existing); })
        : bluebird_1.default.resolve();
    return cleanProm.then(() => fs.withTmpDir((tmpPath) => {
        const archivePath = path.join(tmpPath, archiveName);
        return downloadGithubRawRecursive(ext.github, ext.githubRawPath, tmpPath)
            .then(() => {
            return fs.readdirAsync(tmpPath);
        })
            .then((repoFiles) => {
            const pack = new node_7z_1.default();
            return pack.add(archivePath, repoFiles.map(fileName => path.join(tmpPath, fileName)));
        })
            .then(() => fs.moveAsync(archivePath, path.join(downloadPath, archiveName)))
            .then(() => {
            const archiveId = (0, shortid_1.generate)();
            api.store.dispatch((0, state_1.addLocalDownload)(archiveId, constants_1.SITE_ID, archiveName, 0));
            return [archiveId];
        });
    }));
}
exports.downloadGithubRaw = downloadGithubRaw;
function readExtensibleDir(extType, bundledPath, customPath) {
    const readBaseDir = (baseName) => {
        return fs.readdirAsync(baseName)
            .filter((name) => fs.statAsync(path.join(baseName, name))
            .then(stats => stats.isDirectory()))
            .map((name) => path.join(baseName, name))
            .catch({ code: 'ENOENT' }, () => []);
    };
    return readExtensions(false)
        .then(extensions => {
        const extDirs = Object.keys(extensions)
            .filter(extId => extensions[extId].type === extType)
            .map(extId => extensions[extId].path);
        return bluebird_1.default.join(readBaseDir(bundledPath), ...extDirs.map(extPath => readBaseDir(extPath)), readBaseDir(customPath));
    })
        .then(lists => [].concat(...lists));
}
exports.readExtensibleDir = readExtensibleDir;
// Synchronous versions of extension reading functions
function getAllDirectoriesSync(searchPath) {
    try {
        return fs.readdirSync(searchPath)
            .filter((fileName) => {
            if (path.extname(fileName) === '.installing') {
                // ignore directories during installation
                return false;
            }
            try {
                const stat = fs.statSync(path.join(searchPath, fileName));
                return stat.isDirectory();
            }
            catch (err) {
                if (err.code !== 'ENOENT') {
                    (0, log_1.log)('error', 'failed to stat file/directory', {
                        searchPath, fileName, error: err.message,
                    });
                }
                return false;
            }
        });
    }
    catch (err) {
        if (err.code === 'ENOENT') {
            return [];
        }
        throw err;
    }
}
function readExtensionDirSync(pluginPath, bundled) {
    const directories = getAllDirectoriesSync(pluginPath);
    const results = [];
    for (const extPath of directories) {
        const fullPath = path.join(pluginPath, extPath);
        try {
            // Use the synchronous version of readExtensionInfo
            const extensionInfo = readExtensionInfoSync(fullPath, bundled);
            results.push(extensionInfo);
        }
        catch (err) {
            (0, log_1.log)('warn', 'failed to read extension info synchronously', { fullPath, error: err.message });
        }
    }
    return results;
}
function readExtensionInfoSync(extensionPath, bundled, fallback = {}) {
    const finalPath = extensionPath.replace(/\.installing$/, '');
    try {
        const infoData = fs.readFileSync(path.join(extensionPath, 'info.json'), { encoding: 'utf-8' });
        const data = JSON.parse(infoData);
        data.path = finalPath;
        const id = data.id || path.basename(finalPath);
        return {
            id,
            info: applyExtensionInfo(id, bundled, data, fallback),
        };
    }
    catch (err) {
        const id = path.basename(finalPath);
        return {
            id,
            info: applyExtensionInfo(id, bundled, {}, fallback),
        };
    }
}
function readExtensionsSync(force = false) {
    var _a;
    const bundledPath = (0, getVortexPath_1.default)('bundledPlugins');
    const extensionsPath = path.join((0, getVortexPath_1.default)('userData'), 'plugins');
    // Get the current extension state to check for extensions marked for removal
    const persistentState = getExtensionStateForFiltering();
    const bundledExtensions = readExtensionDirSync(bundledPath, true);
    const userExtensions = readExtensionDirSync(extensionsPath, false);
    const allExtensions = [...bundledExtensions, ...userExtensions];
    const result = {};
    for (const ext of allExtensions) {
        // Skip extensions marked for removal in persistent state
        if (!((_a = persistentState[ext.id]) === null || _a === void 0 ? void 0 : _a.remove)) {
            result[ext.id] = ext.info;
        }
    }
    return result;
}
exports.readExtensionsSync = readExtensionsSync;
