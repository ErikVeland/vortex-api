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
exports.isExtSame = isExtSame;
/* eslint-disable */
const app_1 = require("../actions/app");
const notifications_1 = require("../actions/notifications");
const notificationSettings_1 = require("../actions/notificationSettings");
const session_1 = require("../actions/session");
const actions_1 = require("../extensions/extension_manager/actions");
const archives_1 = require("./archives");
const constants_1 = require("./constants");
const CustomErrors_1 = require("./CustomErrors");
const errorHandling_1 = require("./errorHandling");
const getVortexPath_1 = __importDefault(require("./getVortexPath"));
const i18n_1 = require("./i18n");
const lazyRequire_1 = __importDefault(require("./lazyRequire"));
const log_1 = require("./log");
const message_1 = require("./message");
const reduxSanity_1 = require("./reduxSanity");
const ReduxWatcher_1 = __importDefault(require("./ReduxWatcher"));
const runElevatedCustomTool_1 = __importDefault(require("./runElevatedCustomTool"));
const activeGameId_1 = require("../extensions/profile_management/activeGameId");
const storeHelper_1 = require("./storeHelper");
const StyleManager_1 = __importDefault(require("./StyleManager"));
const util_1 = require("./util");
const bluebird_migration_helpers_local_1 = require("./bluebird-migration-helpers.local");
const child_process_1 = require("child_process");
const electron_1 = require("electron");
const events_1 = require("events");
const fs = __importStar(require("fs-extra"));
const fuzz = __importStar(require("fuzzball"));
const JsonSocket = require("json-socket");
const _ = __importStar(require("lodash"));
const modmeta = (0, lazyRequire_1.default)(() => require('modmeta-db'));
const net = __importStar(require("net"));
const path = __importStar(require("path"));
const semver = __importStar(require("semver"));
const shortid_1 = require("shortid");
const string_template_1 = __importDefault(require("string-template"));
const application_1 = require("./application");
const electronRemote_1 = __importStar(require("./electronRemote"));
const constants_2 = require("../constants");
const vortexmt_1 = require("vortexmt");
const actions_2 = require("../actions");
function isExtSame(installed, remote) {
    if (installed.modId !== undefined) {
        return installed.modId === remote.modId;
    }
    return installed.name === remote.name;
}
const winapi = (0, lazyRequire_1.default)(() => require('vortex-run'));
const ERROR_OUTPUT_CUTOFF = 3;
function selfCL(userDataPath) {
    let execPath = process.execPath;
    // make it work when using the development version
    if (execPath.endsWith('electron.exe')) {
        execPath = path.join((0, getVortexPath_1.default)('package'), 'vortex.bat');
    }
    const args = [];
    /*
    TODO: This is necessary for downloads to multiple instances to work correctly but
      it doesn't work until https://github.com/electron/electron/issues/18397 is fixed

    if (userDataPath !== undefined) {
      args.push('--user-data', userDataPath);
    }
    */
    args.push('-d');
    return [execPath, args];
}
const setSelfAsProtocolClient = (0, electronRemote_1.makeRemoteCallSync)('set-as-default-protocol-client', (electron, contents, protocol, udPath) => {
    const [execPath, args] = selfCL(udPath);
    electron.app.setAsDefaultProtocolClient(protocol, execPath, args);
});
const isSelfProtocolClient = (0, electronRemote_1.makeRemoteCallSync)('is-self-protocol-client', (electron, contents, protocol, udPath) => {
    const [execPath, args] = selfCL(udPath);
    return electron.app.isDefaultProtocolClient(protocol, execPath, args);
});
const removeSelfAsProtocolClient = (0, electronRemote_1.makeRemoteCallSync)('remove-as-default-protocol-client', (electron, contents, protocol, udPath) => {
    const [execPath, args] = selfCL(udPath);
    electron.app.removeAsDefaultProtocolClient(protocol, execPath, args);
});
const showOpenDialog = (0, electronRemote_1.default)('show-open-dialog', (electron, contents, options) => {
    var _a, _b;
    let window = null;
    try {
        window = (_b = (_a = electron.BrowserWindow) === null || _a === void 0 ? void 0 : _a.fromWebContents) === null || _b === void 0 ? void 0 : _b.call(_a, contents);
    }
    catch (err) {
        // nop
    }
    // Enhance options for macOS native file picker integration
    const enhancedOptions = Object.assign(Object.assign(Object.assign({}, options), { 
        // Enable macOS-specific properties for better native integration
        properties: [
            ...(options.properties || []),
            // Add macOS-specific properties if running on macOS
            ...(process.platform === 'darwin' ? ['treatPackageAsDirectory'] : [])
        ] }), (process.platform === 'darwin' ? {
        // Enable the macOS-native file picker with better integration
        securityScopedBookmarks: true
    } : {}));
    return electron.dialog.showOpenDialog(window, enhancedOptions);
});
const showSaveDialog = (0, electronRemote_1.default)('show-save-dialog', (electron, contents, options) => {
    var _a, _b;
    let window = null;
    try {
        window = (_b = (_a = electron.BrowserWindow) === null || _a === void 0 ? void 0 : _a.fromWebContents) === null || _b === void 0 ? void 0 : _b.call(_a, contents);
    }
    catch (err) {
        // nop
    }
    // Enhance options for macOS native file picker integration
    const enhancedOptions = Object.assign(Object.assign({}, options), (process.platform === 'darwin' ? {
        // Enable the macOS-native file picker with better integration
        securityScopedBookmarks: true
    } : {}));
    return electron.dialog.showSaveDialog(window, enhancedOptions);
});
const appExit = (0, electronRemote_1.makeRemoteCallSync)('exit-application', (electron, contents, exitCode) => {
    electron.app.exit(exitCode);
});
const showErrorBox = (0, electronRemote_1.default)('show-error-box', (electron, contents, title, content) => {
    electron.dialog.showErrorBox(title, content);
    return undefined;
});
const showMessageBox = (0, electronRemote_1.default)('show-message-box', (electron, contents, options) => {
    var _a, _b;
    let window = null;
    try {
        window = (_b = (_a = electron.BrowserWindow) === null || _a === void 0 ? void 0 : _a.fromWebContents) === null || _b === void 0 ? void 0 : _b.call(_a, contents);
    }
    catch (err) {
        // nop
    }
    return electron.dialog.showMessageBox(window, options);
});
function applyVariables(arg, variables) {
    return (0, string_template_1.default)(arg, variables);
}
class ExtEventHandler extends events_1.EventEmitter {
    constructor(wrappee, extension) {
        super();
        this.mFuncMap = new Map();
        this.mWrappee = wrappee;
        this.mExtension = extension;
    }
    addListener(event, listener) {
        this.mWrappee.addListener(event, this.makeWrapped(event, listener));
        return this;
    }
    on(event, listener) {
        const stack = (new Error()).stack;
        return this.addListener(event, listener);
    }
    once(event, listener) {
        this.mWrappee.once(event, this.makeOnceWrapped(event, listener));
        return this;
    }
    prependListener(event, listener) {
        this.mWrappee.prependListener(event, this.makeWrapped(event, listener));
        return this;
    }
    prependOnceListener(event, listener) {
        this.mWrappee.prependOnceListener(event, this.makeOnceWrapped(event, listener));
        return this;
    }
    removeListener(event, listener) {
        if (this.mFuncMap.has(event)) {
            const listeners = this.mFuncMap.get(event);
            const idx = listeners.findIndex(iter => iter.orig === listener);
            if (idx !== -1) {
                this.mWrappee.removeListener(event, listeners[idx].wrapped);
                listeners.splice(idx, 1);
            }
        }
        return this;
    }
    off(event, listener) {
        return this.removeListener(event, listener);
    }
    removeAllListeners(event) {
        this.mWrappee.removeAllListeners(event);
        return this;
    }
    setMaxListeners(n) {
        this.mWrappee.setMaxListeners(n);
        return this;
    }
    getMaxListeners() {
        return this.mWrappee.getMaxListeners();
    }
    // tslint:disable-next-line:ban-types
    listeners(event) {
        return this.mWrappee.listeners(event);
    }
    // tslint:disable-next-line:ban-types
    rawListeners(event) {
        return this.mWrappee.rawListeners(event);
    }
    emit(event, ...args) {
        return this.mWrappee.emit(event, ...args);
    }
    eventNames() {
        return this.mWrappee.eventNames();
    }
    listenerCount(type) {
        return this.mWrappee.listenerCount(type);
    }
    funcMap(event) {
        if (!this.mFuncMap.has(event)) {
            this.mFuncMap.set(event, []);
        }
        return this.mFuncMap.get(event);
    }
    makeWrapped(event, listener) {
        const wrapped = (0, util_1.wrapExtCBSync)(listener, convertExtInfo(this.mExtension));
        this.funcMap(event).push({ orig: listener, wrapped });
        return wrapped;
    }
    makeOnceWrapped(event, listener) {
        const wrapped = (0, util_1.wrapExtCBSync)((...args) => {
            listener(...args);
            this.removeListener(event, listener);
        }, convertExtInfo(this.mExtension));
        this.funcMap(event).push({ orig: listener, wrapped });
        return wrapped;
    }
}
function convertExtInfo(ext) {
    var _a, _b, _c, _d;
    if (ext === undefined) {
        return undefined;
    }
    return {
        name: (_b = (_a = ext.info) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : ext.name,
        namespace: ext.namespace,
        path: ext.path,
        dynamic: ext.dynamic,
        official: (_d = (_c = ext.info) === null || _c === void 0 ? void 0 : _c.bundled) !== null && _d !== void 0 ? _d : true,
    };
}
class APIProxyHandler {
    constructor(extension, enable, events) {
        this.mExtension = extension;
        this.mEnabled = enable;
        this.mEvents = new ExtEventHandler(events, this.mExtension);
    }
    enable() {
        this.mEnabled = true;
    }
    get(target, key) {
        if (key === 'extension') {
            return this.mExtension;
        }
        else if (key === 'translate') {
            return target[key];
        }
        else if (key === 'onAsync') {
            return (eventName, listener) => target['onAsync'](eventName, listener, convertExtInfo(this.mExtension));
        }
        else if (key === 'onStateChange') {
            return (statePath, callback) => target[key](statePath, callback, this.mExtension);
        }
        else if (key === 'events') {
            return this.mEvents;
        }
        else if (key === 'laterT') {
            return (input, options) => new i18n_1.TString(input, options, this.mExtension.namespace);
        }
        else if (key === 'NAMESPACE') {
            return this.mExtension.namespace;
        }
        if (!this.mEnabled) {
            throw new Error('extension uses api in init function');
        }
        return target[key];
    }
}
class APIProxyCreator {
    constructor(extension, events) {
        this.mAPIEnabled = false;
        this.mExtension = extension;
        this.mEvents = events;
    }
    enableAPI() {
        this.mAPIEnabled = true;
        if (this.mProxyHandler !== undefined) {
            this.mProxyHandler.enable();
        }
    }
    get(target, key) {
        if (key === 'api') {
            if (this.mProxy === undefined) {
                this.mProxyHandler = new APIProxyHandler(this.mExtension, this.mAPIEnabled, this.mEvents);
                this.mProxy = new Proxy(target[key], this.mProxyHandler);
            }
            return this.mProxy;
        }
        else {
            return target[key];
        }
    }
}
class ContextProxyHandler {
    constructor(context) {
        this.mMayRegister = true;
        this.findExt = (id, allExtensions) => {
            return allExtensions.find(ext => {
                var _a, _b;
                return (((_a = ext.info) === null || _a === void 0 ? void 0 : _a.name) === id)
                    || (((_b = ext.info) === null || _b === void 0 ? void 0 : _b.id) === id)
                    || (ext.name === id);
            });
        };
        this.mContext = context;
        this.mInitCalls = [];
        this.mApiAdditions = [];
        // TODO: check if this is necessary. Ususally the arrow lambda should
        //   bind this automatically
        // tslint:disable-next-line:no-this-assignment
        const that = this;
        this.mOptional = new Proxy({}, {
            get(target, key) {
                return (...args) => {
                    if (!that.mMayRegister) {
                        (0, log_1.log)('warn', 'extension tries to use register call outside init function', {
                            extension: this.mCurrentExtension,
                            call: key,
                        });
                        return;
                    }
                    that.mInitCalls.push({
                        extension: that.mCurrentExtension,
                        extensionPath: that.mCurrentPath,
                        key: key.toString(),
                        arguments: args,
                        optional: true,
                    });
                };
            },
        });
    }
    endRegistration() {
        this.mMayRegister = false;
    }
    /**
     * returns the parameters of calls to the specified function
     */
    getCalls(name) {
        return this.mInitCalls.filter((call) => call.key === name);
    }
    dropCalls(extNames) {
        this.mInitCalls = this.mInitCalls.filter(iter => iter.extension !== extNames);
    }
    invokeAdditions(extensions) {
        this.mApiAdditions.forEach((addition) => {
            this.getCalls(addition.key).forEach(call => {
                const ext = extensions.find(iter => iter.name === call.extension);
                const extInfo = convertExtInfo(ext);
                addition.callback(...call.arguments, call.extensionPath, extInfo);
            });
        });
    }
    /**
     * Retrieve the map of optional extensions
     *  Each optional requireExtension call is added against the id of the extension that requires it.
     */
    getOptionalExtensions(allExtensions) {
        const optionalRequireCalls = this.getCalls('requireExtension').filter(iter => iter.arguments.length > 2 && iter.arguments[2] === true);
        const missingOptionals = optionalRequireCalls.reduce((acc, iter) => {
            const callingExtensionKey = iter.extension;
            const requiredKey = iter.arguments[0];
            const ext = this.findExt(requiredKey, allExtensions);
            if (ext === undefined) {
                const optional = { id: requiredKey, args: iter.arguments, extensionPath: iter.extensionPath };
                acc = Object.assign(Object.assign({}, acc), { [callingExtensionKey]: [].concat(acc[callingExtensionKey] || [], optional) });
            }
            return acc;
        }, {});
        return missingOptionals;
    }
    /**
     * remove all init calls from incompatible extensions
     */
    unloadIncompatible(furtherAPIs, allExtensions) {
        const addAPIs = this.mApiAdditions.map((addition) => addition.key);
        const fullAPI = new Set(Array.from(furtherAPIs).concat(this.staticAPIs, addAPIs));
        const incompatibleExtensions = {};
        this.mInitCalls.filter((call) => !call.optional && !fullAPI.has(call.key))
            .forEach((call) => {
            (0, log_1.log)('debug', 'unsupported api call', { extension: call.extension, api: call.key });
            (0, util_1.setdefault)(incompatibleExtensions, call.extension, [])
                .push({ id: 'unsupported-api' });
        });
        const testValid = (extId, requiredId, version, optional) => {
            var _a;
            if (!optional) {
                const req = this.findExt(requiredId, allExtensions);
                if (req === undefined) {
                    (0, util_1.setdefault)(incompatibleExtensions, extId, []).push({ id: 'dependency', args: { dependencyId: requiredId } });
                }
                else if ((version !== undefined) && !semver.satisfies((_a = req.info) === null || _a === void 0 ? void 0 : _a.version, version)) {
                    (0, util_1.setdefault)(incompatibleExtensions, extId, []).push({ id: 'dependency', args: { dependencyId: requiredId, version } });
                }
            }
        };
        this.getCalls('requireExtension').forEach(call => {
            testValid(call.extension, ...call.arguments);
        });
        this.getCalls('requireVersion').forEach(call => {
            if ((process.env.NODE_ENV !== 'development')
                && !semver.satisfies((0, application_1.getApplication)().version, call.arguments[0], { includePrerelease: true })) {
                (0, util_1.setdefault)(incompatibleExtensions, call.extension, []).push({ id: 'unsupported-version' });
            }
        });
        if (Object.keys(incompatibleExtensions).length > 0) {
            (0, log_1.log)('info', 'extensions ignored for using unsupported api', { extensions: Object.keys(incompatibleExtensions).join(', ') });
            this.mInitCalls = this.mInitCalls.filter((call) => incompatibleExtensions[call.extension] === undefined);
        }
        else {
            if (process.type === 'renderer') {
                (0, log_1.log)('debug', 'all extensions compatible');
            }
        }
        return incompatibleExtensions;
    }
    /**
     * change the extension name currently being loaded
     */
    setExtension(extension, extensionPath) {
        this.mCurrentExtension = extension;
        this.mCurrentPath = extensionPath;
    }
    has(target, key) {
        return true;
    }
    get(target, key) {
        if (key in this.mContext) {
            return this.mContext[key];
        }
        else if (key === 'optional') {
            return this.mOptional;
        }
        return (key in this.mContext)
            ? this.mContext[key]
            : (...args) => {
                if (!this.mMayRegister) {
                    (0, log_1.log)('warn', 'extension tries to use register call outside init function', {
                        extension: this.mCurrentExtension,
                        call: key,
                    });
                    return;
                }
                this.mInitCalls.push({
                    extension: this.mCurrentExtension,
                    extensionPath: this.mCurrentPath,
                    key: key.toString(),
                    arguments: args,
                    optional: false,
                });
            };
    }
    set(target, key, value, receiver) {
        this.mApiAdditions.push({
            key: key.toString(),
            callback: value,
        });
        return true;
    }
    get staticAPIs() {
        // trick so we get a compile time error from tsc if this object doesn't
        // match the interface
        const dummy = {
            registerMainPage: undefined,
            registerDashlet: undefined,
            registerDialog: undefined,
            registerOverlay: undefined,
            registerSettings: undefined,
            registerAction: undefined,
            registerControlWrapper: undefined,
            registerBanner: undefined,
            registerDeploymentMethod: undefined,
            registerInstaller: undefined,
            registerFooter: undefined,
            registerToDo: undefined,
            registerModSource: undefined,
            registerReducer: undefined,
            registerPersistor: undefined,
            registerSettingsHive: undefined,
            registerTableAttribute: undefined,
            registerTest: undefined,
            registerArchiveType: undefined,
            registerGame: undefined,
            registerGameStub: undefined,
            registerGameStore: undefined,
            registerGameInfoProvider: undefined,
            registerAttributeExtractor: undefined,
            registerModType: undefined,
            registerActionCheck: undefined,
            registerMerge: undefined,
            registerInterpreter: undefined,
            registerStartHook: undefined,
            registerMigration: undefined,
            registerToolVariables: undefined,
            registerLoadOrderPage: undefined,
            registerLoadOrder: undefined,
            registerGameSpecificCollectionsData: undefined,
            registerHistoryStack: undefined,
            registerAPI: undefined,
            requireVersion: undefined,
            requireExtension: undefined,
            api: undefined,
            once: undefined,
            onceMain: undefined,
            optional: undefined,
        };
        return Object.keys(dummy);
    }
}
class EventProxy extends events_1.EventEmitter {
    constructor(target) {
        super();
        this.mRemoteCallbacks = {};
        this.mRemotePromises = {};
        this.mTarget = target;
        // any listener attached to this proxy will be attached to
        // the event handler in the target process as well so those events
        // get relayed to here
        this.on('newListener', (event, listener) => {
            // TODO: workaround: instead of two parameters I get one array with two elements.
            //   this differs from the documentation of newListener so I assume it'a a bug?
            if (Array.isArray(event)) {
                event = event[0];
            }
            this.mTarget.send('register-relay-listener', event);
        });
        // TODO: support removeListener
        electron_1.ipcMain.on('relay-event', (event, eventName, ...args) => {
            if (event.sender === this.mTarget) {
                super.emit(eventName, ...args);
            }
        });
        electron_1.ipcMain.on('relay-cb', (event, id, ...args) => {
            const cb = this.mRemoteCallbacks[id];
            if (cb !== undefined) {
                const newArgs = args.map(arg => {
                    if (arg.__promise === undefined) {
                        return arg;
                    }
                    else {
                        return new Promise((resolve, reject) => {
                            this.mRemotePromises[arg.__promise] = { resolve, reject };
                        });
                    }
                });
                cb(...newArgs);
                delete this.mRemoteCallbacks[id];
            }
        });
        electron_1.ipcMain.on('relay-cb-resolve', (event, id, res) => {
            const prom = this.mRemotePromises[id];
            if (prom !== undefined) {
                prom.resolve(res);
                delete this.mRemotePromises[id];
            }
        });
        electron_1.ipcMain.on('relay-cb-reject', (event, id, err) => {
            const prom = this.mRemotePromises[id];
            if (prom !== undefined) {
                prom.reject(err);
                delete this.mRemotePromises[id];
            }
        });
    }
    emit(eventName, ...args) {
        if (!super.emit(eventName, args)
            && (this.mTarget !== undefined)
            && !this.mTarget.isDestroyed()) {
            // relay all events this process didn't handle itself to the connected
            // process
            if (typeof (args[args.length - 1]) === 'function') {
                const id = (0, shortid_1.generate)();
                this.mRemoteCallbacks[id] = args[args.length - 1];
                const newArgs = [].concat(args.slice(0, args.length - 1), id);
                this.mTarget.send('relay-event-with-cb', eventName, ...newArgs);
            }
            else {
                this.mTarget.send('relay-event', eventName, ...args);
            }
            return true;
        }
        return false;
    }
}
const UNDEFINED = {};
function convertMD5Result(input) {
    return input;
}
/**
 * interface to extensions. This loads extensions and provides the api extensions
 * use
 *
 * @class ExtensionManager
 */
class ExtensionManager {
    static registerUIAPI(name) {
        ExtensionManager.sUIAPIs.add(name);
    }
    static getExtensionPaths() {
        // only the first extension with a specific name is loaded, so
        // load the bundled ones last so a user can replace them
        return [
            { path: path.join((0, getVortexPath_1.default)('userData'), 'plugins'), bundled: false },
            { path: (0, getVortexPath_1.default)('bundledPlugins'), bundled: true },
        ];
    }
    constructor(initStore, eventEmitter) {
        this.mWatches = {};
        this.mProtocolHandlers = {};
        this.mRepositoryLookup = {};
        this.mModDBCache = {};
        this.mLoadFailures = {};
        this.mOptionalExtensions = {};
        this.mLoadingCallbacks = [];
        this.mProgrammaticMetaServers = {};
        this.mForceDBReconnect = false;
        this.mOutdated = [];
        this.mFailedWatchers = new Set();
        // the idea behind this was that we might want to support things like typescript
        // or coffescript directly but that would require us shipping the corresponding compilers
        this.mExtensionFormats = ['index.js', 'dist/index.js'];
        this.pendingGameRegistrations = [];
        this.watcherError = (err, selector) => {
            const id = selector.join('.');
            if (!this.mFailedWatchers.has(id)) {
                (0, log_1.log)('warn', 'Failed to trigger state listener', {
                    error: err.message,
                    selector: JSON.stringify(selector),
                });
                this.mFailedWatchers.add(id);
            }
        };
        this.getModDB = () => {
            const gameMode = (0, activeGameId_1.activeGameId)(this.mApi.store.getState());
            const currentKey = (0, storeHelper_1.getSafe)(this.mApi.store.getState(), ['confidential', 'account', 'nexus', 'APIKey'], '');
            let init;
            let onDone;
            if (this.mModDBPromise === undefined) {
                this.mModDBPromise = new Promise((resolve, reject) => {
                    onDone = () => {
                        this.mModDBPromise = undefined;
                        resolve();
                    };
                });
                init = Promise.resolve();
            }
            else {
                init = this.mModDBPromise;
            }
            return init.then(() => {
                // reset the moddb if necessary so new settings get used
                if ((this.mModDB === undefined)
                    || this.mForceDBReconnect
                    || (gameMode !== this.mModDBGame)
                    || (currentKey !== this.mModDBAPIKey)) {
                    this.mForceDBReconnect = false;
                    if (this.mModDB !== undefined) {
                        return this.mModDB.close()
                            .then(() => this.mModDB = undefined);
                    }
                }
                return Promise.resolve();
            })
                .then(() => (this.mModDB !== undefined)
                ? Promise.resolve()
                : this.connectMetaDB(gameMode, currentKey)
                    .then(modDB => {
                    this.mModDB = modDB;
                    this.mModDBGame = gameMode;
                    this.mModDBAPIKey = currentKey;
                    (0, log_1.log)('debug', 'initialised');
                }))
                .then(() => this.mModDB)
                .finally(() => {
                if (onDone !== undefined) {
                    onDone();
                }
            });
            // TODO: the fallback to nexus api should somehow be set up in nexus_integration, not here
        };
        this.stateChangeHandler = (watchPath, callback, ext) => {
            if (!(0, util_1.isFunction)(callback)) {
                // TODO we should be throwing an exception here but this didn't fail in the past and I don't
                //   want to break previously ok extensions in a minor update
                // throw new Error('attempt to register invalid change handler');
                (0, log_1.log)('error', 'attempt to register invalid change handler', { stack: (new Error()).stack });
                return;
            }
            const stackErr = new Error();
            // have to initialize to a value that we _know_ is never set by the user.
            let lastValue = UNDEFINED;
            const key = watchPath.join('.');
            // TODO: this code makes using the ReduxWatcher pointless and looking at the
            //   code I would now disagree with the assessment that it may retrigger
            //   without an actual change. otoh I didn't add this for no reason...
            const changeHandler = ({ prevValue, currentValue }) => {
                // redux-watch may trigger even if no change occurred so we have to
                // do our own check, otherwise we could end up in an endless loop
                // if the callback causes redux-watch to trigger again without change
                if ((currentValue === lastValue) && (lastValue !== UNDEFINED)) {
                    return;
                }
                lastValue = currentValue;
                this.mWatches[key].forEach(cb => {
                    try {
                        cb(prevValue, currentValue);
                    }
                    catch (err) {
                        (0, log_1.log)('error', 'state change handler failed', {
                            message: err.message,
                            stack1: err.stack,
                            stack2: stackErr.stack,
                            key,
                        });
                    }
                });
            };
            if (this.mWatches[key] === undefined) {
                this.mWatches[key] = [];
                this.mReduxWatcher.on(watchPath, changeHandler);
            }
            this.mWatches[key].push((0, util_1.wrapExtCBSync)(callback, convertExtInfo(ext)));
        };
        this.showErrorBox = (message, details) => {
            if (typeof (details) === 'string') {
                showErrorBox(message, details);
            }
            else {
                showErrorBox(message, details.message);
            }
        };
        this.commandLineUserData = () => { var _a; return (_a = this.mApi.getState().session.base.commandLine) === null || _a === void 0 ? void 0 : _a.userData; };
        this.registerProtocol = (protocol, def, callback) => {
            (0, log_1.log)('info', 'register protocol', { protocol });
            const haveToRegister = def && !isSelfProtocolClient(protocol, this.commandLineUserData());
            if (def) {
                setSelfAsProtocolClient(protocol, this.commandLineUserData());
            }
            this.mProtocolHandlers[protocol] = callback;
            return haveToRegister;
        };
        this.registerRepositoryLookup = (repository, preferOverMD5, func) => {
            this.mRepositoryLookup[repository] = { preferOverMD5, func };
        };
        this.registerArchiveHandler = (extension, handler) => {
            this.mArchiveHandlers[extension] = handler;
        };
        this.deregisterProtocol = (protocol) => {
            (0, log_1.log)('info', 'deregister protocol');
            removeSelfAsProtocolClient(protocol, this.commandLineUserData());
        };
        this.lookupModReference = (reference, options) => {
            if (options === undefined) {
                options = {};
            }
            // Spammy debug log
            // log('debug', 'lookup mod reference', { reference });
            let lookup;
            let preMD5 = Promise.resolve([]);
            if (reference.repo !== undefined) {
                lookup = this.mRepositoryLookup[reference.repo.repository];
            }
            if ((lookup !== undefined) && lookup.preferOverMD5) {
                preMD5 = lookup.func(reference.repo);
            }
            return preMD5.then((results) => {
                if (options.requireURL === true) {
                    results = results.filter(res => (0, util_1.truthy)(res.value.sourceURI));
                }
                if (results.length !== 0) {
                    return results;
                }
                else {
                    return this.getModDB()
                        .then(modDB => modDB.getByReference(reference))
                        .then((mods) => (0, bluebird_migration_helpers_local_1.promiseFilter)(mods, (mod) => __awaiter(this, void 0, void 0, function* () {
                        if (options.requireURL === true) {
                            return (0, util_1.truthy)(mod.value.sourceURI);
                        }
                        else {
                            return true;
                        }
                    })))
                        .then((filteredMods) => (0, bluebird_migration_helpers_local_1.promiseMap)(filteredMods, (mod) => __awaiter(this, void 0, void 0, function* () { return convertMD5Result(mod); })));
                }
            })
                .then((results) => {
                if (results.length !== 0) {
                    if (reference.logicalFileName !== undefined) {
                        const exactMatch = results.filter(iter => (iter.value.logicalFileName !== undefined)
                            && (iter.value.logicalFileName === reference.logicalFileName));
                        if (exactMatch.length > 0) {
                            return exactMatch;
                        }
                        else {
                            return results.sort((lhs, rhs) => fuzz.ratio(rhs.value.logicalFileName, reference.logicalFileName)
                                - fuzz.ratio(lhs.value.logicalFileName, reference.logicalFileName));
                        }
                    }
                    else {
                        return results;
                    }
                }
                else {
                    if ((lookup !== undefined) && !lookup.preferOverMD5) {
                        return lookup.func(reference.repo);
                    }
                    else {
                        return [];
                    }
                }
            });
        };
        this.lookupModMeta = (detail, ignoreCache) => {
            if ((detail.fileName !== undefined) && (detail.fileSize === 0)) {
                (0, log_1.log)('error', 'trying to calculate hash for an empty file', {
                    name: detail.fileName,
                    trace: (new Error()).stack,
                });
                const err = new CustomErrors_1.ProcessCanceled('trying to calculate hash for an empty file');
                err['fileName'] = detail.fileName;
                return Promise.reject(err);
            }
            if ((detail.fileMD5 === undefined) && (detail.filePath === undefined)) {
                return Promise.resolve([]);
            }
            let lookupId = this.modLookupId(detail);
            if ((this.mModDBCache[lookupId] !== undefined) && (ignoreCache !== true)) {
                return Promise.resolve(this.mModDBCache[lookupId]);
            }
            let fileMD5 = detail.fileMD5;
            let fileSize = detail.fileSize;
            if ((fileMD5 === undefined) && (detail.filePath === undefined)) {
                return Promise.resolve([]);
            }
            let promise;
            if (fileMD5 === undefined) {
                promise = this.genMd5Hash(detail.filePath).then((res) => {
                    fileMD5 = res.md5sum;
                    fileSize = res.numBytes;
                    lookupId = this.modLookupId(Object.assign(Object.assign({}, detail), { fileMD5,
                        fileSize }));
                    this.getApi().events.emit('filehash-calculated', detail.filePath, fileMD5, fileSize, detail.gameId);
                })
                    .catch(err => {
                    (0, log_1.log)('info', 'failed to calculate hash', { path: detail.filePath, error: err.message });
                    return Promise.resolve();
                });
            }
            else {
                promise = Promise.resolve();
            }
            // lookup id may be updated now
            if ((this.mModDBCache[lookupId] !== undefined) && (ignoreCache !== true)) {
                return Promise.resolve(this.mModDBCache[lookupId]);
            }
            return promise
                .then(() => this.getModDB())
                .then(modDB => (fileSize !== 0) && (fileMD5 !== undefined)
                ? modDB.lookup(detail.filePath, fileMD5, fileSize, detail.gameId)
                : [])
                .then((result) => {
                const resultSorter = this.makeSorter(detail);
                this.mModDBCache[lookupId] = result.sort(resultSorter);
                return Promise.resolve(this.mModDBCache[lookupId]);
            });
        };
        this.saveModMeta = (modInfo) => {
            const lookupId = this.modLookupId({
                fileMD5: modInfo.fileMD5,
                filePath: modInfo.fileName,
                fileSize: modInfo.fileSizeBytes,
                gameId: modInfo.gameId,
            });
            delete this.mModDBCache[lookupId];
            return this.getModDB()
                .then(modDB => {
                return new Promise((resolve, reject) => {
                    modDB.insert([modInfo]);
                    resolve();
                });
            });
        };
        this.genMd5Hash = (filePath, progressFunc) => {
            let lastProgress = 0;
            const progressHash = (progress) => {
                // Convert progress from 0-1 to bytes for compatibility with progressFunc
                if (progressFunc) {
                    try {
                        const stats = fs.statSync(filePath);
                        const total = stats.size;
                        const processed = Math.floor(progress * total);
                        progressFunc(processed, total);
                        if (lastProgress !== total) {
                            lastProgress = total;
                        }
                    }
                    catch (err) {
                        // If we can't get file stats, just call progressFunc with progress value
                        progressFunc(progress, 1);
                    }
                }
            };
            return (0, util_1.toPromise)(cb => (0, vortexmt_1.fileMD5)(filePath, cb))
                .catch(err => {
                // Add file path context to the error
                if (err instanceof Error) {
                    err.message = `Failed to calculate MD5 for ${filePath}: ${err.message}`;
                }
                return Promise.reject(err);
            })
                .then((result) => {
                this.mApi.store.dispatch((0, actions_2.setDownloadHashByFile)(path.basename(filePath), result, lastProgress));
                return Promise.resolve({
                    md5sum: result,
                    numBytes: lastProgress
                });
            });
        };
        this.openArchive = (archivePath, options, ext) => {
            if (this.mArchiveHandlers === undefined) {
                // lazy loading the archive handlers
                this.mArchiveHandlers = {};
                this.apply('registerArchiveType', this.registerArchiveHandler);
            }
            if (ext === undefined) {
                ext = path.extname(archivePath).substr(1);
            }
            const creator = this.mArchiveHandlers[ext];
            if (creator === undefined) {
                return Promise.reject(new CustomErrors_1.NotSupportedError());
            }
            return creator(archivePath, options || {})
                .then((handler) => Promise.resolve(new archives_1.Archive(handler)));
        };
        this.applyStartHooks = (input) => __awaiter(this, void 0, void 0, function* () {
            let updated = input;
            try {
                for (const hook of this.mStartHooks) {
                    updated = yield hook.hook(updated);
                }
                return updated;
            }
            catch (err) {
                if (err instanceof CustomErrors_1.UserCanceled) {
                    (0, log_1.log)('debug', 'start canceled by user');
                    throw err;
                }
                else if (err instanceof CustomErrors_1.ProcessCanceled) {
                    (0, log_1.log)('debug', 'hook canceled start', err.message);
                    throw err;
                }
                else {
                    (0, log_1.log)('error', 'hook failed', err);
                    throw err;
                }
            }
        });
        this.runExecutable = (executable, args, options) => {
            if (!(0, util_1.truthy)(executable)) {
                return Promise.reject(new CustomErrors_1.ProcessCanceled('Executable not set'));
            }
            const interpreter = this.mInterpreters[path.extname(executable).toLowerCase()];
            if (interpreter !== undefined) {
                try {
                    ({ executable, args, options } = interpreter({ executable, args, options }));
                }
                catch (err) {
                    return Promise.reject(err);
                }
            }
            const cwd = options.cwd || path.dirname(executable);
            // process.env is case insensitive (on windows at least?), but the spawn parameter isn't.
            // I think the key is called "Path" on windows but I'm not willing to bet this is consistent
            // across all language variants and versions
            const pathEnvName = Object.keys(process.env).find(key => key.toLowerCase() === 'path');
            const baseEnv = (0, util_1.filteredEnvironment)();
            const env = options.constrained === true
                ? {
                    // minimal environment for sandboxed execution
                    [pathEnvName]: process.env['PATH_ORIG'] || process.env['PATH'],
                }
                : Object.assign(Object.assign(Object.assign({}, baseEnv), { [pathEnvName]: process.env['PATH_ORIG'] || process.env['PATH'] }), options.env);
            // TODO: we might want to be much more restrictive in what keys we allow in environment variables,
            //   based on a quick google I could only find rules for Linux which appears to not allow the equal
            //   sign in keys either (which makes sense).
            //   On windows the empty string is the only thing I found that causes a problem though
            delete env[''];
            return this.applyStartHooks({ executable, args, options })
                .then(updatedParameters => {
                ({ executable, args, options } = updatedParameters);
                return Promise.resolve();
            })
                .then(() => new Promise((resolve, reject) => {
                var _a;
                const runExe = options.shell
                    ? `"${executable}"`
                    : executable;
                const spawnOptions = {
                    cwd,
                    env,
                    detached: options.constrained === true ? false : (options.detach !== undefined ? options.detach : true),
                    shell: options.constrained === true ? false : ((_a = options.shell) !== null && _a !== void 0 ? _a : false),
                };
                try {
                    const runParams = { executable, args, options: Object.assign(Object.assign({}, options), { env }) };
                    const vars = this.mToolParameterCBs.reduce((prev, cb) => {
                        return Object.assign(Object.assign({}, prev), cb(runParams));
                    }, {});
                    args = args.map(arg => applyVariables(arg, vars));
                    const child = (0, child_process_1.spawn)(runExe, (spawnOptions.shell ? args : args.map(arg => arg.replace(/"/g, ''))), spawnOptions);
                    if ((0, util_1.truthy)(child['exitCode'])) {
                        // brilliant, apparently there is no way for me to get at the stdout/stderr when running
                        // through a shell if starting the application fails immediately
                        return reject(new Error(`Failed to start (exit code ${child['exitCode']})`));
                    }
                    if (options.onSpawned !== undefined) {
                        options.onSpawned(child.pid);
                    }
                    if (options.detach && options.constrained !== true) {
                        child.unref();
                    }
                    let stdOut;
                    let errOut;
                    child
                        .on('error', err => {
                        reject(err);
                    })
                        .on('close', (code) => {
                        if (options.attribution) {
                            (0, log_1.log)('info', 'process finished', { executable, code, attribution: options.attribution });
                        }
                        const game = (0, activeGameId_1.activeGameId)(this.mApi.store.getState());
                        // Handle null exit code (process was killed or terminated abnormally)
                        if (code === null) {
                            (0, log_1.log)('warn', 'child process terminated without exit code (likely killed)', { executable });
                            if (options.expectSuccess) {
                                // Provide more helpful error message for game launches
                                const isGameExecutable = executable.toLowerCase().includes('cyberpunk')
                                    || executable.toLowerCase().includes('game')
                                    || executable.toLowerCase().includes('.exe');
                                let errorMessage = `Process "${executable}" was terminated unexpectedly (no exit code)`;
                                if (isGameExecutable) {
                                    errorMessage += '\n\nThis often happens when:\n' +
                                        '• The game crashed during startup\n' +
                                        '• Required game files are missing or corrupted\n' +
                                        '• Antivirus software blocked the game\n' +
                                        '• The game requires additional dependencies\n\n' +
                                        'Try verifying game files through your game launcher or reinstalling the game.';
                                }
                                const err = new Error(errorMessage);
                                err.exitCode = null;
                                return reject(err);
                            }
                            return resolve();
                        }
                        if ((game === 'fallout3') && (code === 0xC0000135)) {
                            // 0xC0000135 means that a dll couldn't be found.
                            // In the context of FO3 it's commonly xlive or other redistribs are
                            //  not installed.
                            return reject(new CustomErrors_1.MissingDependency());
                        }
                        else if (code === 0xE0434352) {
                            // A .net error, unfortunately we can't now if/how the actual exception
                            // text has been reported
                            (0, log_1.log)('warn', '.NET error', { stdOut, errOut });
                            if (game === 'stardewvalley') {
                                // In the case of SDV the interesting information seems to get printed to stdout
                                return reject(new CustomErrors_1.ThirdPartyError(stdOut || errOut));
                            }
                            else if (errOut) {
                                return reject(new CustomErrors_1.ThirdPartyError(errOut));
                            }
                            else {
                                return reject(new CustomErrors_1.ProcessCanceled('.NET error'));
                            }
                        }
                        else if (code === 0xC000026B) {
                            return reject(new CustomErrors_1.ProcessCanceled('Windows shutting down'));
                        }
                        else if (code !== 0) {
                            // TODO: the child process returns an exit code of 53 for SSE and
                            // FO4, and an exit code of 1 for Skyrim. We don't know why but it
                            // doesn't seem to affect anything
                            const codeHex = code !== null ? code.toString(16) : 'null';
                            (0, log_1.log)('warn', 'child process exited with code: ' + codeHex, {});
                            if (errOut !== undefined) {
                                (0, log_1.log)('warn', 'child output', errOut.trim());
                            }
                            if (options.expectSuccess) {
                                let lastLine = '<No output>';
                                if (errOut !== undefined) {
                                    const lines = errOut.trim().split('\n');
                                    lastLine = (lines.length > ERROR_OUTPUT_CUTOFF)
                                        ? lines[lines.length - 1]
                                        : lines.join('\n');
                                }
                                // Provide more helpful error message for game launches
                                const isGameExecutable = executable.toLowerCase().includes('cyberpunk')
                                    || executable.toLowerCase().includes('game')
                                    || executable.toLowerCase().includes('.exe');
                                let errorMessage = `Failed to run "${executable}": "${lastLine} (${codeHex})"`;
                                if (isGameExecutable && code !== 0) {
                                    errorMessage += '\n\nGame launch failed. Common solutions:\n' +
                                        '• Verify game files through your game launcher\n' +
                                        '• Run the game as administrator\n' +
                                        '• Check for Windows updates and graphics driver updates\n' +
                                        '• Temporarily disable antivirus software\n' +
                                        '• Ensure all game dependencies are installed';
                                }
                                const err = new Error(errorMessage);
                                err.exitCode = code;
                                return reject(err);
                            }
                        }
                        resolve();
                    });
                    if (child.stderr !== undefined) {
                        child.stderr.on('data', (chunk) => {
                            if (errOut === undefined) {
                                errOut = '';
                            }
                            try {
                                errOut += chunk.toString();
                            }
                            catch (err) {
                                (0, log_1.log)('warn', 'error output from external process couldn\'t be processed', { executable });
                            }
                        });
                    }
                    if (child.stdout !== undefined) {
                        child.stdout.on('data', (chunk) => {
                            if (stdOut === undefined) {
                                stdOut = '';
                            }
                            try {
                                stdOut += chunk.toString();
                            }
                            catch (err) {
                                (0, log_1.log)('warn', 'output from external process couldn\'t be processed', { executable });
                            }
                        });
                    }
                }
                catch (err) {
                    if (err.code === 'EINVAL') {
                        err['attachLogOnReport'] = true;
                        (0, log_1.log)('error', 'Invalid spawn parameters', {
                            runExe,
                            args,
                            options: JSON.stringify(options),
                        });
                    }
                    return reject(err);
                }
            }))
                .catch((err) => {
                if (err instanceof CustomErrors_1.ProcessCanceled) {
                    return Promise.resolve(null);
                }
                else if (err.code === 'EACCES') {
                    return this.runElevated(executable, cwd, args, env, options.onSpawned);
                }
                else if (err.code === 'ECANCELED') {
                    return Promise.reject(new CustomErrors_1.UserCanceled());
                }
                else if (err.systemCode === 1223) {
                    return Promise.reject(new CustomErrors_1.UserCanceled());
                }
                else if (err.errno === 1223) {
                    return Promise.reject(new CustomErrors_1.UserCanceled());
                }
                else {
                    return Promise.reject(err);
                }
            })
                .catch((err) => {
                if (err.message.toLowerCase().indexOf('the operation was canceled by the user') !== -1) {
                    // This is more of a sanity check than anything else as one user report
                    //  contained none of the properties we rely on to detect when a user
                    //  cancels the UAC dialog.
                    //  https://github.com/Nexus-Mods/Vortex/issues/8524
                    return Promise.reject(new CustomErrors_1.UserCanceled());
                }
                return Promise.reject(err);
            });
        };
        this.emitAndAwait = (event, ...args) => {
            let queue = Promise.resolve();
            const results = [];
            const enqueue = (prom) => {
                if (prom !== undefined) {
                    queue = queue.then(() => prom
                        .then(res => {
                        if ((res !== undefined) && (res !== null)) {
                            results.push(res);
                        }
                    })
                        .catch(err => {
                        this.mApi.showErrorNotification(`Unhandled error in event "${event}"`, err);
                    }));
                }
            };
            this.mEventEmitter.emit(event, ...args, enqueue);
            return queue.then(() => results);
        };
        this.onAsync = (event, listener, extInfo) => {
            const effectiveListener = (0, util_1.wrapExtCBAsync)(listener, extInfo);
            this.mEventEmitter.on(event, (...args) => {
                const enqueue = args.pop();
                if ((enqueue === undefined) || (typeof (enqueue) !== 'function')) {
                    // no arguments, this is not an emitAndAwait event!
                    this.mApi.showErrorNotification('Invalid event handler', { event });
                    if (enqueue !== undefined) {
                        args.push(enqueue);
                    }
                    // call the listener anyway
                    const prom = effectiveListener(...args);
                    if (prom['catch'] !== undefined) {
                        prom['catch'](err => {
                            this.mApi.showErrorNotification(`Failed to call event ${event}`, err);
                        });
                    }
                }
                else {
                    enqueue(effectiveListener(...args));
                }
            });
        };
        this.withPrePost = (eventName, cb) => {
            return (...args) => {
                return this.emitAndAwait(`will-${eventName}`, ...args)
                    .then(() => cb(...args))
                    .then((res) => this.emitAndAwait(`did-${eventName}`, res, ...args)
                    .then(() => res));
            };
        };
        // tslint:disable-next-line:member-ordering
        this.highlightCSS = (() => {
            let highlightCSS;
            let highlightCSSAlt;
            let highlightAfterCSS;
            let highlightBeforeCSSAlt;
            const initCSS = () => {
                if (highlightCSS !== undefined) {
                    return;
                }
                highlightCSS = highlightAfterCSS = null;
                // tslint:disable-next-line:prefer-for-of
                for (let i = 0; i < document.styleSheets.length; ++i) {
                    if (document.styleSheets[i].ownerNode.id === 'theme') {
                        const rules = Array.from(document.styleSheets[i].rules);
                        rules.forEach((rule) => {
                            if (rule.selectorText === '#highlight-control-dummy') {
                                highlightCSS = rule;
                            }
                            else if (rule.selectorText === '#highlight-control-dummy-alt') {
                                highlightCSSAlt = rule;
                            }
                            else if (rule.selectorText === '#highlight-control-dummy::after') {
                                highlightAfterCSS = rule;
                            }
                            else if (rule.selectorText === '#highlight-control-dummy-alt::before') {
                                highlightBeforeCSSAlt = rule;
                            }
                        });
                    }
                }
            };
            return (selector, text, altStyle) => {
                initCSS();
                let result = '';
                const css = altStyle ? highlightCSSAlt : highlightCSS;
                const afterCSS = highlightAfterCSS;
                const dummySelector = altStyle ? '#highlight-control-dummy-alt' : '#highlight-control-dummy';
                // adding a new css rule matching the selector when we could just as well add
                // the highlight class to the control.
                // The reason it's done this way is because it's less messy (easier to clean up one css
                // rule instead of every control matched by the selector) and it doesn't interfere with
                // react, which might re-generate every control.
                if (highlightCSS === null) {
                    // fallback if template rules weren't found
                    result += `${selector} { border: 1px solid var(--brand-danger) !important }\n`;
                    if (text !== undefined) {
                        result += `${selector}::after { color: var(--brand-danger); content: "${text}" }\n`;
                    }
                }
                else {
                    result += css.cssText.replace(dummySelector, selector);
                    if (altStyle) {
                        result += highlightBeforeCSSAlt.cssText.replace(dummySelector, selector);
                    }
                    if (text !== undefined) {
                        result += afterCSS.cssText
                            .replace('#highlight-control-dummy', selector)
                            .replace('__contentPlaceholder', text);
                    }
                }
                return result;
            };
        })();
        this.highlightControl = (selector, duration, text, altStyle) => {
            const id = (0, shortid_1.generate)();
            const style = document.createElement('style');
            style.id = `highlight_${id}`;
            style.type = 'text/css';
            style.innerHTML = this.highlightCSS(selector, text, altStyle);
            const head = document.getElementsByTagName('head')[0];
            const highlightNode = head.appendChild(style);
            setTimeout(() => {
                head.removeChild(highlightNode);
            }, duration);
        };
        this.addMetaServer = (id, server) => {
            if (server !== undefined) {
                this.mProgrammaticMetaServers[id] = server;
            }
            else {
                delete this.mProgrammaticMetaServers[id];
            }
            this.mForceDBReconnect = true;
        };
        this.mEventEmitter = eventEmitter !== undefined ? eventEmitter : new events_1.EventEmitter();
        this.mEventEmitter.setMaxListeners(100);
        this.mUIStartedPromise = new Promise(resolve => {
            this.mOnUIStarted = resolve;
        });
        this.mInterpreters = {};
        this.mStartHooks = [];
        this.mToolParameterCBs = [];
        this.mApi = {
            showErrorNotification: this.showErrorBox,
            selectFile: this.selectFile,
            saveFile: this.saveFile,
            selectExecutable: this.selectExecutable,
            selectDir: this.selectDir,
            events: this.mEventEmitter,
            translate: (input, options) => this.mTranslator !== undefined
                ? this.mTranslator.t(input, options)
                : (Array.isArray(input) ? input[0].toString() : input.toString()),
            laterT: (input, options) => new i18n_1.TString(input, options, 'common'),
            locale: () => this.mTranslator.language,
            getI18n: () => this.mTranslator,
            getPath: this.getPath,
            onStateChange: (statePath, callback) => undefined,
            registerProtocol: this.registerProtocol,
            registerRepositoryLookup: this.registerRepositoryLookup,
            deregisterProtocol: this.deregisterProtocol,
            lookupModReference: this.lookupModReference,
            lookupModMeta: this.lookupModMeta,
            saveModMeta: this.saveModMeta,
            openArchive: this.openArchive,
            genMd5Hash: this.genMd5Hash,
            clearStylesheet: () => { var _a; this.ensureStyleManager(); (_a = this.mStyleManager) === null || _a === void 0 ? void 0 : _a.clearCache(); },
            setStylesheet: (key, filePath) => { var _a; this.ensureStyleManager(); (_a = this.mStyleManager) === null || _a === void 0 ? void 0 : _a.setSheet(key, filePath); },
            runExecutable: this.runExecutable,
            emitAndAwait: this.emitAndAwait,
            withPrePost: this.withPrePost,
            isOutdated: () => (0, errorHandling_1.isOutdated)(),
            onAsync: this.onAsync,
            highlightControl: this.highlightControl,
            addMetaServer: this.addMetaServer,
            getLoadedExtensions: () => this.extensions,
            awaitUI: () => this.mUIStartedPromise,
            getState: () => undefined,
            ext: {},
            NAMESPACE: 'common',
        };
        if (initStore !== undefined) {
            // apologies for the sync operation but this needs to happen before extensions are loaded
            // and everything in this phase of startup is synchronous anyway
            try {
                const disableExtensions = fs.readdirSync((0, getVortexPath_1.default)('temp'))
                    .filter(name => name.startsWith('__disable_'));
                disableExtensions.forEach(ext => {
                    const extId = ext.substr(10);
                    (0, log_1.log)('info', 'disabling extension that caused a crash before', { extId });
                    initStore.dispatch((0, app_1.setExtensionEnabled)(extId, false));
                    fs.unlinkSync(path.join((0, getVortexPath_1.default)('temp'), ext));
                });
            }
            catch (err) {
                // an ENOENT will happen on the first start where the dir doesn't
                // exist yet. No problem
                if (err.code !== 'ENOENT') {
                    (0, log_1.log)('error', 'failed to read disabled extensions', err.message);
                }
            }
            this.mExtensionState = initStore.getState().app.extensions;
            const extensionsPath = path.join((0, getVortexPath_1.default)('userData'), 'plugins');
            // Extension removal process with conditional forget
            Object.keys(this.mExtensionState)
                .filter(extId => this.mExtensionState[extId].remove)
                .forEach(extId => {
                const extPath = path.join(extensionsPath, extId);
                let deleted = false;
                try {
                    if (fs.existsSync(extPath)) {
                        (0, log_1.log)('info', 'removing extension directory', { path: extPath });
                        fs.removeSync(extPath);
                    }
                    if (!fs.existsSync(extPath)) {
                        deleted = true;
                    }
                }
                catch (err) {
                    (0, log_1.log)('error', 'failed to remove extension', { extId, error: err.message });
                }
                if (deleted) {
                    initStore.dispatch((0, app_1.forgetExtension)(extId));
                    (0, log_1.log)('info', 'extension removed and state cleaned up', { extId });
                }
                else {
                    (0, log_1.log)('warn', 'extension still present after failed removal, will retry on next start', { extId, path: extPath });
                }
            });
            electron_1.ipcMain.on('__get_extension_state', event => {
                event.returnValue = this.mExtensionState;
            });
            electron_1.ipcMain.on('__ui_is_ready', () => {
                this.mOnUIStarted();
            });
        }
    }
    setTranslation(translator) {
        this.mTranslator = translator;
    }
    get extensions() {
        return this.mExtensions;
    }
    get hasOutdatedExtensions() {
        return this.mOutdated.length > 0;
    }
    /**
     * sets up the extension manager to work with the specified store
     *
     * @template S State interface
     * @param {Redux.Store<S>} store
     *
     * @memberOf ExtensionManager
     */
    setStore(store) {
        this.mReduxWatcher = new ReduxWatcher_1.default(store, this.watcherError);
        this.mExtensionState = (0, storeHelper_1.getSafe)(store.getState(), ['app', 'extensions'], {});
        this.mApi.sendNotification = (notification) => {
            const noti = Object.assign({}, notification);
            if (noti.id === undefined) {
                noti.id = (0, shortid_1.generate)();
            }
            if (notification.type === 'warning') {
                (0, log_1.log)('warn', 'warning notification', { message: notification.message, title: notification.title });
            }
            else if (notification.type === 'error') {
                (0, log_1.log)('warn', 'error notification', { message: notification.message, title: notification.title });
            }
            store.dispatch((0, notifications_1.addNotification)(noti));
            return noti.id;
        };
        // tslint:disable-next-line:only-arrow-functions
        this.mApi.showErrorNotification = function (message, details, options) {
            let extension = this.extension;
            if ((extension === undefined) && ((details === null || details === void 0 ? void 0 : details['extension']) !== undefined)) {
                extension = this.getLoadedExtensions()
                    .find(iter => (iter.name === details['extension']));
            }
            if ((extension !== undefined)
                && (extension.info !== undefined)
                && (extension.info.author !== constants_1.COMPANY_ID)) {
                if (options === undefined) {
                    options = {};
                }
                if (options.allowReport !== false) {
                    options.extensionName = extension.info.name;
                    const remoteExtensions = this.getState().session.extensions.available;
                    options.extensionRemote = remoteExtensions.find(ext => isExtSame(extension.info, ext));
                }
                options.extension = extension;
            }
            (0, message_1.showError)(store.dispatch, message, details, options);
        };
        this.mApi.showDialog = (type, title, content, actions, id) => store.dispatch((0, notifications_1.showDialog)(type, title, content, actions, id));
        this.mApi.closeDialog = (id, actionKey, input) => store.dispatch((0, notifications_1.closeDialog)(id, actionKey, input));
        this.mApi.dismissNotification = (id) => store.dispatch((0, notifications_1.dismissNotification)(id));
        this.mApi.suppressNotification = (id, suppress) => {
            if (suppress !== false) {
                store.dispatch((0, notifications_1.dismissNotification)(id));
            }
            store.dispatch((0, notificationSettings_1.suppressNotification)(id, suppress !== false));
        };
        this.mApi.store = store;
        this.mApi.getState = () => this.mApi.store.getState();
        this.mApi.onStateChange = this.stateChangeHandler;
        this.mApi.onStateChange(['settings', 'metaserver', 'servers'], () => {
            this.mForceDBReconnect = true;
        });
        if (electron_1.ipcRenderer !== undefined) {
            electron_1.ipcRenderer.on('send-notification', (event, notification) => this.mApi.sendNotification(notification));
            electron_1.ipcRenderer.on('show-error-notification', (event, message, details, options, isError) => {
                let data = JSON.parse(details);
                if (isError) {
                    data = Object.assign(new Error(), data);
                }
                this.mApi.showErrorNotification(message, data, options || undefined);
            });
            store.dispatch((0, actions_1.setOptionalExtensions)(this.mOptionalExtensions));
            store.dispatch((0, session_1.setExtensionLoadFailures)(this.mLoadFailures));
        }
        else {
            this.migrateExtensions();
        }
        this.reportExtLoadErrors();
    }
    reportExtLoadErrors() {
        var _a, _b;
        const nodeLoadErr = Object.values(this.mLoadFailures).flat(1)
            .find(_ => {
            var _a, _b;
            const msg = (_b = (_a = _.args) === null || _a === void 0 ? void 0 : _a.message) !== null && _b !== void 0 ? _b : '';
            return msg.includes('The specified module could not be found.') && msg.includes('.node');
        });
        if (nodeLoadErr !== undefined) {
            (_b = (_a = this.mApi.store) === null || _a === void 0 ? void 0 : _a.dispatch) === null || _b === void 0 ? void 0 : _b.call(_a, (0, notifications_1.showDialog)('error', 'Extension failed to load', {
                bbcode: 'An unexpected error occurred while Vortex was loading extension:<br/><br/>{{message}}<br/><br/>'
                    + 'This is often caused by a bad installation of the app, '
                    + 'a security app interfering with Vortex '
                    + 'or a problem with the Microsoft Visual C++ Redistributable installed on your PC. '
                    + 'To solve this issue please try the following:<br/><br/>'
                    + '- Wait a moment and try starting Vortex again<br/>'
                    + '- Reinstall Vortex from the Nexus Mods website<br/>'
                    + '- Install the latest Microsoft Visual C++ Redistributable ([url]{{url}}[/url])<br/>'
                    + '- Disable anti-virus or other security apps that might interfere and install Vortex again<br/><br/>'
                    + 'If the issue persists, please create a thread in our support forum for further assistance.',
                parameters: {
                    message: nodeLoadErr.args.message,
                    url: constants_2.VCREDIST_URL,
                },
            }, [
                {
                    label: 'Ignore',
                    action: () => (0, errorHandling_1.disableErrorReport)(),
                },
                {
                    label: 'Close Vortex',
                    action: () => appExit(),
                },
            ], 'ext-load-native-failed'));
        }
    }
    /**
     * set up the api for the main process.
     *
     * @param {Redux.Store<S>} store
     * @param {NodeJS.Events} ipc channel to the renderer process, in case a call has to be
     *                            delegated there
     *
     * @memberOf ExtensionManager
     */
    setupApiMain(store, ipc) {
        this.mApi.showErrorNotification =
            (message, details, options) => {
                try {
                    // make an attempt to serialise error objects in such a way that they can be
                    // reconstructed.
                    const data = (typeof (details) === 'object')
                        ? Object.assign({}, details) : details;
                    if (details instanceof Error) {
                        // details.stack, details.name AND details.message seem to be getters.
                        data.stack = details.stack;
                        data.name = details.name;
                        data.message = details.message;
                        // stack is also optional. If we don't have one, generate one to this function
                        // which is better than nothing because otherwise the code reconstructing the error
                        // will produce a stack that is completely useless
                        if (data.stack === undefined) {
                            data.stack = (new Error()).stack;
                        }
                    }
                    ipc.send('show-error-notification', message, JSON.stringify(data), options, details instanceof Error);
                }
                catch (err) {
                    // this may happen if the ipc has already been destroyed
                    this.showErrorBox(message, details);
                }
            };
        this.mApi.events = this.mEventEmitter = new EventProxy(ipc);
    }
    /**
     * gain acces to the extension api
     *
     * @returns
     *
     * @memberOf ExtensionManager
     */
    getApi() {
        return this.mApi;
    }
    /**
     * retrieve list of all reducers registered by extensions
     */
    getReducers() {
        if (this.mContextProxyHandler === undefined) {
            this.initExtensions();
        }
        const reducers = [];
        this.apply('registerReducer', (statePath, reducer) => {
            reducers.push({ path: statePath, reducer });
        });
        this.apply('registerActionCheck', (actionType, check) => {
            (0, reduxSanity_1.registerSanityCheck)(actionType, check);
        });
        this.apply('registerInterpreter', (extension, apply) => {
            this.mInterpreters[extension.toLowerCase()] = apply;
        });
        this.apply('registerStartHook', (priority, id, hook) => {
            this.mStartHooks.push({ priority, id, hook });
        });
        this.apply('registerToolVariables', (func) => {
            this.mToolParameterCBs.push(func);
        });
        this.mStartHooks.sort((lhs, rhs) => lhs.priority - rhs.priority);
        return reducers;
    }
    /**
     * apply all extensions that were registered by extensions
     *
     * @memberOf ExtensionManager
     */
    applyExtensionsOfExtensions() {
        this.mContextProxyHandler.invokeAdditions(this.mExtensions);
    }
    /**
     * runs the extension init function with the specified register-function
     * set
     *
     * @param {string} funcName
     * @param {Function} func
     *
     * @memberOf ExtensionManager
     */
    apply(funcName, func, addExtInfo) {
        if (this.mContextProxyHandler === undefined) {
            this.initExtensions();
        }
        this.mContextProxyHandler.getCalls(String(funcName)).forEach(call => {
            try {
                if (addExtInfo === true) {
                    const ext = this.mExtensions.find(iter => iter.name === call.extension);
                    const extInfo = _.pick(ext, ['name', 'namespace', 'path']);
                    func(extInfo, ...call.arguments);
                }
                else {
                    func(...call.arguments);
                }
            }
            catch (err) {
                this.mApi.showErrorNotification('Extension failed to initialize. If this isn\'t an official extension, ' +
                    'please report the error to the respective author.', {
                    extension: call.extension,
                    err: err.message,
                    stack: err.stack,
                });
            }
        });
    }
    /**
     * call the "once" function for all extensions. This should really only be called
     * once.
     */
    doOnce() {
        const calls = this.mContextProxyHandler.getCalls(process.type === 'renderer' ? 'once' : 'onceMain');
        const reportError = (err, call, allowReport = true) => {
            (0, log_1.log)('warn', 'failed to call once', { err: err.message, stack: err.stack });
            err['extension'] = call.extension;
            this.mApi.showErrorNotification('Extension failed to initialize. If this isn\'t an official extension, ' +
                'please report the error to the respective author.', err, { allowReport });
        };
        return (0, bluebird_migration_helpers_local_1.promiseMapSeries)(calls, (call, idx) => {
            (0, log_1.log)('debug', 'once', { extension: call.extension });
            const ext = this.mExtensions.find(iter => iter.name === call.extension);
            this.mContextProxyHandler.setExtension(ext.name, ext.path);
            try {
                this.mLoadingCallbacks.forEach(cb => {
                    cb(call.extension, idx);
                });
                const prom = call.arguments[0]() || Promise.resolve();
                const start = Date.now();
                return (0, util_1.timeout)(prom, 60000, {
                    throw: true,
                    queryContinue: () => this.queryLoadTimeout(call.extension),
                })
                    .then(() => {
                    const elapsed = Date.now() - start;
                    if (elapsed > 1000) {
                        (0, log_1.log)('debug', 'slow initialization', { extension: call.extension, elapsed });
                    }
                })
                    .catch(err => {
                    if (err instanceof CustomErrors_1.TimeoutError) {
                        reportError(new Error('Initialization didn\'t finish in time.'), call, false);
                        return Promise.resolve();
                    }
                    else {
                        return Promise.reject(err);
                    }
                })
                    .catch(err => {
                    reportError(err, call);
                });
            }
            catch (err) {
                reportError(err, call);
            }
            return Promise.resolve();
        })
            .then(() => {
            this.mLoadingCallbacks.forEach(cb => {
                cb(undefined, calls.length);
            });
            (0, log_1.log)('debug', 'once done');
        });
    }
    renderStyle() {
        this.ensureStyleManager();
        if (this.mStyleManager === undefined) {
            return Promise.resolve();
        }
        this.mStyleManager.startAutoUpdate();
        return this.mStyleManager.renderNow();
    }
    ensureStyleManager() {
        try {
            if ((this.mStyleManager === undefined)
                && (typeof process !== 'undefined')
                && (process.type === 'renderer')) {
                this.mStyleManager = new StyleManager_1.default(this.mApi);
            }
        }
        catch (err) {
            (0, log_1.log)('warn', 'failed to initialize StyleManager', { error: err === null || err === void 0 ? void 0 : err.message });
        }
    }
    getProtocolHandler(protocol) {
        return this.mProtocolHandlers[protocol] || null;
    }
    get numOnce() {
        const calls = this.mContextProxyHandler.getCalls(process.type === 'renderer' ? 'once' : 'onceMain');
        return calls.length;
    }
    onLoadingExtension(cb) {
        this.mLoadingCallbacks.push(cb);
    }
    setUIReady() {
        this.mOnUIStarted();
        electron_1.ipcRenderer.send('__ui_is_ready');
    }
    queryLoadTimeout(extension) {
        return Promise.resolve(showMessageBox({
            type: 'warning',
            title: 'Extension slow',
            message: `An extension (${extension}) is taking unusually long to load. `
                + 'This is very likely a bug. Do you want to continue to wait for it?',
            noLink: true,
            buttons: ['Cancel', 'Wait'],
        }))
            .then(result => result.response === 1);
    }
    getMetaServerList() {
        const state = this.mApi.store.getState();
        const servers = (0, storeHelper_1.getSafe)(state, ['settings', 'metaserver', 'servers'], {});
        return Object.keys(servers).map(id => servers[id]).slice()
            .concat(Object.values(this.mProgrammaticMetaServers))
            .sort((lhs, rhs) => { var _a, _b; return ((_a = lhs.priority) !== null && _a !== void 0 ? _a : 100) - ((_b = rhs.priority) !== null && _b !== void 0 ? _b : 100); });
    }
    connectMetaDB(gameId, apiKey) {
        const dbPath = path.join((0, getVortexPath_1.default)('userData'), 'metadb');
        return modmeta.ModDB.create(dbPath, gameId, this.getMetaServerList(), log_1.log)
            .catch(err => {
            return this.mApi.showDialog('error', 'Failed to connect meta database', {
                text: 'Please check that there is no other instance of Vortex still running.',
                message: err.message,
            }, [
                { label: 'Quit' },
                { label: 'Retry' },
            ])
                .then(result => {
                if (result.action === 'Quit') {
                    (0, application_1.getApplication)().quit();
                    return Promise.reject(new CustomErrors_1.ProcessCanceled('meta db locked'));
                }
                return this.connectMetaDB(gameId, apiKey);
            });
        });
    }
    /**
     * initialize all extensions
     */
    initExtensions() {
        if (this.mExtensions == null) {
            this.mExtensions = this.prepareExtensions();
        }
        const context = {
            api: this.mApi,
            // Stub registerGame function that queues calls until real implementation is available
            registerGame: (game, extensionPath) => {
                if (context.registerGame !== this.stubRegisterGame) {
                    // Real implementation is now available, call it directly
                    return context.registerGame(game, extensionPath);
                }
                else {
                    // Queue the call for later processing
                    this.pendingGameRegistrations.push({ game, extensionPath });
                }
            },
        };
        // Store reference to stub function for comparison
        this.stubRegisterGame = context.registerGame;
        this.mContextProxyHandler = new ContextProxyHandler(context);
        const contextProxy = new Proxy(context, this.mContextProxyHandler);
        this.mExtensions.forEach(ext => {
            if (process.type === 'renderer') {
                // log this only once so we don't spam the log file with this
                (0, log_1.log)('info', 'init extension', { name: ext.name, path: ext.path });
            }
            this.mContextProxyHandler.setExtension(ext.name, ext.path);
            try {
                const apiProxy = new APIProxyCreator(ext, this.mEventEmitter);
                const extProxy = new Proxy(contextProxy, apiProxy);
                ext.initFunc()(extProxy);
                apiProxy.enableAPI();
            }
            catch (err) {
                if (!ext.dynamic) {
                    // if one of the static extension fails to initialize we should be
                    // crashing, otherwise we risk data loss if the user restores a backup
                    // and the important reducers aren't loaded
                    throw err;
                }
                // make sure we're not calling any of the register calls if the extension
                // isn't fully initialized
                this.mContextProxyHandler.dropCalls(ext.name);
                this.mLoadFailures[ext.name] = [{ id: 'exception', args: { message: err.message } }];
                (0, log_1.log)('warn', 'couldn\'t initialize extension', { name: ext.name, err: err.message, stack: err.stack });
            }
        });
        this.mContextProxyHandler.endRegistration();
        // Process any pending game registrations now that all extensions are initialized
        if (this.pendingGameRegistrations.length > 0 && contextProxy.registerGame !== this.stubRegisterGame) {
            (0, log_1.log)('info', 'processing pending game registrations', { count: this.pendingGameRegistrations.length });
            this.pendingGameRegistrations.forEach(({ game, extensionPath }) => {
                try {
                    contextProxy.registerGame(game, extensionPath);
                }
                catch (err) {
                    (0, log_1.log)('error', 'failed to process pending game registration', { game: game === null || game === void 0 ? void 0 : game.id, err: err.message });
                }
            });
            this.pendingGameRegistrations = [];
        }
        // need to store them locally for now because the store isn't loaded at this time
        this.mLoadFailures = Object.assign(Object.assign({}, this.mLoadFailures), this.mContextProxyHandler.unloadIncompatible(ExtensionManager.sUIAPIs, this.mExtensions));
        this.mOptionalExtensions = this.mContextProxyHandler.getOptionalExtensions(this.mExtensions);
        // apply api extensions immediately after all extensions are loaded so they
        // become available asap
        this.apply('registerAPI', (key, func, options) => {
            this.mApi.ext[key] = func;
        });
        if (process.type === 'renderer') {
            (0, log_1.log)('info', 'all extensions initialized');
        }
    }
    migrateExtensions() {
        const migrations = {};
        this.mContextProxyHandler.getCalls('registerMigration').forEach(call => {
            (0, util_1.setdefault)(migrations, call.extension, []).push(call.arguments[0]);
        });
        const state = this.mApi.store.getState();
        this.mExtensions
            .filter(ext => ext.dynamic)
            .forEach(ext => {
            try {
                let oldVersion = (0, storeHelper_1.getSafe)(state.app, ['extensions', ext.name, 'version'], '0.0.0');
                if (!semver.valid(oldVersion)) {
                    (0, log_1.log)('error', 'invalid version stored for extension', { extension: ext.name, oldVersion });
                    oldVersion = '0.0.0';
                }
                if (oldVersion !== ext.info.version) {
                    if (migrations[ext.name] === undefined) {
                        this.mApi.store.dispatch((0, app_1.setExtensionVersion)(ext.name, ext.info.version));
                    }
                    else {
                        (0, bluebird_migration_helpers_local_1.promiseMapSeries)(migrations[ext.name], mig => mig(oldVersion))
                            .then(() => {
                            (0, log_1.log)('info', 'set extension version', { name: ext.name, info: JSON.stringify(ext.info) });
                            this.mApi.store.dispatch((0, app_1.setExtensionVersion)(ext.name, ext.info.version));
                        })
                            .catch(err => {
                            this.mApi.showErrorNotification('Extension failed to migrate', err, {
                                allowReport: ext.info.author === constants_1.COMPANY_ID,
                            });
                        })
                            .then(() => null);
                    }
                }
            }
            catch (err) {
                this.mApi.showErrorNotification('Extension invalid', err, {
                    allowReport: false,
                    message: ext.name,
                });
            }
        });
    }
    getPath(name) {
        return (0, getVortexPath_1.default)(name);
    }
    selectFile(options) {
        const fullOptions = Object.assign(Object.assign({}, _.omit(options, ['create'])), { properties: ['openFile'] });
        if (options.create === true) {
            fullOptions.properties.push('promptToCreate');
        }
        return Promise.resolve(showOpenDialog(fullOptions))
            .then(result => (result.filePaths !== undefined) && (result.filePaths.length > 0)
            ? result.filePaths[0]
            : undefined);
    }
    saveFile(options) {
        const fullOptions = Object.assign({}, options);
        //if (options === true) {
        //fullOptions.properties.push('showOverwriteConfirmation');
        //}
        return Promise.resolve(showSaveDialog(fullOptions))
            .then(result => (result.filePath !== undefined)
            ? result.filePath
            : undefined);
    }
    selectExecutable(options) {
        // TODO: make the filter list dynamic based on the list of registered interpreters?
        const fullOptions = Object.assign(Object.assign({}, _.omit(options, ['create'])), { properties: ['openFile'], filters: [
                { name: 'All Executables', extensions: ['exe', 'cmd', 'bat', 'jar', 'py'] },
                { name: 'Native', extensions: ['exe', 'cmd', 'bat'] },
                { name: 'Java', extensions: ['jar'] },
                { name: 'Python', extensions: ['py'] },
            ] });
        return Promise.resolve(showOpenDialog(fullOptions))
            .then(result => (result.filePaths !== undefined) && (result.filePaths.length > 0)
            ? result.filePaths[0]
            : undefined);
    }
    selectDir(options) {
        const fullOptions = Object.assign(Object.assign({}, _.omit(options, ['create'])), { properties: ['openDirectory'] });
        return Promise.resolve(showOpenDialog(fullOptions))
            .then(result => (result.filePaths !== undefined) && (result.filePaths.length > 0)
            ? result.filePaths[0]
            : undefined);
    }
    modLookupId(detail) {
        const san = (input) => path.basename(input, path.extname(input));
        const fileName = (detail.filePath !== undefined)
            ? san(detail.filePath)
            : (detail.fileName !== undefined)
                ? san(detail.fileName)
                : undefined;
        return `${detail.fileMD5}_${fileName}`
            + `_${detail.fileSize}_${detail.gameId}`;
    }
    makeSorter(detail) {
        const fileName = detail.filePath !== undefined ? path.basename(detail.filePath) : undefined;
        const hasAttribute = (attribute, lhs, rhs, preferredValue) => {
            if (lhs[attribute] === rhs[attribute]) {
                return 0;
            }
            if (preferredValue === undefined) {
                // if no preferred value was set, ensure it can never match
                preferredValue = Symbol();
            }
            if (!(0, util_1.truthy)(lhs[attribute]) || rhs[attribute] === preferredValue) {
                return 1;
            }
            else if (!(0, util_1.truthy)(rhs[attribute]) || lhs[attribute] === preferredValue) {
                return -1;
            }
            else {
                return 0;
            }
        };
        const numDetails = (result) => {
            return Object.keys(result.details || {}).length;
        };
        return (lhs, rhs) => {
            const lhsV = lhs.value;
            const rhsV = rhs.value;
            // prefer results where the file name matches, otherwise use the one with
            // more details
            return hasAttribute('fileName', lhsV, rhsV, fileName)
                || hasAttribute('source', lhsV, rhsV, 'nexus')
                || hasAttribute('sourceURI', lhsV, rhsV)
                || hasAttribute('gameId', lhsV, rhsV)
                || hasAttribute('fileVersion', lhsV, rhsV)
                || hasAttribute('logicalFileName', lhsV, rhsV)
                || numDetails(lhsV) - numDetails(rhsV);
        };
    }
    runElevated(executable, cwd, args, env, onSpawned) {
        const ipcPath = (0, shortid_1.generate)();
        let tmpFilePath;
        return new Promise((resolve, reject) => {
            this.startIPC(ipcPath, err => {
                if (err !== null) {
                    reject(err);
                }
                else {
                    resolve(undefined);
                }
            });
            (0, log_1.log)('debug', 'running elevated', { executable, cwd, args });
            winapi.runElevated(ipcPath, runElevatedCustomTool_1.default, {
                toolPath: executable,
                toolCWD: cwd,
                parameters: args,
                environment: env,
            }).then(tmpPath => {
                tmpFilePath = tmpPath;
                if (onSpawned !== undefined) {
                    onSpawned();
                }
            }).catch(err => reject(err));
        })
            .finally(() => {
            if (tmpFilePath !== undefined) {
                try {
                    fs.unlinkSync(tmpFilePath);
                }
                catch (err) {
                    // nop
                }
            }
        });
    }
    startIPC(ipcPath, onFinished) {
        let connected = false;
        const finish = (err) => {
            server.close();
            onFinished(err);
        };
        const server = net.createServer(connRaw => {
            const conn = new JsonSocket(connRaw);
            (0, log_1.log)('debug', 'ipc client connected');
            connected = true;
            conn
                .on('message', data => {
                const { message, payload } = data;
                if (message === 'log') {
                    // tslint:disable-next-line:no-shadowed-variable
                    const { level, message, meta } = payload;
                    (0, log_1.log)(level, message, meta);
                }
                else if (message === 'finished') {
                    finish(null);
                }
            })
                .on('error', err => {
                (0, log_1.log)('error', 'elevated code reported error', err);
                finish(err);
            });
        })
            .listen(path.join('\\\\?\\pipe', ipcPath));
    }
    idify(name, pathName) {
        const transform = (input) => input.toLowerCase().replace(/[:']/g, '').replace(/[ _]/g, '-').trim();
        if (name !== undefined) {
            return transform(name);
        }
        else {
            // assuming the path is based on a nexus archive name, there should be a
            // -<modid>- tag after the actual mod name
            return pathName.split(/-\w+-/)[0];
        }
    }
    loadDynamicExtension(extensionPath, alreadyLoaded, bundled) {
        var _a, _b;
        let indexPath = this.mExtensionFormats
            .map(format => path.join(extensionPath, format))
            .find(iter => fs.existsSync(iter));
        // If not found via known formats, try resolving from package.json main/module
        if (indexPath === undefined) {
            try {
                const pkgPath = path.join(extensionPath, 'package.json');
                if (fs.existsSync(pkgPath)) {
                    const pkg = JSON.parse(fs.readFileSync(pkgPath, { encoding: 'utf8' }));
                    const mainFields = [pkg.main, pkg.module];
                    const candidates = mainFields
                        .filter((v) => typeof v === 'string' && v.length > 0)
                        .map(rel => path.join(extensionPath, rel));
                    indexPath = candidates.find(p => fs.existsSync(p));
                    if (indexPath === undefined) {
                        (0, log_1.log)('debug', 'package.json exists but entry not found at declared main/module', { extensionPath, candidates });
                    }
                    else {
                        (0, log_1.log)('debug', 'resolved extension entry from package.json', { extensionPath, indexPath });
                    }
                }
            }
            catch (err) {
                (0, log_1.log)('debug', 'failed to parse package.json while resolving extension entry', { extensionPath, error: err.message });
            }
        }
        if (indexPath !== undefined) {
            let info = { name: '', author: '', description: '', version: '' };
            try {
                info = JSON.parse(fs.readFileSync(path.join(extensionPath, 'info.json'), { encoding: 'utf8' }));
            }
            catch (error) {
                const errMessage = (error.code === 'ENOENT')
                    ? 'extension has no info.json file'
                    : 'failed to parse info.json file';
                (0, log_1.log)('warn', errMessage, { extensionPath, error: error.message });
            }
            const pathName = path.basename(extensionPath);
            const name = info.id || pathName;
            const namespace = (_b = (_a = info.namespace) !== null && _a !== void 0 ? _a : info.id) !== null && _b !== void 0 ? _b : (bundled
                ? pathName
                : this.idify(info.name, pathName));
            const existing = alreadyLoaded.find(reg => reg.name === name);
            if (existing) {
                if (semver.gte(info.version, existing.info.version)) {
                    this.mOutdated.push(path.basename(existing.path));
                }
                return undefined;
            }
            return {
                name,
                namespace,
                initFunc: () => {
                    const mod = winapi.dynreq(indexPath);
                    if (typeof mod === 'function') {
                        return mod;
                    }
                    if (mod && typeof mod.default === 'function') {
                        return mod.default;
                    }
                    const exportedKeys = mod && typeof mod === 'object' ? Object.keys(mod) : [];
                    (0, log_1.log)('warn', 'extension entry module did not export an init function', { extensionPath, indexPath, exportedKeys });
                    throw new Error('Extension entry module must export a function (ESM default or CommonJS module.exports)');
                },
                path: extensionPath,
                dynamic: true,
                info: Object.assign(Object.assign({}, info), { bundled }),
            };
        }
        else {
            // this is not necessarily a problem, translation extensions for example
            // may not have a js entry file. We tried known formats and package.json fields.
            (0, log_1.log)('debug', 'extension directory contains no known entry file', { extensionPath, triedFormats: this.mExtensionFormats });
            return undefined;
        }
    }
    loadDynamicExtensions(extension, loadedExtensions, alreadyLoaded) {
        if (!fs.existsSync(extension.path)) {
            (0, log_1.log)('info', 'failed to load dynamic extensions, path doesn\'t exist', extension.path);
            try {
                fs.mkdirSync(extension.path);
            }
            catch (err) {
                (0, log_1.log)('warn', 'extension path missing and can\'t be created', { path: extension.path, error: err.message });
            }
            return [];
        }
        const res = fs.readdirSync(extension.path)
            .filter(name => fs.statSync(path.join(extension.path, name)).isDirectory())
            .reduce((prev, name) => {
            var _a, _b, _c, _d, _e, _f, _g;
            const extState = (_a = this.mExtensionState) === null || _a === void 0 ? void 0 : _a[name];
            if ((extState === null || extState === void 0 ? void 0 : extState.remove) === true) {
                (0, log_1.log)('debug', 'extension marked for removal, skipping load', { name });
                return prev;
            }
            if (!(0, storeHelper_1.getSafe)(this.mExtensionState, [name, 'enabled'], true)) {
                (0, log_1.log)('debug', 'extension disabled', { name });
                return prev;
            }
            try {
                // first, mark this extension as loaded. If this is a user extension and there is an
                // extension with the same name in the bundle we could otherwise end up loading the
                // bundled one if this one fails to load which could be convenient but also massively
                // confusing.
                const before = Date.now();
                const ext = this.loadDynamicExtension(path.join(extension.path, name), alreadyLoaded, extension.bundled);
                if (ext !== undefined) {
                    if (((_c = (_b = this.mExtensionState) === null || _b === void 0 ? void 0 : _b[ext.name]) === null || _c === void 0 ? void 0 : _c.remove) === true) {
                        (0, log_1.log)('debug', 'extension marked for removal, skipping load', { name: ext.name });
                        return prev;
                    }
                    if (((_e = (_d = this.mExtensionState) === null || _d === void 0 ? void 0 : _d[ext.name]) === null || _e === void 0 ? void 0 : _e.enabled) === false) {
                        (0, log_1.log)('debug', 'extension disabled', { name: ext.name });
                        return prev;
                    }
                    loadedExtensions.add(ext.name);
                    const loadTime = Date.now() - before;
                    (0, log_1.log)('debug', 'loaded extension', { name, loadTime, location: extension.path });
                    if (prev[ext.name] !== undefined) {
                        // loadDynamicExtension already handles the case where the same extension was found
                        // in a different directory, but if the same directory contains multiple copies
                        // of the same extension, we have to deal with that slightly differently
                        (0, log_1.log)('warn', 'multiple copies of the same extension installed', { first: ext.path, second: prev[ext.name].path });
                        if ((ext.info === undefined)
                            || semver.gt((_f = prev[ext.name].info) === null || _f === void 0 ? void 0 : _f.version, (_g = ext.info) === null || _g === void 0 ? void 0 : _g.version)) {
                            // the copy we loaded previously is newer so mark this one for removal and not
                            // load it
                            this.mOutdated.push(path.basename(ext.path));
                        }
                        else {
                            // this copy is actually the newer one so replace the one previously found and
                            // mark that for deletion
                            this.mOutdated.push(path.basename(prev[ext.name].path));
                            prev[ext.name] = ext;
                        }
                    }
                    else {
                        prev[ext.name] = ext;
                    }
                }
            }
            catch (err) {
                (0, log_1.log)('warn', 'failed to load dynamic extension', { name, error: err.message, stack: err.stack });
                this.mLoadFailures[name] = [{ id: 'exception', args: { message: err.message } }];
            }
            return prev;
        }, {});
        return Object.values(res);
    }
    /**
     * retrieves all extensions to the base functionality, both the static
     * and external ones.
     * This loads external extensions from disc synchronously
     *
     * @returns {ExtensionInit[]}
     */
    prepareExtensions() {
        const staticExtensions = [
            'settings_interface',
            'settings_application',
            'about_dialog',
            'diagnostics_files',
            'dashboard',
            'starter_dashlet',
            'firststeps_dashlet',
            'mod_load_order',
            'file_based_loadorder',
            'mod_management',
            'category_management',
            'profile_management',
            'nexus_integration',
            'download_management',
            'gameversion_management',
            'gamemode_management',
            'announcement_dashlet',
            'symlink_activator',
            'symlink_activator_elevate',
            'hardlink_activator',
            'move_activator',
            'null_activator',
            'updater',
            'installer_fomod',
            'installer_nested_fomod',
            'instructions_overlay',
            'settings_metaserver',
            'test_runner',
            'extension_manager',
            'ini_prep',
            'news_dashlet',
            'sticky_mods',
            'browser',
            'recovery',
            'file_preview',
            'tool_variables_base',
            'history_management',
            'analytics',
            'onboarding_dashlet',
            'mod_spotlights_dashlet'
        ];
        require('./extensionRequire').default(() => this.extensions);
        const extensionPaths = ExtensionManager.getExtensionPaths();
        const loadedExtensions = new Set();
        let dynamicallyLoaded = [];
        return staticExtensions
            .filter(ext => (0, storeHelper_1.getSafe)(this.mExtensionState, [ext, 'enabled'], true))
            .map((name) => ({
            name,
            namespace: name,
            path: path.resolve(__dirname, '..', 'extensions', name),
            initFunc: () => require(`../extensions/${name}/index`).default,
            dynamic: false,
        }))
            .concat(...extensionPaths.map(extSpec => {
            const newExtensions = this.loadDynamicExtensions(extSpec, loadedExtensions, dynamicallyLoaded);
            dynamicallyLoaded = dynamicallyLoaded.concat(newExtensions);
            return newExtensions;
        }));
    }
}
ExtensionManager.sUIAPIs = new Set();
exports.default = ExtensionManager;
