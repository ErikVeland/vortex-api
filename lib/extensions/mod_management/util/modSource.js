"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerModSource = exports.getModSource = exports.getModSources = void 0;
const modSources = [];
function getModSources() {
    return modSources;
}
exports.getModSources = getModSources;
function getModSource(id) {
    return modSources.find(iter => iter.id === id);
}
exports.getModSource = getModSource;
function registerModSource(id, name, onBrowse, options) {
    modSources.push({ id, name, onBrowse, options });
}
exports.registerModSource = registerModSource;
