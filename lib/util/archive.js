"use strict";
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
exports.addToArchive = exports.extractArchive = void 0;
const child_process_1 = require("child_process");
// NOTE: node-7z can export either functions (extractFull, add)
// or a default class with instance methods depending on platform/mocks.
// We normalize here to a functional API and await the stream completion.
const log_1 = require("./log");
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function isTarArchive(archivePath) {
    const lower = archivePath.toLowerCase();
    return lower.endsWith('.tar') || lower.endsWith('.tar.gz') || lower.endsWith('.tgz');
}
function extractWithTar(archivePath, destPath) {
    const lower = archivePath.toLowerCase();
    const args = ['-xf'];
    if (lower.endsWith('.tar.gz') || lower.endsWith('.tgz')) {
        args[0] = '-xzf';
    }
    const proc = (0, child_process_1.spawn)('tar', [...args, archivePath, '-C', destPath]);
    return new Promise((resolve, reject) => {
        let stderr = '';
        proc.stderr.on('data', (d) => { stderr += d.toString(); });
        proc.on('error', err => reject(err));
        proc.on('close', code => {
            if (code === 0) {
                resolve();
            }
            else {
                const err = new Error(`tar exited with code ${code}: ${stderr}`);
                reject(err);
            }
        });
    });
}
function extractArchive(archivePath, destPath, options) {
    var _a;
    const SevenZipMod = require('node-7z');
    const getExtract = () => {
        var _a;
        if (SevenZipMod && typeof SevenZipMod.extractFull === 'function') {
            return SevenZipMod.extractFull;
        }
        const Ctor = (_a = SevenZipMod === null || SevenZipMod === void 0 ? void 0 : SevenZipMod.default) !== null && _a !== void 0 ? _a : SevenZipMod;
        if (typeof Ctor === 'function') {
            const inst = new Ctor();
            return (a, d, o) => inst.extractFull(a, d, o);
        }
        throw new Error('node-7z module does not provide extractFull');
    };
    const maxAttempts = 3;
    const baseDelay = 500;
    const ssc = (_a = options === null || options === void 0 ? void 0 : options.ssc) !== null && _a !== void 0 ? _a : false;
    const password = options === null || options === void 0 ? void 0 : options.password;
    const attempt = (n) => __awaiter(this, void 0, void 0, function* () {
        try {
            if (isTarArchive(archivePath) && (process.platform === 'darwin' || process.platform === 'linux')) {
                (0, log_1.log)('info', 'Using tar extractor for archive', { archivePath, destPath });
                yield extractWithTar(archivePath, destPath);
            }
            else {
                (0, log_1.log)('info', 'Using node-7z extractor for archive', { archivePath, destPath, ssc });
                const extract = getExtract();
                const stream = extract(archivePath, destPath, { ssc, password });
                // Wait for completion (both our shim and mocks expose promise())
                if (typeof (stream === null || stream === void 0 ? void 0 : stream.promise) === 'function') {
                    yield stream.promise();
                }
            }
        }
        catch (err) {
            if (n >= maxAttempts) {
                (0, log_1.log)('error', 'Archive extraction failed after max attempts', { archivePath, destPath, error: err === null || err === void 0 ? void 0 : err.message });
                throw err;
            }
            const delayMs = Math.min(baseDelay * Math.pow(2, n - 1), 4000);
            (0, log_1.log)('warn', 'Archive extraction failed, retrying with backoff', { attempt: n, delayMs, error: err === null || err === void 0 ? void 0 : err.message });
            yield delay(delayMs);
            return attempt(n + 1);
        }
    });
    return attempt(1);
}
exports.extractArchive = extractArchive;
function addToArchive(destArchive, files, options) {
    var _a;
    const SevenZipMod = require('node-7z');
    const getAdd = () => {
        var _a;
        if (SevenZipMod && typeof SevenZipMod.add === 'function') {
            return SevenZipMod.add;
        }
        const Ctor = (_a = SevenZipMod === null || SevenZipMod === void 0 ? void 0 : SevenZipMod.default) !== null && _a !== void 0 ? _a : SevenZipMod;
        if (typeof Ctor === 'function') {
            const inst = new Ctor();
            return (a, f, o) => inst.add(a, f, o);
        }
        throw new Error('node-7z module does not provide add');
    };
    const maxAttempts = 3;
    const baseDelay = 500;
    const ssw = (_a = options === null || options === void 0 ? void 0 : options.ssw) !== null && _a !== void 0 ? _a : true;
    const attempt = (n) => __awaiter(this, void 0, void 0, function* () {
        try {
            const add = getAdd();
            const stream = add(destArchive, files, { ssw });
            if (typeof (stream === null || stream === void 0 ? void 0 : stream.promise) === 'function') {
                yield stream.promise();
            }
        }
        catch (err) {
            if (n >= maxAttempts) {
                (0, log_1.log)('error', 'Archive creation failed after max attempts', { destArchive, error: err === null || err === void 0 ? void 0 : err.message });
                throw err;
            }
            const delayMs = Math.min(baseDelay * Math.pow(2, n - 1), 4000);
            (0, log_1.log)('warn', 'Archive creation failed, retrying with backoff', { attempt: n, delayMs, error: err === null || err === void 0 ? void 0 : err.message });
            yield delay(delayMs);
            return attempt(n + 1);
        }
    });
    return attempt(1);
}
exports.addToArchive = addToArchive;
