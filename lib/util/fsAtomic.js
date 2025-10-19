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
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeFileAtomic = writeFileAtomic;
exports.copyFileAtomic = copyFileAtomic;
exports.copyFileCloneAtomic = copyFileCloneAtomic;
const checksum_1 = require("./checksum");
const fs = __importStar(require("./fs"));
const log_1 = require("./log");
const nodeFS = __importStar(require("fs"));
const tmp_1 = require("tmp");
function writeFileAtomic(filePath, input) {
    return writeFileAtomicImpl(filePath, input, 3);
}
function writeFileAtomicImpl(filePath, input, attempts) {
    const stackErr = new Error();
    let cleanup;
    let tmpPath;
    const buf = input instanceof Buffer ? input : Buffer.from(input);
    const hash = (0, checksum_1.checksum)(buf);
    const finalizeCleanup = () => __awaiter(this, void 0, void 0, function* () {
        var _a;
        if (cleanup !== undefined) {
            try {
                cleanup();
            }
            catch (err) {
                (0, log_1.log)('error', 'failed to clean up temporary file', (_a = err === null || err === void 0 ? void 0 : err.message) !== null && _a !== void 0 ? _a : String(err));
            }
            finally {
                cleanup = undefined;
            }
        }
        else if (tmpPath !== undefined) {
            try {
                yield fs.unlinkAsync(tmpPath);
            }
            catch (_b) {
                // ignore
            }
            finally {
                tmpPath = undefined;
            }
        }
    });
    return new Promise((resolve, reject) => {
        (0, tmp_1.file)({ template: `${filePath}.XXXXXX.tmp` }, (err, genPath, fd, cleanupCB) => {
            if (err)
                return reject(err);
            tmpPath = genPath;
            cleanup = cleanupCB;
            resolve(fd);
        });
    })
        .then((fd) => fs.writeAsync(fd, buf, 0, buf.byteLength, 0)
        .then(() => fs.fsyncAsync(fd).catch(() => Promise.resolve()))
        .then(() => fs.closeAsync(fd).catch(() => Promise.resolve())))
        .then(() => __awaiter(this, void 0, void 0, function* () {
        if (tmpPath === undefined) {
            throw new Error('Temporary file path was not created');
        }
        const data = yield fs.readFileAsync(tmpPath);
        if ((0, checksum_1.checksum)(data) !== hash) {
            yield finalizeCleanup();
            if (attempts > 0) {
                return writeFileAtomicImpl(filePath, input, attempts - 1);
            }
            else {
                throw new Error('Write failed, checksums differ');
            }
        }
    }))
        .then(() => __awaiter(this, void 0, void 0, function* () {
        if (tmpPath === undefined)
            return;
        try {
            yield fs.renameAsync(tmpPath, filePath);
            tmpPath = undefined; // renamed, no need to unlink in finally
        }
        catch (err) {
            if ((err === null || err === void 0 ? void 0 : err.code) === 'EEXIST') {
                try {
                    yield fs.removeAsync(filePath);
                }
                catch (_a) {
                    // ignore, try rename anyway
                }
                yield fs.renameAsync(tmpPath, filePath);
                tmpPath = undefined;
            }
            else {
                throw err;
            }
        }
    }))
        .catch((err) => {
        var _a, _b;
        err.stack = ((_a = err.stack) !== null && _a !== void 0 ? _a : '') + '\n' + ((_b = stackErr.stack) !== null && _b !== void 0 ? _b : '');
        return Promise.reject(err);
    })
        .finally(() => {
        return finalizeCleanup();
    });
}
/**
 * copy a file in such a way that it will not replace the target if the copy is
 * somehow interrupted. The file is first copied to a temporary file in the same
 * directory as the destination, then deletes the destination and renames the temp
 * to destination. Since the rename is atomic and the deletion only happens after
 * a successful write this should minimize the risk of error.
 *
 * @export
 * @param {string} srcPath
 * @param {string} destPath
 * @returns {Promise<void>}
 */
function copyFileAtomic(srcPath, destPath) {
    let cleanup;
    let tmpPath;
    return new Promise((resolve, reject) => {
        (0, tmp_1.file)({ template: `${destPath}.XXXXXX.tmp` }, (err, genPath, fd, cleanupCB) => {
            if (err)
                return reject(err);
            cleanup = cleanupCB;
            tmpPath = genPath;
            resolve(fd);
        });
    })
        .then((fd) => fs.closeAsync(fd))
        .then(() => {
        if (tmpPath === undefined)
            throw new Error('Temporary file path was not created');
        return fs.copyAsync(srcPath, tmpPath);
    })
        .then(() => fs.unlinkAsync(destPath).catch((err) => {
        if (err.code === 'EPERM') {
            (0, log_1.log)('debug', 'file locked, retrying delete', destPath);
            return delay(100).then(() => fs.unlinkAsync(destPath));
        }
        else if (err.code === 'ENOENT') {
            return Promise.resolve();
        }
        else {
            return Promise.reject(err);
        }
    }))
        .catch((err) => err.code === 'ENOENT' ? Promise.resolve() : Promise.reject(err))
        .then(() => (tmpPath !== undefined) ? fs.renameAsync(tmpPath, destPath) : Promise.resolve())
        .catch((err) => {
        (0, log_1.log)('info', 'failed to copy', { srcPath, destPath, err: err.stack });
        if (cleanup !== undefined) {
            try {
                cleanup();
            }
            catch (cleanupErr) {
                (0, log_1.log)('error', 'failed to clean up temporary file', cleanupErr.message);
            }
        }
        return Promise.reject(err);
    });
}
/**
 * Perform an atomic copy using APFS clone where possible on macOS.
 * Falls back to regular copy if clone is unsupported or cross-volume.
 */
function copyFileCloneAtomic(srcPath, destPath) {
    const canTryClone = (process.platform === 'darwin');
    let cleanup;
    let tmpPath;
    return new Promise((resolve, reject) => {
        (0, tmp_1.file)({ template: `${destPath}.XXXXXX.tmp` }, (err, genPath, fd, cleanupCB) => {
            if (err)
                return reject(err);
            cleanup = cleanupCB;
            tmpPath = genPath;
            resolve(fd);
        });
    })
        .then((fd) => fs.closeAsync(fd))
        .then(() => __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        if (tmpPath === undefined)
            throw new Error('Temporary file path was not created');
        if (canTryClone) {
            const ficlone = ((_b = (_a = nodeFS.constants) === null || _a === void 0 ? void 0 : _a.COPYFILE_FICLONE) !== null && _b !== void 0 ? _b : 0);
            try {
                yield nodeFS.promises.copyFile(srcPath, tmpPath, ficlone);
            }
            catch (_c) {
                yield fs.copyAsync(srcPath, tmpPath);
            }
        }
        else {
            yield fs.copyAsync(srcPath, tmpPath);
        }
    }))
        .then(() => fs.unlinkAsync(destPath).catch((err) => {
        if (err.code === 'EPERM') {
            (0, log_1.log)('debug', 'file locked, retrying delete', destPath);
            return delay(100).then(() => fs.unlinkAsync(destPath));
        }
        else if (err.code === 'ENOENT') {
            return Promise.resolve();
        }
        else {
            return Promise.reject(err);
        }
    }))
        .catch((err) => err.code === 'ENOENT' ? Promise.resolve() : Promise.reject(err))
        .then(() => (tmpPath !== undefined) ? fs.renameAsync(tmpPath, destPath) : Promise.resolve())
        .catch((err) => {
        (0, log_1.log)('info', 'failed to clone-copy', { srcPath, destPath, err: err.stack });
        if (cleanup !== undefined) {
            try {
                cleanup();
            }
            catch (cleanupErr) {
                (0, log_1.log)('error', 'failed to clean up temporary file', cleanupErr.message);
            }
        }
        return Promise.reject(err);
    });
}
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
