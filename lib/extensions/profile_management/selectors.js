"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lastActiveProfileForGame = exports.gameProfiles = void 0;
exports.profileById = profileById;
const re_reselect_1 = __importDefault(require("re-reselect"));
const reselect_1 = require("reselect");
const activeGameId_1 = require("./activeGameId");
const profilesBase = (state) => state.persistent.profiles;
const lastActiveProfiles = (state) => state.settings.profiles.lastActiveProfile;
exports.gameProfiles = (0, reselect_1.createSelector)(activeGameId_1.activeGameId, profilesBase, (gameId, profiles) => {
    return Object.keys(profiles)
        .filter((id) => profiles[id].gameId === gameId)
        .map((id) => profiles[id]);
});
const profileByIdImpl = (0, re_reselect_1.default)(profilesBase, (state, profileId) => profileId, (profilesBaseIn, profileId) => profilesBaseIn[profileId])((state, profileId) => profileId);
function profileById(state, profileId) {
    if (profileId === undefined) {
        return undefined;
    }
    return profileByIdImpl(state, profileId);
}
exports.lastActiveProfileForGame = (0, re_reselect_1.default)(lastActiveProfiles, (state, gameId) => gameId, (lastActiveProfilesIn, gameId) => lastActiveProfilesIn[gameId])((state, gameId) => gameId);
