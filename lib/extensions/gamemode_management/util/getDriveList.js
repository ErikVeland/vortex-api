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
const platform_1 = require("../../../util/platform");
const path = __importStar(require("path"));
const fsp = __importStar(require("fs/promises"));
function getDriveList(api) {
    // On macOS, per tests: include root '/' and directories under /Volumes; don't notify on failures
    if ((0, platform_1.isMacOS)()) {
        return (() => __awaiter(this, void 0, void 0, function* () {
            const drives = ['/'];
            try {
                const entries = yield fsp.readdir('/Volumes');
                for (const name of entries) {
                    const full = path.join('/Volumes', name);
                    try {
                        const st = yield fsp.stat(full);
                        if (st.isDirectory()) {
                            drives.push(full);
                        }
                    }
                    catch (_err) {
                        // ignore non-directories or inaccessible entries
                    }
                }
            }
            catch (_err) {
                // If /Volumes is unreadable or missing, just return root
                return ['/'];
            }
            return drives;
        }))();
    }
    let list;
    try {
        // Dynamic import to avoid TypeScript errors when the module is not available
        const drivelist = require('drivelist');
        list = drivelist.list;
        if (typeof (list) !== 'function') {
            throw new Error('Failed to load "drivelist" module');
        }
    }
    catch (err) {
        api.showErrorNotification('Failed to query list of system drives', {
            message: 'Vortex was not able to query the operating system for the list of system drives. '
                + 'If this error persists, please configure the list manually.',
            error: err,
        }, { allowReport: false });
        return Promise.resolve(['C:']);
    }
    return list()
        .then(disks => disks
        .sort()
        .filter(disk => disk.isSystem && !disk.isRemovable)
        .reduce((prev, disk) => {
        if (disk.mountpoints) {
            prev.push(...disk.mountpoints.map(mp => mp.path));
        }
        else if (disk['mountpoint'] !== undefined) {
            prev.push(disk['mountpoint']);
        }
        return prev;
    }, []))
        .catch(err => {
        api.showErrorNotification('Failed to determine list of disk drives. ' +
            'Please review the settings before scanning for games.', err, { allowReport: false });
        return ['C:'];
    });
}
exports.default = getDriveList;
