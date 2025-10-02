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
Object.defineProperty(exports, "__esModule", { value: true });
const log_1 = require("../../../util/log");
const storeHelper_1 = require("../../../util/storeHelper");
const modTypeExtensions_1 = require("../../gamemode_management/util/modTypeExtensions");
const _ = __importStar(require("lodash"));
function allTypesSupported(activator, state, gameId, types) {
    if (activator === undefined) {
        return { errors: [{ description: t => t('No deployment method selected') }], warnings: [] };
    }
    return types.reduce((prev, type) => {
        const reason = activator.isSupported(state, gameId, type);
        if (reason !== undefined) {
            if (!_.isFunction(reason.description)) {
                (0, log_1.log)('error', 'deployment unavailable with no description', {
                    gameId, method: activator.id, reason: JSON.stringify(reason),
                });
                reason.description = () => '<Missing description, please report this and include a log file>';
            }
            const typeInfo = (0, modTypeExtensions_1.getModType)(type);
            const { deploymentEssential } = (0, storeHelper_1.getSafe)(typeInfo, ['options'], { deploymentEssential: true });
            prev[(deploymentEssential === false) ? 'warnings' : 'errors'].push(reason);
        }
        return prev;
    }, { errors: [], warnings: [] });
}
exports.default = allTypesSupported;
