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
exports.resolveInstallPath = exports.getInstallPathPattern = void 0;
const getVortexPath_1 = __importDefault(require("../../../util/getVortexPath"));
const makeCaseInsensitive_1 = __importDefault(require("../../../util/makeCaseInsensitive"));
const platform_1 = require("../../../util/platform");
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const string_template_1 = __importDefault(require("string-template"));
function getInstallPathPattern(pattern) {
    return pattern || path.join('{USERDATA}', '{GAME}', 'mods');
}
exports.getInstallPathPattern = getInstallPathPattern;
function resolveInstallPath(input, gameId) {
    const formatKeys = (0, makeCaseInsensitive_1.default)({
        userdata: (0, getVortexPath_1.default)('userData'),
        username: os.userInfo().username,
        game: gameId,
    });
    return (0, string_template_1.default)(input, formatKeys);
}
exports.resolveInstallPath = resolveInstallPath;
function getInstallPath(pattern, gameId) {
    if (gameId === undefined) {
        throw new Error('gameId can\'t be undefined');
    }
    let result = resolveInstallPath(getInstallPathPattern(pattern), gameId);
    // on windows a path of the form \foo\bar or /foo/bar will be identified as absolute
    // even though it's not, it just isn't. It is relative to the drive of the current working
    // directory - which makes no fing sense since windows is supposed to have separate cwds
    // per drive and ... uuuuugh windows...
    if (!path.isAbsolute(result)
        || ((0, platform_1.isWindows)()
            && ((result[0] === '\\') && (result[1] !== '\\'))
            || (result[0] === '/') && (result[1] !== '/'))) {
        result = path.resolve((0, getVortexPath_1.default)('userData'), result);
    }
    return result;
}
exports.default = getInstallPath;
