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
exports.addToArchive = exports.extractArchive = exports.removeQuarantineRecursively = exports.sanitizeExtractedEntries = exports.validateExtractionWithinDest = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const child_process_1 = require("child_process");
const child_process_2 = require("child_process");
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
function isZipArchive(archivePath) {
    const lower = archivePath.toLowerCase();
    return lower.endsWith('.zip');
}
function isSevenZArchive(archivePath) {
    const lower = archivePath.toLowerCase();
    return lower.endsWith('.7z');
}
function isRarArchive(archivePath) {
    const lower = archivePath.toLowerCase();
    return lower.endsWith('.rar');
}
// Read a small magic header from the file to detect actual format
function readMagicHeader(archivePath) {
    try {
        const fd = fs.openSync(archivePath, 'r');
        const buf = Buffer.alloc(8);
        fs.readSync(fd, buf, 0, 8, 0);
        fs.closeSync(fd);
        return buf;
    }
    catch (_) {
        return Buffer.alloc(0);
    }
}
function isZipMagic(buf) {
    // ZIP files commonly start with 'PK\x03\x04' or 'PK\x05\x06' (empty archive)
    return buf.length >= 2 && buf[0] === 0x50 && buf[1] === 0x4B;
}
function is7zMagic(buf) {
    // 7z magic: 37 7A BC AF 27 1C
    return buf.length >= 6
        && buf[0] === 0x37 && buf[1] === 0x7A && buf[2] === 0xBC
        && buf[3] === 0xAF && buf[4] === 0x27 && buf[5] === 0x1C;
}
function isRarMagic(buf) {
    // RAR magic: 52 61 72 21 ('Rar!') possibly followed by 0x1A 0x07 0x00
    return buf.length >= 4
        && buf[0] === 0x52 && buf[1] === 0x61 && buf[2] === 0x72 && buf[3] === 0x21;
}
function extractWithTar(archivePath, destPath) {
    try {
        fs.mkdirSync(destPath, { recursive: true });
    }
    catch (_) { /* ignore */ }
    const lower = archivePath.toLowerCase();
    const args = ['-xf'];
    if (lower.endsWith('.tar.gz') || lower.endsWith('.tgz')) {
        args[0] = '-xzf';
    }
    // Exclude macOS metadata and disable extended attributes/xattrs restoration
    const exclude = ['--exclude=__MACOSX', '--exclude=*/__MACOSX/*'];
    const xattrs = process.platform === 'darwin' ? ['--no-xattrs'] : [];
    const proc = (0, child_process_2.spawn)('tar', [...args, archivePath, '-C', destPath, ...exclude, ...xattrs]);
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
function extractWithBSDTar(archivePath, destPath) {
    // Use bsdtar (libarchive) which ships on macOS and can read many formats including 7z/rar
    const args = ['-x', '-f', archivePath, '-C', destPath];
    const bsdtarPath = resolveToolPathSync('bsdtar') || 'bsdtar';
    const proc = (0, child_process_2.spawn)(bsdtarPath, args);
    return new Promise((resolve, reject) => {
        let stderr = '';
        proc.stderr.on('data', (d) => { stderr += d.toString(); });
        proc.on('error', err => reject(err));
        proc.on('close', code => {
            if (code === 0) {
                resolve();
            }
            else {
                const err = new Error(`bsdtar exited with code ${code}: ${stderr}`);
                reject(err);
            }
        });
    });
}
function extractWithDittoZip(archivePath, destPath) {
    // On macOS, ditto is robust for zip extraction (handles resource forks/symlinks)
    const dittoPath = resolveToolPathSync('ditto') || 'ditto';
    const proc = (0, child_process_2.spawn)(dittoPath, ['-x', '-k', archivePath, destPath]);
    return new Promise((resolve, reject) => {
        let stderr = '';
        proc.stderr.on('data', (d) => { stderr += d.toString(); });
        proc.on('error', err => reject(err));
        proc.on('close', code => {
            if (code === 0) {
                resolve();
            }
            else {
                const err = new Error(`ditto exited with code ${code}: ${stderr}`);
                reject(err);
            }
        });
    });
}
function extractWithUnzip(archivePath, destPath) {
    // Use unzip as a secondary native fallback; -X ignores extra file attributes
    const unzipPath = resolveToolPathSync('unzip') || 'unzip';
    const proc = (0, child_process_2.spawn)(unzipPath, ['-o', '-qq', '-X', archivePath, '-d', destPath]);
    return new Promise((resolve, reject) => {
        let stderr = '';
        proc.stderr.on('data', (d) => { stderr += d.toString(); });
        proc.on('error', err => reject(err));
        proc.on('close', code => {
            if (code === 0) {
                resolve();
            }
            else {
                const err = new Error(`unzip exited with code ${code}: ${stderr}`);
                reject(err);
            }
        });
    });
}
function resolveToolPathSync(cmd) {
    try {
        const res = (0, child_process_2.spawnSync)('which', [cmd], { encoding: 'utf8' });
        if (res && res.status === 0) {
            const p = (res.stdout || '').toString().trim();
            if (p && fs.existsSync(p)) {
                return p;
            }
        }
    }
    catch (_) { /* ignore */ }
    // Common Homebrew locations on macOS for tools
    if (process.platform === 'darwin') {
        const candidates = {
            'unar': ['/opt/homebrew/bin/unar', '/usr/local/bin/unar'],
            '7z': ['/opt/homebrew/bin/7z', '/usr/local/bin/7z'],
            'bsdtar': ['/usr/bin/bsdtar'],
            'unzip': ['/usr/bin/unzip'],
            'ditto': ['/usr/bin/ditto'],
        };
        const list = candidates[cmd];
        if (list) {
            for (const cand of list) {
                try {
                    if (fs.existsSync(cand)) {
                        return cand;
                    }
                }
                catch (_) { /* ignore */ }
            }
        }
    }
    return undefined;
}
function extractWithUnar(archivePath, destPath) {
    // Use 'unar' (The Unarchiver) if available; supports 7z/rar and more
    // Options: -quiet, -force-overwrite, -no-directory, -output dest
    const args = ['-quiet', '-force-overwrite', '-no-directory', '-output', destPath, archivePath];
    const unarPath = resolveToolPathSync('unar') || 'unar';
    const proc = (0, child_process_2.spawn)(unarPath, args);
    return new Promise((resolve, reject) => {
        let stderr = '';
        proc.stderr.on('data', (d) => { stderr += d.toString(); });
        proc.on('error', err => reject(err));
        proc.on('close', code => {
            if (code === 0) {
                resolve();
            }
            else {
                const err = new Error(`unar exited with code ${code}: ${stderr}`);
                reject(err);
            }
        });
    });
}
function toolAvailableSync(cmd, args = ['--version']) {
    const resolved = resolveToolPathSync(cmd) || cmd;
    try {
        const res = (0, child_process_2.spawnSync)(resolved, args, { stdio: 'ignore' });
        // If the tool exists, spawnSync should return a status (0 or non-zero).
        // ENOENT cases will typically throw or have an error; we treat those as not available.
        return typeof res.status === 'number';
    }
    catch (_) {
        return false;
    }
}
function getPackaged7zPathSync() {
    try {
        // Try 7zip-bin first
        const sevenZipBin = require('7zip-bin');
        const candidate = (sevenZipBin === null || sevenZipBin === void 0 ? void 0 : sevenZipBin.path7za) || sevenZipBin;
        if (candidate && typeof candidate === 'string') {
            try {
                fs.statSync(candidate);
                try {
                    fs.chmodSync(candidate, 0o755);
                }
                catch (_) { /* ignore */ }
                return candidate;
            }
            catch (_) { /* ignore */ }
        }
    }
    catch (_) { /* ignore */ }
    try {
        // Fallback to 7z-bin if present
        const sevenZBin = require('7z-bin');
        const candidate = (sevenZBin === null || sevenZBin === void 0 ? void 0 : sevenZBin.path7za) || sevenZBin;
        if (candidate && typeof candidate === 'string') {
            try {
                fs.statSync(candidate);
                try {
                    fs.chmodSync(candidate, 0o755);
                }
                catch (_) { /* ignore */ }
                return candidate;
            }
            catch (_) { /* ignore */ }
        }
    }
    catch (_) { /* ignore */ }
    return undefined;
}
function extractWithPackaged7z(archivePath, destPath) {
    const bin = getPackaged7zPathSync();
    if (!bin) {
        return Promise.reject(new Error('No bundled 7z binary available'));
    }
    const args = ['x', '-y', archivePath, `-o${destPath}`];
    const proc = (0, child_process_2.spawn)(bin, args);
    return new Promise((resolve, reject) => {
        let stderr = '';
        proc.stderr.on('data', (d) => { stderr += d.toString(); });
        proc.on('error', err => reject(err));
        proc.on('close', code => {
            if (code === 0) {
                resolve();
            }
            else {
                const err = new Error(`bundled 7z exited with code ${code}: ${stderr}`);
                reject(err);
            }
        });
    });
}
function validateExtractionWithinDest(destPath) {
    const destReal = fs.realpathSync.native ? fs.realpathSync.native(destPath) : fs.realpathSync(destPath);
    const walkDir = (dir) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const ent of entries) {
            const full = path.join(dir, ent.name);
            try {
                const rp = fs.realpathSync(full);
                if (!rp.startsWith(destReal)) {
                    // Log traversal escape instead of throwing to allow continuing
                    (0, log_1.log)('error', 'Extracted path escapes destination; skipping entry', { entryPath: full, resolvedPath: rp, destReal });
                    // If this is a symlink, remove it to prevent follow-on issues
                    try {
                        const lst = fs.lstatSync(full);
                        if (lst.isSymbolicLink()) {
                            fs.unlinkSync(full);
                        }
                    }
                    catch (_) { /* ignore */ }
                }
            }
            catch (e) {
                // Some entries may be broken links; log and continue
                (0, log_1.log)('warn', 'Failed to resolve realpath for extracted entry', { entryPath: full, error: e === null || e === void 0 ? void 0 : e.message });
            }
            if (ent.isDirectory()) {
                walkDir(full);
            }
        }
    };
    walkDir(destPath);
}
exports.validateExtractionWithinDest = validateExtractionWithinDest;
function sanitizeExtractedEntries(destPath, options) {
    var _a;
    const destReal = fs.realpathSync.native ? fs.realpathSync.native(destPath) : fs.realpathSync(destPath);
    const allowedRootsIn = (_a = options === null || options === void 0 ? void 0 : options.allowedRoots) !== null && _a !== void 0 ? _a : [destReal];
    const allowedRoots = allowedRootsIn.map(r => {
        try {
            return fs.realpathSync(r);
        }
        catch (_) {
            return path.resolve(r);
        }
    });
    const isAllowedTarget = (target) => {
        try {
            const rp = fs.realpathSync(target);
            return allowedRoots.some(root => rp.startsWith(root));
        }
        catch (_) {
            const abs = path.resolve(target);
            return allowedRoots.some(root => abs.startsWith(root));
        }
    };
    const walkDir = (dir) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const ent of entries) {
            const full = path.join(dir, ent.name);
            // Normalize to absolute path for comparison
            const resolved = path.resolve(full);
            try {
                const lst = fs.lstatSync(full);
                if (lst.isSymbolicLink()) {
                    let target = '';
                    try {
                        const link = fs.readlinkSync(full);
                        target = path.isAbsolute(link) ? link : path.resolve(path.dirname(full), link);
                    }
                    catch (e) {
                        (0, log_1.log)('warn', 'Failed to read symlink target; removing unsafe link', { entryPath: full, error: e === null || e === void 0 ? void 0 : e.message });
                        try {
                            fs.unlinkSync(full);
                        }
                        catch (_) { /* ignore */ }
                        continue;
                    }
                    const allowed = (options === null || options === void 0 ? void 0 : options.allowExternalSymlinks) ? true : isAllowedTarget(target);
                    if (!allowed) {
                        (0, log_1.log)('warn', 'Symlink target outside allowed roots; removing link', { entryPath: full, target });
                        try {
                            fs.unlinkSync(full);
                        }
                        catch (e2) {
                            (0, log_1.log)('warn', 'Failed to remove unsafe symlink', { entryPath: full, error: e2 === null || e2 === void 0 ? void 0 : e2.message });
                        }
                    }
                }
            }
            catch (e) {
                (0, log_1.log)('warn', 'Failed to lstat extracted entry', { entryPath: resolved, error: e === null || e === void 0 ? void 0 : e.message });
            }
            if (ent.isDirectory()) {
                walkDir(full);
            }
        }
    };
    walkDir(destPath);
}
exports.sanitizeExtractedEntries = sanitizeExtractedEntries;
function removeQuarantineRecursively(targetPath) {
    return __awaiter(this, void 0, void 0, function* () {
        if (process.platform !== 'darwin') {
            return;
        }
        try {
            const xattrPath = resolveToolPathSync('xattr') || 'xattr';
            const proc = (0, child_process_1.spawn)(xattrPath, ['-r', '-d', 'com.apple.quarantine', targetPath]);
            yield new Promise((resolve, reject) => {
                proc.on('error', reject);
                proc.on('close', code => (code === 0) ? resolve() : reject(new Error(`xattr exited ${code}`)));
            });
            (0, log_1.log)('info', 'Removed macOS quarantine attribute', { targetPath });
        }
        catch (qe) {
            (0, log_1.log)('warn', 'Failed to remove macOS quarantine attribute', { targetPath, error: qe === null || qe === void 0 ? void 0 : qe.message });
        }
    });
}
exports.removeQuarantineRecursively = removeQuarantineRecursively;
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
            try {
                fs.mkdirSync(destPath, { recursive: true });
            }
            catch (e) {
                (0, log_1.log)('warn', 'Failed to pre-create destination directory', { destPath, error: e === null || e === void 0 ? void 0 : e.message });
            }
            const magic = readMagicHeader(archivePath);
            const zipByMagic = isZipMagic(magic);
            const sevenZByMagic = is7zMagic(magic);
            const rarByMagic = isRarMagic(magic);
            // Multi-part detection (simple heuristic): suggest selecting the first part
            const base = path.basename(archivePath).toLowerCase();
            const isMultipartRar = base.match(/\.part(\d+)\.rar$/) || base.endsWith('.r00');
            const isMultipartSevenZ = base.match(/\.7z\.(\d{3})$/) || base.endsWith('.7z.001');
            if (isMultipartRar || isMultipartSevenZ) {
                // Enforce selecting the first part to avoid extraction errors
                const matchRar = base.match(/\.part(\d+)\.rar$/);
                const match7z = base.match(/\.7z\.(\d{3})$/);
                const isFirstRar = matchRar ? (matchRar[1] === '1') : base.endsWith('.r00');
                const isFirst7z = match7z ? (match7z[1] === '001') : base.endsWith('.7z.001');
                const isFirstPart = isMultipartRar ? isFirstRar : isFirst7z;
                if (!isFirstPart) {
                    const hint = 'Select the first part of the multi-part archive (e.g., .part1.rar or .7z.001).';
                    (0, log_1.log)('error', 'Wrong multi-part archive segment selected', { archivePath, hint });
                    throw new Error('Wrong multi-part archive segment selected. ' + hint);
                }
                // Optional: check if next part exists to warn early
                try {
                    const dir = path.dirname(archivePath);
                    const stem = isMultipartRar
                        ? base.replace(/\.part\d+\.rar$/, '')
                        : base.replace(/\.7z\.\d{3}$/, '');
                    const nextPart = isMultipartRar ? path.join(dir, `${stem}.part2.rar`) : path.join(dir, `${stem}.7z.002`);
                    if (!fs.existsSync(nextPart)) {
                        (0, log_1.log)('warn', 'Next part of multi-part archive not found', { expectedNextPart: nextPart });
                    }
                }
                catch (e) {
                    // Non-fatal; continue
                }
            }
            if (isTarArchive(archivePath) && (process.platform === 'darwin' || process.platform === 'linux')) {
                (0, log_1.log)('info', 'Using tar extractor for archive', { archivePath, destPath, platform: process.platform });
                yield extractWithTar(archivePath, destPath);
            }
            else if (process.platform === 'darwin' && (isZipArchive(archivePath) || zipByMagic)) {
                // Prefer native macOS extraction for zip archives to avoid 7z quirks on macOS
                const hasDitto = toolAvailableSync('ditto', ['-v']);
                const hasUnzip = toolAvailableSync('unzip');
                (0, log_1.log)('info', 'Using macOS zip extractor', { archivePath, destPath, detectedZip: zipByMagic, hasDitto, hasUnzip });
                try {
                    if (hasDitto) {
                        yield extractWithDittoZip(archivePath, destPath);
                    }
                    else if (hasUnzip) {
                        yield extractWithUnzip(archivePath, destPath);
                    }
                    else {
                        (0, log_1.log)('warn', 'No native zip tools available; falling back to node-7z');
                        throw new Error('No native zip tools');
                    }
                }
                catch (dittoErr) {
                    if (hasUnzip) {
                        (0, log_1.log)('warn', 'macOS zip extraction failed with ditto, trying unzip fallback', { error: dittoErr === null || dittoErr === void 0 ? void 0 : dittoErr.message });
                        yield extractWithUnzip(archivePath, destPath);
                    }
                    else {
                        (0, log_1.log)('warn', 'zip extraction failed and unzip not available; falling back to node-7z', { error: dittoErr === null || dittoErr === void 0 ? void 0 : dittoErr.message });
                        throw dittoErr;
                    }
                }
            }
            else if (process.platform === 'darwin' && (isSevenZArchive(archivePath) || sevenZByMagic || isRarArchive(archivePath) || rarByMagic)) {
                // Use native macOS tools for 7z/rar where possible; avoid node-7z
                const type = (isSevenZArchive(archivePath) || sevenZByMagic) ? '7z' : 'rar';
                const packaged7zPath = getPackaged7zPathSync();
                const hasBSDTar = toolAvailableSync('bsdtar', ['--version']);
                const hasUnar = toolAvailableSync('unar', ['-version']);
                (0, log_1.log)('info', 'Using macOS native extractor for archive', { archivePath, destPath, type, hasBSDTar, hasUnar, packaged7zAvailable: !!packaged7zPath, packaged7zPath });
                try {
                    if (hasBSDTar) {
                        yield extractWithBSDTar(archivePath, destPath);
                    }
                    else if (hasUnar) {
                        yield extractWithUnar(archivePath, destPath);
                    }
                    else if (packaged7zPath) {
                        yield extractWithPackaged7z(archivePath, destPath);
                    }
                    else {
                        const hint = 'On macOS, install native extractors via Homebrew: "brew install unar" for RAR/7z support or "brew install p7zip".';
                        (0, log_1.log)('error', 'No suitable macOS extractors available', { archivePath, destPath, hint });
                        throw new Error('No macOS extractors available');
                    }
                }
                catch (bsdtarErr) {
                    if (hasUnar) {
                        (0, log_1.log)('warn', 'bsdtar extraction failed, trying unar fallback', { error: bsdtarErr === null || bsdtarErr === void 0 ? void 0 : bsdtarErr.message });
                        try {
                            yield extractWithUnar(archivePath, destPath);
                        }
                        catch (unarErr) {
                            if (packaged7zPath) {
                                (0, log_1.log)('warn', 'unar extraction failed, trying bundled 7z CLI fallback', { error: unarErr === null || unarErr === void 0 ? void 0 : unarErr.message });
                                try {
                                    yield extractWithPackaged7z(archivePath, destPath);
                                }
                                catch (packErr) {
                                    const hint = 'On macOS, install native extractors via Homebrew: "brew install unar" for RAR/7z support or "brew install p7zip".';
                                    (0, log_1.log)('error', 'macOS native extraction failed', { archivePath, destPath, error: packErr === null || packErr === void 0 ? void 0 : packErr.message, hint });
                                    throw packErr;
                                }
                            }
                            else {
                                const hint = 'On macOS, install native extractors via Homebrew: "brew install unar" for RAR/7z support or "brew install p7zip".';
                                (0, log_1.log)('error', 'No unar or bundled 7z available for extraction', { archivePath, destPath, error: unarErr === null || unarErr === void 0 ? void 0 : unarErr.message, hint });
                                throw unarErr;
                            }
                        }
                    }
                    else if (packaged7zPath) {
                        (0, log_1.log)('warn', 'bsdtar extraction failed and unar not available, trying bundled 7z CLI', { error: bsdtarErr === null || bsdtarErr === void 0 ? void 0 : bsdtarErr.message });
                        yield extractWithPackaged7z(archivePath, destPath);
                    }
                    else {
                        const hint = 'On macOS, install native extractors via Homebrew: "brew install unar" for RAR/7z support or "brew install p7zip".';
                        (0, log_1.log)('error', 'No suitable macOS extractors available (bsdtar unavailable, unar unavailable, no bundled 7z)', { archivePath, destPath, error: bsdtarErr === null || bsdtarErr === void 0 ? void 0 : bsdtarErr.message, hint });
                        throw bsdtarErr;
                    }
                }
            }
            else {
                (0, log_1.log)('info', 'Using node-7z extractor for archive', { archivePath, destPath, ssc, platform: process.platform });
                const extract = getExtract();
                const stream = extract(archivePath, destPath, { ssc, password });
                // Wait for completion. If node-7z exposes promise(), await it; otherwise
                // wrap the EventEmitter and wait for 'end' or 'error'. This prevents
                // continuing before extraction finishes, especially on macOS.
                if (typeof (stream === null || stream === void 0 ? void 0 : stream.promise) === 'function') {
                    yield stream.promise();
                }
                else if (typeof (stream === null || stream === void 0 ? void 0 : stream.on) === 'function') {
                    yield new Promise((resolve, reject) => {
                        let finished = false;
                        try {
                            stream.on('end', () => {
                                finished = true;
                                resolve();
                            });
                            stream.on('error', (err) => {
                                if (!finished) {
                                    reject(err);
                                }
                            });
                        }
                        catch (err) {
                            reject(err);
                        }
                    });
                }
                else {
                    // If we get here, the module returned an unexpected type; fail clearly
                    throw new Error('node-7z extract did not provide a promise or EventEmitter');
                }
            }
            // Sanitize symlinks and guard against path traversal within destPath
            try {
                sanitizeExtractedEntries(destPath, { allowExternalSymlinks: options === null || options === void 0 ? void 0 : options.allowExternalSymlinks, allowedRoots: [destPath] });
                validateExtractionWithinDest(destPath);
            }
            catch (e) {
                // Validation now logs and continues; only unexpected errors should reach here
                (0, log_1.log)('warn', 'Sanitization encountered issues after extraction', { destPath, error: e === null || e === void 0 ? void 0 : e.message });
            }
            // Remove macOS quarantine attribute recursively on extracted files if enabled
            if ((options === null || options === void 0 ? void 0 : options.removeQuarantine) !== false) {
                yield removeQuarantineRecursively(destPath);
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
