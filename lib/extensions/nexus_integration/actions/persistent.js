"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setNewestVersion = exports.setUserInfo = void 0;
const safeCreateAction_1 = __importDefault(require("../../../actions/safeCreateAction"));
exports.setUserInfo = (0, safeCreateAction_1.default)('SET_USER_INFO', (input) => input);
exports.setNewestVersion = (0, safeCreateAction_1.default)('SET_NEWEST_VERSION', (version) => version);
