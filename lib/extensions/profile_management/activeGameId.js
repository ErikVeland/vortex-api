"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lastActiveProfileForGame = exports.activeGameId = exports.activeProfile = void 0;
const storeHelper_1 = require("../../util/storeHelper");
const re_reselect_1 = __importDefault(require("re-reselect"));
const activeProfile = (state) => {
    const profileId = (0, storeHelper_1.getSafe)(state, ['settings', 'profiles', 'activeProfileId'], undefined);
    return (0, storeHelper_1.getSafe)(state, ['persistent', 'profiles', profileId], undefined);
};
exports.activeProfile = activeProfile;
const activeGameId = (state) => {
    const profile = (0, exports.activeProfile)(state);
    return profile !== undefined ? profile.gameId : undefined;
};
exports.activeGameId = activeGameId;
const lastActiveProfiles = (state) => state.settings.profiles.lastActiveProfile;
exports.lastActiveProfileForGame = (0, re_reselect_1.default)(lastActiveProfiles, (state, gameId) => gameId, (lastActiveProfilesIn, gameId) => lastActiveProfilesIn[gameId])((state, gameId) => gameId);
