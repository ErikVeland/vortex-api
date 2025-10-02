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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExecGameVersion = exports.testExecProvider = exports.getExtGameVersion = exports.testExtProvider = void 0;
const fs_1 = require("../../../util/fs");
const lazyRequire_1 = __importDefault(require("../../../util/lazyRequire"));
const log_1 = require("../../../util/log");
const macOSGameCompatibility_1 = require("../../../util/macOSGameCompatibility");
const path_1 = __importDefault(require("path"));
const exeVersion = (0, lazyRequire_1.default)(() => require('exe-version'));
function testExtProvider(game, discovery) {
    return __awaiter(this, void 0, void 0, function* () {
        return Promise.resolve(game.getGameVersion !== undefined);
    });
}
exports.testExtProvider = testExtProvider;
function getExtGameVersion(game, discovery) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const version = yield game.getGameVersion(discovery.path, discovery.executable || game.executable());
            if (typeof version !== 'string') {
                return Promise.reject(new Error('getGameVersion functor returned an invalid type'));
            }
            return version;
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
exports.getExtGameVersion = getExtGameVersion;
function testExecProvider(game, discovery) {
    return __awaiter(this, void 0, void 0, function* () {
        const exeName = discovery.executable || game.executable();
        if (((discovery === null || discovery === void 0 ? void 0 : discovery.path) === undefined) || (exeName === undefined)) {
            // can be caused by a broken extension
            return Promise.resolve(false);
        }
        try {
            // Use macOS compatibility layer to resolve the correct executable path
            const normalizedPath = yield (0, macOSGameCompatibility_1.normalizeGamePathForMacOS)(discovery.path, game.id, exeName);
            const exePath = normalizedPath || path_1.default.join(discovery.path, exeName);
            yield (0, fs_1.statAsync)(exePath);
            const version = exeVersion.default(exePath);
            return version === '0.0.0'
                ? Promise.resolve(false)
                : Promise.resolve(true);
        }
        catch (err) {
            (0, log_1.log)('error', 'unable to test executable version fields', err);
            return Promise.resolve(false);
        }
    });
}
exports.testExecProvider = testExecProvider;
function getExecGameVersion(game, discovery) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const exeName = discovery.executable || game.executable();
            // Use macOS compatibility layer to resolve the correct executable path
            const normalizedPath = yield (0, macOSGameCompatibility_1.normalizeGamePathForMacOS)(discovery.path, game.id, exeName);
            const exePath = normalizedPath || path_1.default.join(discovery.path, exeName);
            const version = exeVersion.default(exePath);
            return Promise.resolve(version);
        }
        catch (err) {
            return Promise.resolve('0.0.0');
        }
    });
}
exports.getExecGameVersion = getExecGameVersion;
