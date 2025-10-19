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
const fs = __importStar(require("./fs"));
// TODO: Remove Bluebird import - using native Promise;
const fsOrig = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const promise_helpers_1 = require("./promise-helpers");
/**
 * recursively walk the target directory
 *
 * @param {string} target the directory to search
 * @param {any} callback called on each file and directory encountered. Receives the path and
 *                       corresponding fs stats as parameter. Should return a promise that will be
 *                       awaited before proceeding to the next directory. If this promise is
 *                       rejected, the walk is interrupted
 * @returns {Promise<void>} a promise that is resolved once the search is complete
 */
function walk(target, callback, options) {
    const opt = options || {};
    let allFileNames;
    return fs.readdirAsync(target)
        .catch(err => (err.code === 'ENOENT')
        ? Promise.resolve([])
        : Promise.reject(err))
        .then((fileNames) => {
        allFileNames = fileNames;
        return (0, promise_helpers_1.promiseMap)(fileNames, (statPath) => Promise.resolve(fsOrig.lstat([target, statPath].join(path.sep))).then(value => ({ status: "fulfilled", value })).catch(err => ({ status: "rejected", reason: err })));
    }).then((res) => {
        // use the stats results to generate a list of paths of the directories
        // in the searched directory
        const subDirs = [];
        const cbPromises = [];
        res.forEach((stat, idx) => {
            if (stat.status !== "fulfilled") {
                return;
            }
            const fullPath = path.join(target, allFileNames[idx]);
            cbPromises.push(callback(fullPath, stat.value));
            if (stat.value.isDirectory() && (path.extname(fullPath) !== '.asar')) {
                subDirs.push(fullPath);
            }
        });
        return Promise.all(cbPromises.concat((0, promise_helpers_1.promiseMapSeries)(subDirs, (subDir) => walk(subDir, callback))));
    })
        .catch(err => {
        if ((opt.ignoreErrors !== undefined)
            && ((opt.ignoreErrors === true)
                || (opt.ignoreErrors.indexOf(err.code) !== -1))) {
            return Promise.resolve();
        }
        else {
            return Promise.reject(err);
        }
    })
        .then(() => Promise.resolve());
}
exports.default = walk;
