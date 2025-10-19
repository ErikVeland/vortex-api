"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CustomErrors_1 = require("./CustomErrors");
const log_1 = require("./log");
// TODO: Remove Bluebird import - using native Promise;
const electron_1 = require("electron");
const platform_1 = require("./platform");
const winapi = (0, platform_1.isWindows)() ? require('winapi-bindings') : null;
// Platform detection utilities
try {
    // tslint:disable-next-line:no-var-requires
    // Platform-specific initialization
}
catch (err) {
    // nop
}
// apparently the browser process is treated as the foreground process and only it
// can bring a window to the foreground
if (electron_1.ipcMain !== undefined && (winapi === null || winapi === void 0 ? void 0 : winapi.ShellExecuteEx)) {
    electron_1.ipcMain.on('__opn_win32', (evt, target) => {
        try {
            winapi === null || winapi === void 0 ? void 0 : winapi.ShellExecuteEx({ verb: 'open', show: 'foreground', file: target, mask: ['flag_no_ui'] });
        }
        catch (err) {
            (0, log_1.log)('warn', 'failed to run', { target, error: err.message });
        }
    });
}
function open(target, wait) {
    // TODO: technically with ShellExecuteEx we should be able to reproduce the wait behaviour
    if (((winapi === null || winapi === void 0 ? void 0 : winapi.ShellExecuteEx) !== undefined) && !wait) {
        try {
            if (electron_1.ipcRenderer !== undefined) {
                electron_1.ipcRenderer.send('__opn_win32', target);
                return Promise.resolve();
            }
            else {
                try {
                    winapi === null || winapi === void 0 ? void 0 : winapi.ShellExecuteEx({ verb: 'open', show: 'foreground', file: target, mask: ['flag_no_ui'] });
                    return Promise.resolve();
                }
                catch (err) {
                    return Promise.reject(err);
                }
            }
        }
        catch (err) {
            if (err.systemCode === 1155) {
                return Promise.reject(new CustomErrors_1.MissingInterpreter('No default application set up for file type.', err.path));
            }
            else if (err.systemCode === 1223) {
                // Operation was canceled by the user.
                //  https://docs.microsoft.com/en-us/windows/win32/debug/system-error-codes--1000-1299-
                return Promise.resolve();
            }
            else {
                return Promise.reject(err);
            }
        }
    }
    else {
        // On non-Windows platforms Electron's shell.openExternal expects a valid URL and
        // will throw "Invalid URL" for filesystem paths. Detect URLs by scheme; otherwise
        // open local files/folders using shell.openPath instead.
        const isURL = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(target) || target.startsWith('www.');
        if (wait) {
            if (isURL) {
                return Promise.resolve(electron_1.shell.openExternal(target, { activate: true }));
            }
            else {
                return new Promise((resolve, reject) => {
                    electron_1.shell.openPath(target)
                        .then((msg) => {
                        if (msg) {
                            reject(new Error(msg));
                        }
                        else {
                            resolve();
                        }
                    })
                        .catch(reject);
                });
            }
        }
        else {
            if (isURL) {
                electron_1.shell.openExternal(target, { activate: true });
            }
            else {
                // Fire and forget, but log potential error string
                electron_1.shell.openPath(target).then((msg) => {
                    if (msg) {
                        (0, log_1.log)('warn', 'openPath failed', { target, error: msg });
                    }
                }).catch((err) => (0, log_1.log)('warn', 'openPath threw', { target, error: (err === null || err === void 0 ? void 0 : err.message) || err }));
            }
            return Promise.resolve();
        }
    }
}
exports.default = open;
