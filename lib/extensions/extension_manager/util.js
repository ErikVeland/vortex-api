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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectorMatch = selectorMatch;
exports.sanitize = sanitize;
exports.readExtensionInfo = readExtensionInfo;
exports.readExtensions = readExtensions;
exports.readExtensionsSync = readExtensionsSync;
exports.fetchAvailableExtensions = fetchAvailableExtensions;
exports.downloadAndInstallExtension = downloadAndInstallExtension;
exports.downloadFromNexus = downloadFromNexus;
exports.downloadGithubRelease = downloadGithubRelease;
exports.downloadFile = downloadFile;
exports.downloadGithubRaw = downloadGithubRaw;
exports.readExtensibleDir = readExtensibleDir;
const CustomErrors_1 = require("../../util/CustomErrors");
const fs = __importStar(require("../../util/fs"));
const original_fs_1 = require("original-fs");
const fsAtomic_1 = require("../../util/fsAtomic");
const getVortexPath_1 = __importDefault(require("../../util/getVortexPath"));
const log_1 = require("../../util/log");
const network_1 = require("../../util/network");
const storeHelper_1 = require("../../util/storeHelper");
const util_1 = require("../../util/util");
const promise_helpers_1 = require("../../util/promise-helpers");
const electron_1 = require("electron");
const state_1 = require("../download_management/actions/state");
const DownloadManager_1 = require("../download_management/DownloadManager");
const selectors_1 = require("../download_management/selectors");
const constants_1 = require("../gamemode_management/constants");
const installExtension_1 = __importDefault(require("./installExtension"));
// TODO: Remove Bluebird import - using native Promise;
const _ = __importStar(require("lodash"));
const path = __importStar(require("path"));
const shortid_1 = require("shortid");
const archive_1 = require("../../util/archive");
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
        .then((files) => (0, promise_helpers_1.promiseFilter)(files, (fileName) => {
        if (path.extname(fileName) === '.installing') {
            // ignore directories during installation
            return Promise.resolve(false);
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
            return Promise.resolve(false);
        });
    }))
        .catch(err => { if (err.code === 'ENOENT') {
        return Promise.resolve([]);
    }
    else {
        return Promise.reject(err);
    } });
}
/**
 * Retry helper for network operations with exponential backoff
 * Adds slightly higher retries/delays on macOS to mitigate transient issues
 */
function retryNetworkOperation(operation, retries, baseDelayMs, maxDelayMs, description, isRetryable) {
    const platformFactor = (process.platform === 'darwin') ? 1.5 : 1;
    let attempt = 0;
    const maxAttempts = Math.max(1, Math.floor(retries * platformFactor));
    const cappedMaxDelay = Math.floor(maxDelayMs * platformFactor);
    const doAttempt = () => {
        return Promise.resolve()
            .then(() => operation())
            .catch((err) => {
            attempt += 1;
            const code = (err === null || err === void 0 ? void 0 : err.code) || (err === null || err === void 0 ? void 0 : err.statusCode) || (err === null || err === void 0 ? void 0 : err.status) || 'unknown';
            const msg = (err === null || err === void 0 ? void 0 : err.message) || String(err);
            const shouldRetry = (isRetryable !== undefined)
                ? isRetryable(err)
                : (
                // default retryable network errors
                ['ENOTFOUND', 'ETIMEDOUT', 'ESOCKETTIMEDOUT', 'ECONNRESET', 'ECONNABORTED', 'EAI_AGAIN']
                    .includes(code)
                    || /rate limit/i.test(msg)
                    || /timeout/i.test(msg)
                    || /temporarily unavailable/i.test(msg)
                    || (typeof code === 'number' && (code === 429 || (code >= 500 && code < 600))));
            if (!shouldRetry || attempt >= maxAttempts) {
                (0, log_1.log)('error', 'network operation failed', {
                    description,
                    attempt,
                    maxAttempts,
                    code,
                    message: msg,
                });
                return Promise.reject(err);
            }
            const delay = Math.min(cappedMaxDelay, Math.floor(baseDelayMs * Math.pow(2, attempt - 1) * platformFactor));
            (0, log_1.log)('warn', 'retrying network operation', { description, attempt, delay });
            return (0, promise_helpers_1.promiseDelay)(delay).then(doAttempt);
        });
    };
    return doAttempt();
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
function sanitize(input) {
    return input.replace(util_1.INVALID_FILENAME_RE, '_');
}
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
function readExtensionDir(pluginPath, bundled) {
    return getAllDirectories(pluginPath)
        .then((dirs) => (0, promise_helpers_1.promiseMap)(dirs, (extPath) => {
        const fullPath = path.join(pluginPath, extPath);
        return readExtensionInfo(fullPath, bundled);
    }));
}
function readExtensions(force) {
    if ((caches.__installedExtensions === undefined) || force) {
        caches.__installedExtensions = doReadExtensions();
    }
    return caches.__installedExtensions;
}
let syncCache = {};
function readExtensionsSync(force) {
    // This is a synchronous version for cases where we need immediate results
    // Note: This should be used sparingly as it blocks the event loop
    if ((Object.keys(syncCache).length === 0) || force) {
        syncCache = doReadExtensionsSync();
    }
    return syncCache;
}
function doReadExtensions() {
    const bundledPath = (0, getVortexPath_1.default)('bundledPlugins');
    const extensionsPath = path.join((0, getVortexPath_1.default)('userData'), 'plugins');
    // Get the current extension state to check for extensions marked for removal
    const persistentState = getExtensionStateForFiltering();
    return Promise.all([readExtensionDir(bundledPath, true),
        readExtensionDir(extensionsPath, false)])
        .then(extLists => [].concat(...extLists))
        .then((extArray) => (0, promise_helpers_1.promiseReduce)(extArray, (prev, value) => {
        var _a;
        // Skip extensions marked for removal in persistent state
        if (!((_a = persistentState[value.id]) === null || _a === void 0 ? void 0 : _a.remove)) {
            prev[value.id] = value.info;
        }
        return Promise.resolve(prev);
    }, {}));
}
function doReadExtensionsSync() {
    const bundledPath = (0, getVortexPath_1.default)('bundledPlugins');
    const extensionsPath = path.join((0, getVortexPath_1.default)('userData'), 'plugins');
    // Get the current extension state to check for extensions marked for removal
    const persistentState = getExtensionStateForFiltering();
    try {
        const bundledExtensions = readExtensionDirSync(bundledPath, true);
        const userExtensions = readExtensionDirSync(extensionsPath, false);
        const extArray = [...bundledExtensions, ...userExtensions];
        return extArray.reduce((prev, value) => {
            var _a;
            // Skip extensions marked for removal in persistent state
            if (!((_a = persistentState[value.id]) === null || _a === void 0 ? void 0 : _a.remove)) {
                prev[value.id] = value.info;
            }
            return prev;
        }, {});
    }
    catch (err) {
        (0, log_1.log)('error', 'Failed to read extensions synchronously', err.message);
        return {};
    }
}
function readExtensionDirSync(searchPath, bundled) {
    try {
        if (!(0, original_fs_1.existsSync)(searchPath)) {
            return [];
        }
        const files = fs.readdirSync(searchPath);
        const validFiles = files.filter(fileName => {
            if (path.extname(fileName) === '.installing') {
                // ignore directories during installation
                return false;
            }
            try {
                const fullPath = path.join(searchPath, fileName);
                const stat = fs.statSync(fullPath);
                return stat.isDirectory();
            }
            catch (err) {
                if (err.code !== 'ENOENT') {
                    (0, log_1.log)('error', '❌ failed to stat file/directory', {
                        searchPath, fileName, error: err.message,
                    });
                }
                // the stat may fail if the directory has been removed/renamed between reading the dir
                // and the stat. Specifically this can happen while installing an extension for the
                // temporary ".installing" directory
                return false;
            }
        });
        return validFiles.map(extPath => {
            const fullPath = path.join(searchPath, extPath);
            return readExtensionInfoSync(fullPath, bundled);
        });
    }
    catch (err) {
        if (err.code === 'ENOENT') {
            return [];
        }
        throw err;
    }
}
function readExtensionInfoSync(extensionPath, bundled, fallback = {}) {
    const finalPath = extensionPath.replace(/\.installing$/, '');
    try {
        const info = fs.readFileSync(path.join(extensionPath, 'info.json'), { encoding: 'utf-8' });
        const data = JSON.parse(info);
        const id = path.basename(finalPath);
        return {
            id,
            info: applyExtensionInfo(id, bundled, data, fallback),
        };
    }
    catch (err) {
        (0, log_1.log)('warn', 'Failed to read extension info', { extensionPath, error: err.message });
        const id = path.basename(finalPath);
        return {
            id,
            info: applyExtensionInfo(id, bundled, {}, fallback),
        };
    }
}
function fetchAvailableExtensions(forceCache, forceDownload = false) {
    if ((caches.__availableExtensions === undefined) || forceCache || forceDownload) {
        caches.__availableExtensions = doFetchAvailableExtensions(forceDownload);
    }
    return caches.__availableExtensions;
}
function downloadExtensionList(cachePath) {
    (0, log_1.log)('info', '📥 downloading extension list', { url: EXTENSION_URL });
    return Promise.resolve((0, network_1.jsonRequest)(EXTENSION_URL))
        .then(manifest => {
        (0, log_1.log)('debug', '📋 extension list received');
        const extensions = manifest.extensions.filter(ext => ext.name !== undefined);
        return (0, fsAtomic_1.writeFileAtomic)(cachePath, JSON.stringify({ extensions }, undefined, 2))
            .then(() => extensions);
    })
        .catch(err => {
        (0, log_1.log)('error', '❌ failed to download extension list', err);
        return [];
    });
}
function doFetchAvailableExtensions(forceDownload) {
    const cachePath = path.join((0, getVortexPath_1.default)('temp'), EXTENSION_FILENAME);
    let time = new Date();
    const checkCache = forceDownload
        ? Promise.resolve(true)
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
                    return Promise.reject(new CustomErrors_1.DataInvalid('Extension cache invalid, please try again later'));
                }
            });
    })
        .catch(err => {
        if (err.code === 'ENOENT') {
            (0, log_1.log)('info', '📋 extension list missing, will update');
            return downloadExtensionList(cachePath);
        }
    })
        .catch(err => {
        (0, log_1.log)('error', '❌ failed to fetch list of extensions', err);
        return Promise.resolve([]);
    })
        .then((extensions) => (0, promise_helpers_1.promiseFilter)(extensions, (ext) => Promise.resolve(ext.description !== undefined))
        .then(filtered => ({ time, extensions: filtered })));
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
        return Promise.resolve(false);
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
            return Promise.reject(new CustomErrors_1.ProcessCanceled('No download found'));
        }
        api.store.dispatch((0, state_1.setDownloadModInfo)(dlIds[0], 'internal', true));
        download = (0, storeHelper_1.getSafe)(state, ['persistent', 'downloads', 'files', dlIds[0]], undefined);
        if (download === undefined) {
            // Dismiss the activity notification
            api.dismissNotification(notificationId);
            return Promise.reject(new Error('Download not found'));
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
        return Promise.resolve(true);
    })
        .catch(err => {
        if (err instanceof CustomErrors_1.UserCanceled) {
            // Dismiss the activity notification
            api.dismissNotification(notificationId);
            return Promise.resolve(null);
        }
        else {
            return Promise.reject(err);
        }
    })
        .catch(err => {
        if (err instanceof CustomErrors_1.ProcessCanceled) {
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
            return Promise.resolve(false);
        }
        else {
            return Promise.reject(err);
        }
    })
        .catch(err => err instanceof CustomErrors_1.ServiceTemporarilyUnavailable ? Promise.resolve(false).then(() => {
        // Dismiss the activity notification
        api.dismissNotification(notificationId);
        (0, log_1.log)('warn', '⚠️ Failed to download from github', { message: err.message });
        return false;
    }) : Promise.reject(err))
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
        return Promise.resolve(false);
    });
}
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
            return Promise.reject(new Error('unavailable nexus extension'));
        }
    }
    (0, log_1.log)('debug', '📥 download from nexus', archiveFileName(ext));
    return api.emitAndAwait('nexus-download', constants_1.SITE_ID, ext.modId, ext.fileId, archiveFileName(ext), false);
}
function downloadGithubRelease(api, ext) {
    return new Promise((resolve, reject) => {
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
        .catch(err => {
        if (err instanceof DownloadManager_1.AlreadyDownloaded) {
            const state = api.getState();
            const downloads = state.persistent.downloads.files;
            const dlId = Object.keys(downloads).find(iter => downloads[iter].localPath === err.fileName);
            return Promise.resolve([dlId]);
        }
        else {
            return Promise.reject(err);
        }
    });
}
function downloadFile(url, outputPath) {
    // Import the macOS compatibility function
    const { interceptDownloadURLForMacOS } = require('../../util/macOSGameCompatibility');
    // Apply macOS URL interception
    const interceptedUrl = interceptDownloadURLForMacOS(url);
    // Retry raw request with backoff for transient errors (more generous on macOS)
    return retryNetworkOperation(() => Promise.resolve((0, network_1.rawRequest)(interceptedUrl))
        .then((res) => Buffer.isBuffer(res) ? res : Buffer.from(res)), 6, 300, 4000, `downloadFile ${outputPath}`, (error) => {
        const code = (error === null || error === void 0 ? void 0 : error.code) || (error === null || error === void 0 ? void 0 : error.statusCode) || (error === null || error === void 0 ? void 0 : error.status);
        const msg = (error === null || error === void 0 ? void 0 : error.message) || '';
        return (['ENOTFOUND', 'ETIMEDOUT', 'ESOCKETTIMEDOUT', 'ECONNRESET', 'ECONNABORTED', 'EAI_AGAIN']
            .includes(code)
            || (typeof code === 'number' && (code === 429 || (code >= 500 && code < 600)))
            || /timeout/i.test(msg)
            || /temporarily unavailable/i.test(msg));
    }).then((data) => fs.writeFileAsync(outputPath, data));
}
function downloadGithubRawRecursive(repo, source, destination) {
    const apiUrl = githubApiUrl(repo, 'contents', source) + '?ref=' + GAMES_BRANCH;
    // Retry github api listing with backoff for robustness
    return retryNetworkOperation(() => Promise.resolve((0, network_1.rawRequest)(apiUrl, { encoding: 'utf8' }))
        .then((res) => (typeof res === 'string') ? res : res.toString('utf8')), 6, 300, 4000, `github contents ${repo}/${source}`, (error) => {
        const code = (error === null || error === void 0 ? void 0 : error.code) || (error === null || error === void 0 ? void 0 : error.statusCode) || (error === null || error === void 0 ? void 0 : error.status);
        const msg = (error === null || error === void 0 ? void 0 : error.message) || '';
        return (['ENOTFOUND', 'ETIMEDOUT', 'ESOCKETTIMEDOUT', 'ECONNRESET', 'ECONNABORTED', 'EAI_AGAIN']
            .includes(code)
            || (typeof code === 'number' && (code === 429 || (code >= 500 && code < 600)))
            || /timeout/i.test(msg)
            || /temporarily unavailable/i.test(msg));
    })
        .then((content) => {
        const data = JSON.parse(content);
        if (!Array.isArray(data)) {
            if ((typeof (data) === 'object') && (data.message !== undefined)) {
                return Promise.reject(new CustomErrors_1.ServiceTemporarilyUnavailable(data.message));
            }
            else {
                (0, log_1.log)('info', '⚠️ unexpected response from github', content);
                return Promise.reject(new Error('Unexpected response from github (see log file)'));
            }
        }
        const repoFiles = data.filter(iter => iter.type === 'file').map(iter => iter.name);
        const repoDirs = data.filter(iter => iter.type === 'dir').map(iter => iter.name);
        return (0, promise_helpers_1.promiseMap)(repoFiles, fileName => downloadFile(githubRawUrl(repo, GAMES_BRANCH, `${source}/${fileName}`), path.join(destination, fileName)))
            .then(() => (0, promise_helpers_1.promiseMap)(repoDirs, fileName => {
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
        : Promise.resolve();
    return cleanProm.then(() => fs.withTmpDir((tmpPath) => {
        const archivePath = path.join(tmpPath, archiveName);
        return downloadGithubRawRecursive(ext.github, ext.githubRawPath, tmpPath)
            .then(() => {
            return fs.readdirAsync(tmpPath);
        })
            .then((repoFiles) => {
            return (0, archive_1.addToArchive)(archivePath, repoFiles.map(fileName => path.join(tmpPath, fileName)), { ssw: true });
        })
            .then(() => fs.moveAsync(archivePath, path.join(downloadPath, archiveName)))
            .then(() => {
            const archiveId = (0, shortid_1.generate)();
            api.store.dispatch((0, state_1.addLocalDownload)(archiveId, constants_1.SITE_ID, archiveName, 0));
            return [archiveId];
        });
    }));
}
function readExtensibleDir(extType, bundledPath, customPath) {
    const readBaseDir = (baseName) => {
        return fs.readdirAsync(baseName)
            .then((files) => (0, promise_helpers_1.promiseFilter)(files, (name) => fs.statAsync(path.join(baseName, name))
            .then(stats => stats.isDirectory())
            .catch(() => false)))
            .then((filteredFiles) => filteredFiles.map((name) => path.join(baseName, name)))
            .catch(err => { if (err.code === 'ENOENT') {
            return Promise.resolve([]);
        }
        else {
            return Promise.reject(err);
        } });
    };
    // Read user extensions directory
    const userExtensionsPromise = readBaseDir(customPath);
    return readExtensions(false)
        .then(extensions => {
        const extDirs = Object.keys(extensions)
            .filter(extId => extensions[extId].type === extType)
            .map(extId => extensions[extId].path);
        // Use Promise.all to wait for all directory reads
        const promises = [
            readBaseDir(bundledPath),
            ...extDirs.map(extPath => readBaseDir(extPath)),
            userExtensionsPromise
        ];
        return Promise.all(promises);
    })
        .then((results) => {
        // Flatten the results array
        const allPaths = [].concat(...results);
        return allPaths;
    });
}
