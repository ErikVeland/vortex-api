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
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyFileCloneAtomic = exports.copyFileAtomic = exports.writeFileAtomic = void 0;
const checksum_1 = require("./checksum");
const fs = __importStar(require("./fs"));
const log_1 = require("./log");
const nodeFS = __importStar(require("fs"));
const tmp_1 = require("tmp");
function writeFileAtomic(filePath, input) {
    return writeFileAtomicImpl(filePath, input, 3);
}
exports.writeFileAtomic = writeFileAtomic;
function writeFileAtomicImpl(filePath, input, attempts) {
    const stackErr = new Error();
    let cleanup;
    let tmpPath;
    const buf = input instanceof Buffer
        ? input
        : Buffer.from(input);
    const callCleanup = () => {
        if (cleanup !== undefined) {
            try {
                cleanup();
            }
            catch (err) {
                (0, log_1.log)('error', 'failed to clean up temporary file', err.message);
            }
            cleanup = undefined;
        }
    };
    const hash = (0, checksum_1.checksum)(buf);
    let fd = -1;
    return fs.withTmpFile((fdIn, pathIn) => {
        fd = fdIn;
        tmpPath = pathIn;
        return fs.writeAsync(fd, buf, 0, buf.byteLength, 0)
            .then(() => fs.fsyncAsync(fd).catch(() => Promise.resolve()))
            .then(() => fs.closeAsync(fd).catch(() => Promise.resolve()));
    }, {
        cleanup: false,
        template: `${filePath}.XXXXXX.tmp`,
    })
        .then(() => fs.readFileAsync(tmpPath))
        .catch({ code: 'EBADF' }, () => {
        (0, log_1.log)('warn', 'failed to access temporary file', {
            filePath,
            fd,
        });
        return Promise.resolve(undefined);
    })
        .then(data => {
        if ((data === undefined) || ((0, checksum_1.checksum)(data) !== hash)) {
            callCleanup();
            return (attempts > 0)
                ? writeFileAtomicImpl(filePath, input, attempts - 1)
                : Promise.reject(new Error('Write failed, checksums differ'));
        }
        else {
            return fs.renameAsync(tmpPath, filePath)
                .catch({ code: 'EEXIST' }, () => 
            // renameAsync is supposed to overwrite so this is likely to fail as well
            fs.removeAsync(filePath).then(() => fs.renameAsync(tmpPath, filePath)));
        }
    })
        .catch(err => {
        err.stack = err.stack + '\n' + stackErr.stack;
        return Promise.reject(err);
    })
        .finally(() => {
        callCleanup();
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
            if (err) {
                return reject(err);
            }
            cleanup = cleanupCB;
            tmpPath = genPath;
            resolve(fd);
        });
    })
        .then((fd) => fs.closeAsync(fd))
        .then(() => fs.copyAsync(srcPath, tmpPath))
        .then(() => fs.unlinkAsync(destPath).catch((err) => {
        if (err.code === 'EPERM') {
            // if the file is currently in use, try a second time
            // 100ms later
            (0, log_1.log)('debug', 'file locked, retrying delete', destPath);
            return delay(100).then(() => fs.unlinkAsync(destPath));
        }
        else if (err.code === 'ENOENT') {
            // file doesn't exist anyway? no problem
            return Promise.resolve();
        }
        else {
            return Promise.reject(err);
        }
    }))
        .catch(err => err.code === 'ENOENT' ? Promise.resolve() : Promise.reject(err))
        .then(() => (tmpPath !== undefined)
        ? fs.renameAsync(tmpPath, destPath)
        : Promise.resolve())
        .catch(err => {
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
exports.copyFileAtomic = copyFileAtomic;
/**
 * Perform an atomic copy using APFS clone where possible on macOS.
 * Falls back to regular copy if clone is unsupported or cross-volume.
 */
function copyFileCloneAtomic(srcPath, destPath) {
    // Only attempt clone on macOS and when paths are on the same volume
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
        if (canTryClone) {
            const ficlone = ((_b = (_a = nodeFS.constants) === null || _a === void 0 ? void 0 : _a.COPYFILE_FICLONE) !== null && _b !== void 0 ? _b : 0);
            try {
                // Attempt clone copy using native fs.promises.copyFile; fallback on error
                yield nodeFS.promises.copyFile(srcPath, tmpPath, ficlone);
            }
            catch (_) {
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
        .catch(err => err.code === 'ENOENT' ? Promise.resolve() : Promise.reject(err))
        .then(() => (tmpPath !== undefined)
        ? fs.renameAsync(tmpPath, destPath)
        : Promise.resolve())
        .catch(err => {
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
exports.copyFileCloneAtomic = copyFileCloneAtomic;
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
