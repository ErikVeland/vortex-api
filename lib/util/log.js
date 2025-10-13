"use strict";
/**
 * wrapper for logging functionality
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
exports.valueReplacer = valueReplacer;
exports.setLogPath = setLogPath;
exports.setupLogging = setupLogging;
exports.log = log;
/** dummy */
const path = __importStar(require("path"));
const util = __importStar(require("util"));
const winston_1 = __importDefault(require("winston"));
// Detect test environment (Jest) to adjust logging behavior
const isTestEnv = (process && process.env &&
    (process.env.JEST_WORKER_ID !== undefined || process.env.NODE_ENV === 'test'));
// Buffer logs until logging is fully initialized to avoid EPIPE/runtime issues
let loggingReady = (process.type === 'renderer');
const pendingLogs = [];
// Set to control logging verbosity
const LOG_LEVEL = 'info'; // Change to 'warn' or 'error' to reduce verbosity further
// Patterns to filter out to reduce log spam
const FILTER_PATTERNS = [
    /Using \/ for division is deprecated/,
    /document is not defined/,
    /Identifier 'isWindows' has already been declared/,
    /a promise was created in a handler/
];
function valueReplacer() {
    const known = new Map();
    return (key, value) => {
        if (typeof (value) === 'object') {
            if (known.has(value)) {
                return '<Circular>';
            }
            known.set(value, true);
        }
        else if (typeof (value) === 'bigint') {
            // BigInt values are not serialized in JSON by default.
            return value.toString();
        }
        return value;
    };
}
function IPCTransport(options) {
    this.name = 'IPCTransport';
    this.level = LOG_LEVEL;
}
let logger = null;
// magic: when we're in the main process, this uses the logger from winston
// (which appears to be a singleton). In the renderer processes we connect
// to the main-process logger through ipc
if (process.type === 'renderer') {
    // tslint:disable-next-line:no-var-requires
    const { ipcRenderer } = require('electron');
    IPCTransport.prototype.log =
        (level, message, meta, callback) => {
            ipcRenderer.send('log-message', level, message, meta !== undefined ? JSON.stringify(meta, valueReplacer()) : undefined);
            callback(null);
        };
    // tslint:disable-next-line:no-var-requires
    logger = require('winston');
    util.inherits(IPCTransport, logger.Transport);
    logger.configure({
        transports: [
            new IPCTransport({}),
        ],
    });
}
else {
    // when being required from extensions, don't re-require the winston module
    // because the "singleton" is implemented abusing the require-cache
    if (global.logger === undefined) {
        // tslint:disable-next-line:no-var-requires
        logger = require('winston');
        global.logger = logger;
    }
    else {
        logger = global.logger;
    }
    // tslint:disable-next-line:no-var-requires
    const { ipcMain } = require('electron');
    if (ipcMain !== undefined) {
        ipcMain.on('log-message', (event, level, message, metadataSer) => {
            try {
                const metadata = (metadataSer !== undefined)
                    ? JSON.parse(metadataSer)
                    : undefined;
                logger.log(level, message, metadata);
            }
            catch (e) {
                // failed to log, what am I supposed to do now?
            }
        });
    } // otherwise we're not in electron
    // Avoid EPIPE issues by deferring file logging until setupLogging completes.
    // Also emit a console log for early visibility in development.
    // tslint:disable-next-line:no-console
    if (!isTestEnv) {
        // In tests, avoid console output which may trip Jest's "Cannot log after tests".
        console.log('📝 Logging initialized (pending file transport)');
    }
}
function flushPendingLogs() {
    if (pendingLogs.length === 0)
        return;
    try {
        pendingLogs.forEach(({ level, message, metadata }) => {
            if (metadata === undefined) {
                logger.log(level, message);
            }
            else {
                logger.log(level, message, metadata);
            }
        });
    }
    finally {
        pendingLogs.length = 0;
    }
}
function setLogPath(basePath) {
    var _a, _b;
    try {
        // remove the original transport so we can add the new one back again
        if (((_a = logger === null || logger === void 0 ? void 0 : logger.transports) === null || _a === void 0 ? void 0 : _a.File) !== undefined || ((_b = logger === null || logger === void 0 ? void 0 : logger.transports) === null || _b === void 0 ? void 0 : _b['File']) !== undefined) {
            // Winston v2 style
            logger.remove(logger.transports['File']);
        }
        else if (logger === null || logger === void 0 ? void 0 : logger.transports) {
            // In case transports is a list in newer versions, try to remove any File transports gracefully
            Object.keys(logger.transports)
                .filter(key => key.toLowerCase().includes('file'))
                .forEach(key => {
                try {
                    logger.remove(logger.transports[key]);
                }
                catch (err) { /* ignore */ }
            });
        }
        // add the new transport
        logger.add(logger.transports['File'], {
            filename: path.join(basePath, 'vortex.log'),
            json: false,
            level: LOG_LEVEL,
            maxsize: 1024 * 1024,
            maxFiles: 5,
            tailable: true,
            timestamp: () => new Date().toISOString(),
            formatter: (options) => {
                return `${options.timestamp()} [${options.level.toUpperCase()}] ${options.message !== undefined ? options.message : ''} ${(options.meta && Object.keys(options.meta).length) ? JSON.stringify(options.meta) : ''}`;
            }
        });
    }
    catch (err) {
        // Fall back gracefully if winston api differences break setup
        try {
            logger.log('error', 'Failed to set log path', { error: err === null || err === void 0 ? void 0 : err.message, basePath });
        }
        catch (e) {
            // tslint:disable-next-line:no-console
            console.log('Failed to set log path', { basePath, error: err === null || err === void 0 ? void 0 : err.message });
        }
    }
}
/**
 * application specific logging setup
 *
 * @export
 */
function setupLogging(basePath, useConsole) {
    try {
        // remove default one as we can't change things after added
        logger.remove(logger.transports['Console']);
        // add the new transport
        logger.add(logger.transports['File'], {
            filename: path.join(basePath, 'vortex.log'),
            json: false,
            level: LOG_LEVEL,
            maxsize: 1024 * 1024,
            maxFiles: 5,
            tailable: true,
            timestamp: () => new Date().toISOString(),
            formatter: (options) => {
                return `${options.timestamp()} [${options.level.toUpperCase()}] ${options.message !== undefined ? options.message : ''} ${(options.meta && Object.keys(options.meta).length) ? JSON.stringify(options.meta) : ''}`;
            }
        });
        // if we are using console (development enviorment) then add back a new console transport with better logging format
        if (useConsole) {
            logger.add(logger.transports['Console'], {
                level: LOG_LEVEL,
                timestamp: () => new Date().toISOString(),
                formatter: (options) => {
                    return `${options.timestamp()} [${winston_1.default.config.colorize(options.level, options.level.toUpperCase())}] ${options.message !== undefined ? options.message : ''} ${(options.meta && Object.keys(options.meta).length) ? JSON.stringify(options.meta) : ''}`;
                    //(options.meta && Object.keys(options.meta).length ? '\n\t'+ JSON.stringify(options.meta) : '' );
                }
            });
        }
    }
    catch (err) {
        // logger.add dynamically calls requires('./transport/file'). For some reason that
        // fails when this exe is called from chrome as a protocol handler. I've debugged as
        // far as I can, it fails in a stat call to asar. The parameter is fine, the file
        // exists and it worked in past versions so it appears to be a bug in electron
        logger.log('error', 'Failed to set up logging to file', { error: err.message });
    }
    // Mark logging as ready and flush any buffered logs
    loggingReady = true;
    flushPendingLogs();
}
/**
 * log a message
 *
 * @export
 * @param {Level} level The log level of the message: 'debug', 'info' or 'error'
 * @param {string} message The text message. Should contain no variable data
 * @param {any} [metadata] Additional information about the error instance
 */
function log(level, message, metadata) {
    try {
        // Filter out noisy messages to reduce log spam
        if (FILTER_PATTERNS.some(pattern => pattern.test(message))) {
            return; // Skip logging this message
        }
        if (!loggingReady) {
            // Buffer and also emit to console to avoid losing information before setup
            pendingLogs.push({ level, message, metadata });
            // tslint:disable-next-line:no-console
            if (!isTestEnv) {
                console.log(`[${level.toUpperCase()}] ${message}`, metadata || '');
            }
            return;
        }
        if (metadata === undefined) {
            logger.log(level, message);
        }
        else {
            logger.log(level, message, metadata);
        }
    }
    catch (err) {
        // tslint:disable-next-line:no-console
        console.log('❌ Failed to log to file', { level, message, metadata });
    }
}
