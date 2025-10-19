"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDeploymentMethod = registerDeploymentMethod;
exports.getAllActivators = getAllActivators;
exports.getSupportedActivators = getSupportedActivators;
exports.getSelectedActivator = getSelectedActivator;
exports.getCurrentActivator = getCurrentActivator;
exports.getActivator = getActivator;
const storeHelper_1 = require("../../../util/storeHelper");
const util_1 = require("../../../util/util");
const getGame_1 = require("../../gamemode_management/util/getGame");
const activeGameId_1 = require("../../profile_management/activeGameId");
const log_1 = require("../../../util/log");
const allTypesSupported_1 = __importDefault(require("./allTypesSupported"));
const activators = [];
function byPriority(lhs, rhs) {
    return lhs.priority - rhs.priority;
}
function registerDeploymentMethod(activator) {
    activators.push(activator);
    activators.sort(byPriority);
}
function getAllActivators() {
    return activators;
}
/**
 * return only those activators that are supported based on the current state
 *
 * @param {*} state
 * @returns {IDeploymentMethod[]}
 */
function getSupportedActivators(state) {
    const gameId = (0, activeGameId_1.activeGameId)(state);
    const discovery = state.settings.gameMode.discovered[gameId];
    if ((discovery === undefined) || (discovery.path === undefined)) {
        return [];
    }
    const game = (0, getGame_1.getGame)(gameId);
    if (game === undefined) {
        return [];
    }
    const modPaths = game.getModPaths(discovery.path);
    const modTypes = Object.keys(modPaths)
        .filter(typeId => (0, util_1.truthy)(modPaths[typeId]));
    return activators.filter(act => (0, allTypesSupported_1.default)(act, state, gameId, modTypes).errors.length === 0);
}
function getSelectedActivator(state, gameId) {
    const activatorId = state.settings.mods.activator[gameId];
    return (activatorId !== undefined)
        ? activators.find((act) => act.id === activatorId)
        : undefined;
}
function getCurrentActivator(state, gameId, allowDefault) {
    var _a;
    let activator = getSelectedActivator(state, gameId);
    const gameDiscovery = (0, storeHelper_1.getSafe)(state, ['settings', 'gameMode', 'discovered', gameId], undefined);
    if ((gameDiscovery === null || gameDiscovery === void 0 ? void 0 : gameDiscovery.path) === undefined) {
        // activator for a game that's not discovered doesn't really make sense
        return undefined;
    }
    const game = (0, getGame_1.getGame)(gameId);
    if ((game === null || game === void 0 ? void 0 : game.getModPaths) === undefined) {
        // Game is discovered but the gameModeManager isn't aware of it ?
        //  fantastic. https://github.com/Nexus-Mods/Vortex/issues/7079
        return undefined;
    }
    const modPaths = game.getModPaths(gameDiscovery.path);
    const types = Object.keys(modPaths)
        .filter(typeId => (0, util_1.truthy)(modPaths[typeId]));
    // if no activator has been selected for the game, allow using a default
    if (allowDefault && (activator === undefined)) {
        if ((game !== undefined) && ((gameDiscovery === null || gameDiscovery === void 0 ? void 0 : gameDiscovery.path) !== undefined)) {
            const modTypes = Object.keys(modPaths);
            const hadWarnings = [];
            (0, log_1.log)('debug', 'No activator selected, resolving default', { gameId, allowDefault, types: modTypes });
            activator = activators.find(act => {
                const problems = (0, allTypesSupported_1.default)(act, state, gameId, modTypes);
                if (problems.errors.length === 0) {
                    if (problems.warnings.length > 0) {
                        hadWarnings.push(act);
                    }
                    else {
                        return true;
                    }
                }
                return false;
            });
            // prefer an activator without warnings but if there is none, use one with warnings
            if ((activator === undefined) && (hadWarnings.length > 0)) {
                activator = hadWarnings[0];
                (0, log_1.log)('info', 'Selected default activator with warnings', { gameId, activatorId: activator.id });
            }
            else if (activator !== undefined) {
                (0, log_1.log)('info', 'Selected default activator', { gameId, activatorId: activator.id });
            }
        }
    }
    if (activator === undefined) {
        (0, log_1.log)('warn', 'No supported activator found', { gameId, types, allowDefault });
        // Emit diagnostics: list supported activators for visibility
        const supported = getSupportedActivators(state);
        const ids = (supported === null || supported === void 0 ? void 0 : supported.map(a => a.id)) || [];
        (0, log_1.log)('debug', 'Supported activators snapshot', { gameId, supportedIds: ids });
        return undefined;
    }
    const support = (0, allTypesSupported_1.default)(activator, state, gameId, types);
    if (support.errors.length !== 0) {
        // if the selected activator is no longer supported, don't use it
        (0, log_1.log)('warn', 'Selected activator not supported for current types', {
            gameId,
            activatorId: activator.id,
            errorCount: support.errors.length,
            warningCount: ((_a = support.warnings) === null || _a === void 0 ? void 0 : _a.length) || 0,
        });
        return undefined;
    }
    (0, log_1.log)('debug', 'Using activator', { gameId, activatorId: activator.id });
    return activator;
}
function getActivator(activatorId) {
    return activators.find(act => act.id === activatorId);
}
