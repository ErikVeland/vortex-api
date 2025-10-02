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
exports.getDownloadPathPattern = void 0;
const getVortexPath_1 = __importDefault(require("../../../util/getVortexPath"));
const makeCaseInsensitive_1 = __importDefault(require("../../../util/makeCaseInsensitive"));
const platform_1 = require("../../../util/platform");
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const string_template_1 = __importDefault(require("string-template"));
let userData;
function getDownloadPathPattern(pattern) {
    return pattern || path.join('{USERDATA}', 'downloads');
}
exports.getDownloadPathPattern = getDownloadPathPattern;
function getDownloadPath(pattern, gameId) {
    if (userData === undefined) {
        userData = (0, getVortexPath_1.default)('userData');
    }
    const formatKeys = (0, makeCaseInsensitive_1.default)({
        userdata: userData,
        username: os.userInfo().username,
    });
    let result = ((gameId !== undefined) && (gameId !== '__invalid'))
        ? path.join((0, string_template_1.default)(getDownloadPathPattern(pattern), formatKeys), gameId)
        : (0, string_template_1.default)(getDownloadPathPattern(pattern), formatKeys);
    // on windows a path of the form \foo\bar will be identified as absolute
    // because why would anything make sense on windows?
    if (!path.isAbsolute(result)
        || ((0, platform_1.isWindows)()
            && ((result[0] === '\\') && (result[1] !== '\\'))
            || (result[0] === '/') && (result[1] !== '/'))) {
        result = path.resolve((0, getVortexPath_1.default)('userData'), result);
    }
    return result;
}
exports.default = getDownloadPath;
