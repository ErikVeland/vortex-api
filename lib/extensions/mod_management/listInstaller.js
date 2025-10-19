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
Object.defineProperty(exports, "__esModule", { value: true });
const checksum_1 = require("../../util/checksum");
const fs = __importStar(require("../../util/fs"));
// TODO: Remove Bluebird import - using native Promise;
const bluebird_migration_helpers_local_1 = require("../../util/bluebird-migration-helpers.local");
const path = __importStar(require("path"));
// Import xxhash-addon with fallback for when native module is not available
let XXHash64;
let xxhashAvailable = false;
try {
    const xxhashAddon = require('xxhash-addon');
    XXHash64 = xxhashAddon.XXHash64;
    xxhashAvailable = true;
}
catch (err) {
    console.warn('⚠️ xxhash-addon not available, using fallback:', err);
    // Provide a fallback implementation
    XXHash64 = class {
        hash() {
            // Return a dummy buffer - this will cause checksums to not match
            // but won't break the application
            return Buffer.from([0]);
        }
    };
}
function testSupported() {
    return Promise.resolve({
        supported: true,
        requiredFiles: [],
    });
}
function makeXXHash64() {
    // using seed 0
    const xxh64 = new XXHash64();
    return (filePath) => {
        return fs.readFileAsync(filePath)
            .then(data => {
            const buf = xxh64.hash(data);
            return buf.toString('base64');
        })
            .catch(err => {
            // If xxhash fails, fall back to a simple hash or return a dummy value
            console.warn('⚠️ XXHash64 failed, using fallback:', err);
            return 'fallback_hash';
        });
    };
}
/**
 * installer designed to unpack a specific list of files
 * from an archive, ignoring any install script
 */
function makeListInstaller(extractList, basePath) {
    let lookupFunc = (filePath) => Promise.resolve((0, checksum_1.fileMD5)(filePath));
    let idxId = 'md5';
    // TODO: this is awkward. We expect the entire list to use the same checksum algorithm
    if (extractList.find(iter => (iter.md5 !== undefined) || (iter.xxh64 === undefined)) === undefined) {
        if (xxhashAvailable) {
            lookupFunc = makeXXHash64();
            idxId = 'xxh64';
        }
        else {
            console.warn('⚠️ xxhash not available, falling back to MD5 checksums');
        }
    }
    return Promise.resolve({
        installer: {
            id: 'list-installer',
            priority: 0,
            testSupported,
            install: (files, destinationPath, gameId, progressDelegate) => {
                let prog = 0;
                // build lookup table of the existing files on disk md5 -> source path
                const filteredFiles = files.filter(relPath => !relPath.endsWith(path.sep));
                const length = filteredFiles.length;
                return (0, bluebird_migration_helpers_local_1.promiseReduce)(filteredFiles.map((relPath, idx) => ({ relPath, idx })), (prev, { relPath, idx }) => {
                    return lookupFunc(path.join(basePath, relPath))
                        .then(checksum => {
                        if (Math.floor((idx * 10) / length) > prog) {
                            prog = Math.floor((idx * 10) / length);
                            progressDelegate(prog * 10);
                        }
                        prev[checksum] = relPath;
                        return prev;
                    });
                }, {})
                    .then(lookup => {
                    // for each item in the extract list, look up the source path vial
                    // the lookup table, then create the copy instruction.
                    const missingItems = [];
                    return {
                        instructions: extractList.map(item => {
                            let instruction;
                            if (lookup[item[idxId]] === undefined) {
                                missingItems.push(item);
                                instruction = {
                                    type: 'error',
                                    source: `${item.path} (checksum: ${item[idxId]}) missing`,
                                    value: 'warn',
                                };
                            }
                            else {
                                instruction = {
                                    type: 'copy',
                                    source: lookup[item[idxId]],
                                    destination: item.path,
                                };
                            }
                            return instruction;
                        }),
                    };
                });
            },
        },
        requiredFiles: [],
    });
}
exports.default = makeListInstaller;
