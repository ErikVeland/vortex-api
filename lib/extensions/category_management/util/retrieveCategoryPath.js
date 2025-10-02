"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveCategoryName = exports.resolveCategoryId = exports.resolveCategoryPath = void 0;
const selectors_1 = require("../../../util/selectors");
const storeHelper_1 = require("../../../util/storeHelper");
const util_1 = require("../../../util/util");
function createCategoryDetailPath(categories, category, categoryPath, hideTopLevel, visited) {
    if (!(0, util_1.truthy)(categories[category])) {
        return null;
    }
    if (!hideTopLevel || (categories[category].parentCategory !== undefined)) {
        categoryPath = (categoryPath === '')
            ? categories[category].name
            : categories[category].name + ' --> ' + categoryPath;
    }
    visited.add(category);
    if ((categories[category].parentCategory !== undefined)
        && !visited.has(categories[category].parentCategory)) {
        return createCategoryDetailPath(categories, categories[category].parentCategory, categoryPath, hideTopLevel, visited);
    }
    else {
        return categoryPath;
    }
}
/**
 * retrieve the Category from the Store returning the full category path.
 *
 * @param {number} category
 * @param {Redux.Store<any>} store
 */
function resolveCategoryPath(category, state) {
    if (!(0, util_1.truthy)(category)) {
        return null;
    }
    let completePath = '';
    const gameId = (0, selectors_1.activeGameId)(state);
    const categories = (0, storeHelper_1.getSafe)(state, ['persistent', 'categories', gameId], {});
    const hideTopLevel = (0, storeHelper_1.getSafe)(state, ['settings', 'interface', 'hideTopLevelCategory'], false);
    if (categories[category] !== undefined) {
        completePath = createCategoryDetailPath(categories, category, '', hideTopLevel, new Set());
    }
    return completePath;
}
exports.resolveCategoryPath = resolveCategoryPath;
function resolveCategoryId(name, state) {
    const gameId = (0, selectors_1.activeGameId)(state);
    const categories = state.persistent.categories[gameId];
    const key = Object.keys(categories !== null && categories !== void 0 ? categories : {})
        .find(iter => categories[iter].name === name);
    if (key !== undefined) {
        return parseInt(key, 10);
    }
    else {
        return undefined;
    }
}
exports.resolveCategoryId = resolveCategoryId;
/**
 * retrieve the Category from the Store
 *
 * @param {number} category
 * @param {Redux.Store<any>} store
 */
function resolveCategoryName(category, state) {
    if (!(0, util_1.truthy)(category)) {
        return '';
    }
    const gameId = (0, selectors_1.activeGameId)(state);
    return (0, storeHelper_1.getSafe)(state, ['persistent', 'categories', gameId, category, 'name'], '');
}
exports.resolveCategoryName = resolveCategoryName;
