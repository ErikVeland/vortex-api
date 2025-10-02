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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Debouncer_1 = __importDefault(require("./Debouncer"));
const fs = __importStar(require("./fs"));
const getVortexPath_1 = __importDefault(require("./getVortexPath"));
const log_1 = require("./log");
const util_1 = require("./util");
const bluebird_1 = __importDefault(require("bluebird"));
const electron_1 = require("electron");
const _ = __importStar(require("lodash"));
const path = __importStar(require("path"));
const url_1 = require("url");
function asarUnpacked(input) {
    return input.replace('app.asar' + path.sep, 'app.asar.unpacked' + path.sep);
}
function cachePath() {
    return path.join((0, getVortexPath_1.default)('temp'), 'css-cache.json');
}
if (electron_1.ipcMain !== undefined) {
    let initial = true;
    const renderSASSCB = (evt, stylesheets, requested) => {
        let cache;
        if (requested) {
            try {
                // TODO: evil sync read
                cache = JSON.parse(fs.readFileSync(cachePath(), { encoding: 'utf8' }));
                if (_.isEqual(cache.stylesheets, stylesheets)) {
                    evt.sender.send('__renderSASS_result', null, cache.css);
                    (0, log_1.log)('debug', 'using cached css', { cached: cache.stylesheets, stylesheets });
                    if (requested && initial) {
                        initial = false;
                        renderSASSCB(evt, stylesheets, false);
                    }
                    return;
                }
                (0, log_1.log)('debug', 'updating css cache', {
                    cached: cache.stylesheets,
                    current: stylesheets,
                });
            }
            catch (err) {
                (0, log_1.log)('debug', 'no css cache', { cachePath: cachePath() });
            }
        }
        else {
            (0, log_1.log)('debug', 'updating css cache, just to be sure');
        }
        let themePath = '.';
        let sassIndex = stylesheets.map(name => {
            const imp = `@import "${name.replace(/\\/g, '\\\\')}";`;
            // slightly hackish but I think this should work.
            // imports ending in .scss are extensions,
            // imports with no path are the core files.
            // what's left is the imports for the theme.
            // In addition, the style.scss from the theme should be the very last
            // import so even without the condition, the very last item should have
            // the correct path
            if ((path.dirname(name) !== '.') && (path.extname(name) !== '.scss')) {
                themePath = path.dirname(name);
            }
            if (path.extname(name) === '.scss') {
                // nest every extension-provided rule in '*, #added_by_<extname>'
                // this way it's easier to find out where a rule comes from
                // that breaks the layout.
                // the #added_by_ selector should never match anything, * matches
                // everything without modifying the specificity of the selector, so
                // this change shouldn't affect how the rule works
                const extname = (0, util_1.sanitizeCSSId)(path.basename(name, '.scss'));
                return `*, #added_by_${extname} { ${imp} }\n`;
            }
            else {
                return imp + '\n';
            }
        }).join('\n');
        sassIndex = `$theme-path: "${(0, url_1.pathToFileURL)(themePath)}";\n` + sassIndex;
        // development builds are always versioned as 0.0.1
        const isDevel = (process.env.NODE_ENV === 'development');
        const assetsPath = path.join((0, getVortexPath_1.default)('assets_unpacked'), 'css');
        const modulesPath = (0, getVortexPath_1.default)('modules_unpacked');
        const applicationPath = (0, getVortexPath_1.default)('application');
        const srcStylesPath = path.join(applicationPath, 'src', 'stylesheets');
        // Add additional paths to handle different relative import patterns
        const rootPath = applicationPath;
        const appPath = path.join(applicationPath, 'app');
        const assetsRootPath = path.join(appPath, 'assets', 'css');
        const assetsBasePath = path.join(appPath, 'assets'); // Add this path for ../../../assets/css resolution
        const replyEvent = requested
            ? '__renderSASS_result'
            : '__renderSASS_update';
        /*
        process.env.SASS_BINARY_PATH = path.resolve(getVortexPath('modules'), 'node-sass', 'bin',
          `${getCurrentPlatform()}-${process.arch}-${process.versions.modules}`, 'node-sass.node');
        */
        const sass = require('sass');
        setTimeout(() => {
            const started = Date.now();
            sass.render({
                outFile: path.join(assetsPath, 'theme.css'),
                includePaths: [
                    assetsPath,
                    modulesPath,
                    srcStylesPath,
                    rootPath,
                    appPath,
                    assetsRootPath,
                    assetsBasePath // Additional path for assets resolution
                ],
                data: sassIndex,
                outputStyle: isDevel ? 'expanded' : 'compressed',
            }, (err, output) => {
                var _a;
                (0, log_1.log)('info', 'sass compiled in', `${Date.now() - started}ms`);
                if ((_a = evt.sender) === null || _a === void 0 ? void 0 : _a.isDestroyed()) {
                    return;
                }
                if (err !== null) {
                    // the error has its own class and its message is missing relevant information
                    evt.sender.send(replyEvent, new Error(err.formatted));
                }
                else {
                    // remove utf8-bom if it's there
                    const css = _.isEqual(Array.from(output.css.slice(0, 3)), [0xEF, 0xBB, 0xBF])
                        ? output.css.slice(3)
                        : output.css;
                    evt.sender.send(replyEvent, null, css.toString());
                    fs.writeFileAsync(cachePath(), JSON.stringify({
                        stylesheets,
                        css: css.toString(),
                    }), { encoding: 'utf8' })
                        .catch(() => null);
                }
            });
        }, requested ? 0 : 2000);
    };
    electron_1.ipcMain.on('__renderSASS', (evt, stylesheets) => renderSASSCB(evt, stylesheets, true));
}
class StyleManager {
    constructor(api) {
        this.mAutoRefresh = false;
        this.mSetQueue = bluebird_1.default.resolve();
        // Initialize core stylesheets with full paths to assets directory
        const assetsPath = (0, getVortexPath_1.default)('assets_unpacked');
        (0, log_1.log)('debug', 'StyleManager constructor - initializing core stylesheets with assets path', {
            assetsPath
        });
        this.mPartials = [
            { key: '__functions', file: path.join(assetsPath, 'css', 'functions.scss') },
            { key: '__variables', file: path.join(assetsPath, 'css', 'variables.scss') },
            { key: 'variables', file: undefined },
            { key: '__details', file: path.join(assetsPath, 'css', 'details.scss') },
            { key: 'details', file: undefined },
            { key: '__thirdparty', file: path.join(assetsPath, 'css', 'thirdparty.scss') },
            { key: '__desktop', file: path.join(assetsPath, 'css', 'desktop.scss') },
            { key: '__style', file: path.join(assetsPath, 'css', 'style.scss') },
            { key: 'style', file: undefined },
        ];
        (0, log_1.log)('debug', 'StyleManager constructor - initialized mPartials with full paths', {
            partials: this.mPartials
        });
        (0, log_1.log)('debug', 'StyleManager initialized with partials', {
            partials: this.mPartials,
            assetsPath: (0, getVortexPath_1.default)('assets_unpacked')
        });
        this.mRenderDebouncer = new Debouncer_1.default(() => {
            return this.render()
                .catch(err => {
                api.showErrorNotification('Style failed to compile', err, {
                    allowReport: false,
                });
            });
        }, StyleManager.RENDER_DELAY, true);
        electron_1.ipcRenderer.on('__renderSASS_result', (evt, err, css) => {
            (0, log_1.log)('debug', 'StyleManager IPC __renderSASS_result - received SASS compilation result', {
                hasError: !!err,
                errorMessage: err === null || err === void 0 ? void 0 : err.message,
                cssLength: (css === null || css === void 0 ? void 0 : css.length) || 0,
                expectingResult: !!this.mExpectingResult
            });
            if (this.mExpectingResult === undefined) {
                (0, log_1.log)('warn', 'StyleManager IPC __renderSASS_result - unexpected sass render result, no pending promise');
                return;
            }
            if (err !== null) {
                (0, log_1.log)('error', 'StyleManager IPC __renderSASS_result - SASS compilation failed', {
                    error: err.message,
                    stack: err.stack
                });
                this.mExpectingResult.reject(err);
            }
            else {
                (0, log_1.log)('debug', 'StyleManager IPC __renderSASS_result - SASS compilation successful, resolving promise');
                this.mExpectingResult.resolve(css);
            }
            this.mExpectingResult = undefined;
        });
        electron_1.ipcRenderer.on('__renderSASS_update', (evt, err, css) => {
            (0, log_1.log)('debug', 'StyleManager IPC __renderSASS_update - received SASS update', {
                hasError: !!err,
                errorMessage: err === null || err === void 0 ? void 0 : err.message,
                cssLength: (css === null || css === void 0 ? void 0 : css.length) || 0
            });
            if (err !== null) {
                // logging as warning because we don't know if this will be a problem
                // but it may lead to a messed up look
                (0, log_1.log)('warn', 'StyleManager IPC __renderSASS_update - css render failed', {
                    error: err.message,
                    stack: err.stack
                });
            }
            else {
                (0, log_1.log)('debug', 'StyleManager IPC __renderSASS_update - applying updated CSS');
                this.applyCSS(css);
            }
        });
    }
    startAutoUpdate() {
        this.mAutoRefresh = true;
    }
    clearCache() {
        this.mSetQueue = this.mSetQueue.then(() => fs.removeAsync(cachePath())
            .catch({ code: 'ENOENT' }, () => null)
            .catch(err => (0, log_1.log)('error', 'failed to remove css cache', { error: err.message })));
    }
    /**
     * insert or replace a sheet.
     * By default, the sheets "variables", "details" and "style" are intended to customize the
     * look of the application.
     * - "variables" is a set of variables representing colors, sizes and
     *   margins that will be used throughout the application.
     * - "details" applies these variables to different generic controls (like tabs, lists, ...)
     * - "style" is where you should customize individual controls with css rules
     *
     * If your extension sets a sheet that didn't exist before then that sheet will
     * remain with the style and not be touched by anyone else (unless you have a name collision).
     *
     * new sheets will be inserted before the "style" sheet but after everything else. This allows
     * themes to affect extension styles
     *
     * @param {string} key identify the key to set. If this is an existing sheet, that sheet will be
     *                     replaced
     * @param {string} filePath path of the corresponding stylesheet file
     */
    setSheet(key, filePath) {
        (0, log_1.log)('debug', 'StyleManager setSheet - setting stylesheet', {
            key,
            filePath,
            isAbsolute: path.isAbsolute(filePath || ''),
            extension: path.extname(filePath || ''),
            currentPartials: this.mPartials.length
        });
        try {
            const statProm = () => (filePath === undefined)
                ? bluebird_1.default.resolve(undefined)
                : (path.extname(filePath) === '')
                    ? bluebird_1.default.any([fs.statAsync(filePath + '.scss'), fs.statAsync(filePath + '.css')])
                        .then(() => null)
                    : fs.statAsync(filePath).then(() => null);
            this.mSetQueue = this.mSetQueue
                .then(() => statProm())
                .then(() => {
                const idx = this.mPartials.findIndex(partial => partial.key === key);
                const oldPartial = idx !== -1 ? this.mPartials[idx] : null;
                if (idx !== -1) {
                    this.mPartials[idx] = { key, file: filePath };
                    (0, log_1.log)('debug', 'StyleManager setSheet - replaced existing partial', {
                        key,
                        oldFile: oldPartial === null || oldPartial === void 0 ? void 0 : oldPartial.file,
                        newFile: filePath,
                        index: idx
                    });
                }
                else {
                    this.mPartials.splice(this.mPartials.length - 2, 0, { key, file: filePath });
                    (0, log_1.log)('debug', 'StyleManager setSheet - added new partial', {
                        key,
                        filePath,
                        insertIndex: this.mPartials.length - 3,
                        totalPartials: this.mPartials.length
                    });
                }
                (0, log_1.log)('debug', 'StyleManager setSheet - updated partials array', {
                    allPartials: this.mPartials,
                    autoRefresh: this.mAutoRefresh
                });
                if (this.mAutoRefresh) {
                    this.mRenderDebouncer.schedule(undefined);
                    (0, log_1.log)('debug', 'StyleManager setSheet - scheduled render due to auto refresh');
                }
            })
                .catch(err => {
                (0, log_1.log)('warn', 'StyleManager setSheet - stylesheet can\'t be read', {
                    key,
                    filePath,
                    error: err.message
                });
            });
        }
        catch (err) {
            (0, log_1.log)('warn', 'StyleManager setSheet - exception during setSheet', {
                key,
                path: filePath,
                err: err.message
            });
        }
    }
    renderNow() {
        this.mSetQueue = this.mSetQueue.then(() => new bluebird_1.default((resolve, reject) => {
            this.mRenderDebouncer.runNow(err => {
                if (err !== null) {
                    return reject(err);
                }
                resolve();
            });
        }));
        return this.mSetQueue;
    }
    render() {
        const filteredPartials = this.mPartials.filter(partial => partial.file !== undefined);
        const stylesheets = filteredPartials
            .map(partial => path.isAbsolute(partial.file)
            ? asarUnpacked(partial.file)
            : partial.file);
        (0, log_1.log)('debug', 'StyleManager render - processing stylesheets', {
            allPartials: this.mPartials,
            filteredPartials: filteredPartials,
            finalStylesheets: stylesheets,
            excludedPartials: this.mPartials.filter(partial => partial.file === undefined)
        });
        return new bluebird_1.default((resolve, reject) => {
            this.mExpectingResult = { resolve, reject };
            electron_1.ipcRenderer.send('__renderSASS', stylesheets);
        })
            .then((css) => {
            (0, log_1.log)('debug', 'StyleManager render - received CSS', {
                cssLength: (css === null || css === void 0 ? void 0 : css.length) || 0
            });
            this.applyCSS(css);
        });
    }
    applyCSS(css) {
        const style = document.createElement('style');
        style.id = 'theme';
        style.type = 'text/css';
        style.innerHTML = css;
        const head = document.getElementsByTagName('head')[0];
        let found = false;
        (0, log_1.log)('debug', 'StyleManager applyCSS - injecting CSS', {
            cssLength: (css === null || css === void 0 ? void 0 : css.length) || 0,
            existingThemeElements: Array.from(head.children).filter(el => el.id === 'theme').length
        });
        for (let i = 0; i < head.children.length && !found; ++i) {
            if (head.children.item(i).id === 'theme') {
                head.replaceChild(style, head.children.item(i));
                found = true;
                (0, log_1.log)('debug', 'StyleManager applyCSS - replaced existing theme element');
            }
        }
        if (!found) {
            head.appendChild(style);
            (0, log_1.log)('debug', 'StyleManager applyCSS - appended new theme element');
        }
        // Verify injection
        const injectedElement = document.getElementById('theme');
        (0, log_1.log)('debug', 'StyleManager applyCSS - verification', {
            elementExists: !!injectedElement,
            totalHeadChildren: head.children.length
        });
    }
}
StyleManager.RENDER_DELAY = 200;
exports.default = StyleManager;
