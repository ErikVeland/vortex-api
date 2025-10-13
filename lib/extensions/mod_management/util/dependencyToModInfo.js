"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dependencyToModInfo = dependencyToModInfo;
exports.dependenciesToModInfos = dependenciesToModInfos;
exports.getDependencyDisplayName = getDependencyDisplayName;
exports.isDependencyComplete = isDependencyComplete;
exports.extractModInfoFromObject = extractModInfoFromObject;
/**
 * Converts a dependency object to an IModInfo object
 * @param dependency The dependency object to convert
 * @param gameId The game ID for the mod info
 * @returns A properly formatted IModInfo object
 */
function dependencyToModInfo(dependency, gameId) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    // Extract mod info from lookup results if available
    const primaryLookupResult = (_b = (_a = dependency.lookupResults) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value;
    // Get mod reference info
    const reference = dependency.reference;
    // Get mod info if the dependency is already installed
    const mod = dependency.mod;
    // Determine file name - prioritize from various sources
    const fileName = (primaryLookupResult === null || primaryLookupResult === void 0 ? void 0 : primaryLookupResult.fileName)
        || (reference === null || reference === void 0 ? void 0 : reference.logicalFileName)
        || ((_c = mod === null || mod === void 0 ? void 0 : mod.attributes) === null || _c === void 0 ? void 0 : _c.logicalFileName)
        || ((_d = mod === null || mod === void 0 ? void 0 : mod.attributes) === null || _d === void 0 ? void 0 : _d.fileName)
        || (reference === null || reference === void 0 ? void 0 : reference.description)
        || 'Unknown';
    // Determine file size - try to get from various sources
    const fileSizeBytes = (primaryLookupResult === null || primaryLookupResult === void 0 ? void 0 : primaryLookupResult.fileSizeBytes)
        || ((_e = mod === null || mod === void 0 ? void 0 : mod.attributes) === null || _e === void 0 ? void 0 : _e.fileSizeBytes)
        || ((_f = mod === null || mod === void 0 ? void 0 : mod.attributes) === null || _f === void 0 ? void 0 : _f.size)
        || 0;
    // Build the IModInfo object
    const modInfo = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ fileName,
        fileSizeBytes,
        gameId, 
        // Required fields with fallbacks
        fileVersion: (reference === null || reference === void 0 ? void 0 : reference.versionMatch) || (primaryLookupResult === null || primaryLookupResult === void 0 ? void 0 : primaryLookupResult.fileVersion) || ((_g = mod === null || mod === void 0 ? void 0 : mod.attributes) === null || _g === void 0 ? void 0 : _g.version) || '1.0', fileMD5: (reference === null || reference === void 0 ? void 0 : reference.fileMD5) || ((_h = mod === null || mod === void 0 ? void 0 : mod.attributes) === null || _h === void 0 ? void 0 : _h.fileMD5) || '', sourceURI: (primaryLookupResult === null || primaryLookupResult === void 0 ? void 0 : primaryLookupResult.sourceURI) || '' }, ((primaryLookupResult === null || primaryLookupResult === void 0 ? void 0 : primaryLookupResult.logicalFileName) && { logicalFileName: primaryLookupResult.logicalFileName })), ((primaryLookupResult === null || primaryLookupResult === void 0 ? void 0 : primaryLookupResult.source) && { source: primaryLookupResult.source })), ((primaryLookupResult === null || primaryLookupResult === void 0 ? void 0 : primaryLookupResult.domainName) && { domainName: primaryLookupResult.domainName })), ((primaryLookupResult === null || primaryLookupResult === void 0 ? void 0 : primaryLookupResult.expires) && { expires: primaryLookupResult.expires })), ((primaryLookupResult === null || primaryLookupResult === void 0 ? void 0 : primaryLookupResult.archived) !== undefined && { archived: primaryLookupResult.archived })), ((primaryLookupResult === null || primaryLookupResult === void 0 ? void 0 : primaryLookupResult.status) && { status: primaryLookupResult.status })), ((primaryLookupResult === null || primaryLookupResult === void 0 ? void 0 : primaryLookupResult.details) || (reference === null || reference === void 0 ? void 0 : reference.repo) || (mod === null || mod === void 0 ? void 0 : mod.attributes) && {
        details: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, ((primaryLookupResult === null || primaryLookupResult === void 0 ? void 0 : primaryLookupResult.details) || {})), (((_j = reference === null || reference === void 0 ? void 0 : reference.repo) === null || _j === void 0 ? void 0 : _j.modId) && { modId: reference.repo.modId })), (((_k = reference === null || reference === void 0 ? void 0 : reference.repo) === null || _k === void 0 ? void 0 : _k.fileId) && { fileId: reference.repo.fileId })), (((_l = mod === null || mod === void 0 ? void 0 : mod.attributes) === null || _l === void 0 ? void 0 : _l.author) && { author: mod.attributes.author })), (((_m = mod === null || mod === void 0 ? void 0 : mod.attributes) === null || _m === void 0 ? void 0 : _m.description) && { description: mod.attributes.description })), (((_o = mod === null || mod === void 0 ? void 0 : mod.attributes) === null || _o === void 0 ? void 0 : _o.homepage) && { homepage: mod.attributes.homepage })), (((_p = mod === null || mod === void 0 ? void 0 : mod.attributes) === null || _p === void 0 ? void 0 : _p.category) && { category: mod.attributes.category }))
    })), ((primaryLookupResult === null || primaryLookupResult === void 0 ? void 0 : primaryLookupResult.rules) && { rules: primaryLookupResult.rules })), (((_q = dependency.extra) === null || _q === void 0 ? void 0 : _q.rules) && { rules: dependency.extra.rules }));
    // Remove undefined values to keep the object clean
    const cleanModInfo = Object.fromEntries(Object.entries(modInfo).filter(([_, value]) => value !== undefined));
    return cleanModInfo;
}
/**
 * Converts multiple dependencies to IModInfo objects
 * @param dependencies Array of dependency objects to convert
 * @param gameId The game ID for the mod infos
 * @returns Array of properly formatted IModInfo objects
 */
function dependenciesToModInfos(dependencies, gameId) {
    return dependencies
        .filter(dep => dep && !('error' in dep)) // Filter out dependency errors
        .map(dep => dependencyToModInfo(dep, gameId));
}
/**
 * Extracts the best available mod name from a dependency
 * @param dependency The dependency object
 * @returns The most appropriate display name for the mod
 */
function getDependencyDisplayName(dependency) {
    var _a, _b, _c, _d, _e;
    const primaryLookupResult = (_b = (_a = dependency.lookupResults) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value;
    const reference = dependency.reference;
    const mod = dependency.mod;
    return ((_c = primaryLookupResult === null || primaryLookupResult === void 0 ? void 0 : primaryLookupResult.details) === null || _c === void 0 ? void 0 : _c.modId)
        || ((_d = mod === null || mod === void 0 ? void 0 : mod.attributes) === null || _d === void 0 ? void 0 : _d.customFileName)
        || ((_e = mod === null || mod === void 0 ? void 0 : mod.attributes) === null || _e === void 0 ? void 0 : _e.name)
        || (reference === null || reference === void 0 ? void 0 : reference.description)
        || (reference === null || reference === void 0 ? void 0 : reference.logicalFileName)
        || (primaryLookupResult === null || primaryLookupResult === void 0 ? void 0 : primaryLookupResult.fileName)
        || 'Unknown Mod';
}
/**
 * Checks if a dependency has sufficient information to create a valid ModInfo
 * @param dependency The dependency object to validate
 * @returns True if the dependency has sufficient information
 */
function isDependencyComplete(dependency) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    if (!dependency || 'error' in dependency) {
        return false;
    }
    const hasFileName = !!(((_c = (_b = (_a = dependency.lookupResults) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value) === null || _c === void 0 ? void 0 : _c.fileName) ||
        ((_d = dependency.reference) === null || _d === void 0 ? void 0 : _d.logicalFileName) ||
        ((_f = (_e = dependency.mod) === null || _e === void 0 ? void 0 : _e.attributes) === null || _f === void 0 ? void 0 : _f.logicalFileName) ||
        ((_h = (_g = dependency.mod) === null || _g === void 0 ? void 0 : _g.attributes) === null || _h === void 0 ? void 0 : _h.fileName) ||
        ((_j = dependency.reference) === null || _j === void 0 ? void 0 : _j.description));
    const hasIdentification = !!(((_k = dependency.reference) === null || _k === void 0 ? void 0 : _k.fileMD5) ||
        ((_m = (_l = dependency.reference) === null || _l === void 0 ? void 0 : _l.repo) === null || _m === void 0 ? void 0 : _m.modId) ||
        ((_p = (_o = dependency.reference) === null || _o === void 0 ? void 0 : _o.repo) === null || _p === void 0 ? void 0 : _p.fileId) ||
        ((_q = dependency.mod) === null || _q === void 0 ? void 0 : _q.id));
    return hasFileName && hasIdentification;
}
/**
 * Extracts and constructs an IModInfo object from a complex nested object structure
 * @param obj The complex object containing mod information (could have choices, patches, download.modInfo, etc.)
 * @param gameId The game ID for the mod info
 * @returns A properly formatted IModInfo object extracted from the nested data
 */
function extractModInfoFromObject(obj, gameId) {
    // Helper function to safely get nested values
    const getValue = (path, fallback = undefined) => {
        var _a;
        return (_a = path.split('.').reduce((current, key) => current === null || current === void 0 ? void 0 : current[key], obj)) !== null && _a !== void 0 ? _a : fallback;
    };
    // Helper function to get the first available value from multiple paths
    const getFirstValue = (...paths) => {
        for (const path of paths) {
            const value = getValue(path);
            if (value !== undefined && value !== null && value !== '') {
                return value;
            }
        }
        return undefined;
    };
    // Extract core required fields with multiple fallback paths
    const fileName = getFirstValue('download.modInfo.fileName', 'modInfo.fileName', 'fileName', 'reference.logicalFileName') || 'Unknown';
    const fileSizeBytes = getFirstValue('download.modInfo.fileSizeBytes', 'modInfo.fileSizeBytes', 'fileSizeBytes', 'reference.fileSizeBytes') || 0;
    const fileVersion = getFirstValue('download.modInfo.fileVersion', 'modInfo.fileVersion', 'fileVersion', 'reference.versionMatch', 'version') || '1.0';
    const fileMD5 = getFirstValue('download.modInfo.fileMD5', 'modInfo.fileMD5', 'fileMD5', 'reference.fileMD5', 'md5') || '';
    const sourceURI = getFirstValue('download.modInfo.sourceURI', 'modInfo.sourceURI', 'sourceURI', 'download.url', 'url') || '';
    // Extract optional fields
    const logicalFileName = getFirstValue('download.modInfo.logicalFileName', 'modInfo.logicalFileName', 'logicalFileName', 'reference.logicalFileName');
    const source = getFirstValue('download.modInfo.source', 'modInfo.source', 'source', 'reference.source');
    const domainName = getFirstValue('download.modInfo.domainName', 'modInfo.domainName', 'domainName', 'reference.domainName');
    const expires = getFirstValue('download.modInfo.expires', 'modInfo.expires', 'expires');
    const archived = getFirstValue('download.modInfo.archived', 'modInfo.archived', 'archived');
    const status = getFirstValue('download.modInfo.status', 'modInfo.status', 'status');
    // Extract rules from various possible locations
    const rules = getFirstValue('download.modInfo.rules', 'modInfo.rules', 'rules', 'reference.rules');
    // Extract details object with nested information
    const details = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (getFirstValue('download.modInfo.details', 'modInfo.details', 'details') || {})), (getFirstValue('homepage', 'download.modInfo.homepage', 'modInfo.homepage') && {
        homepage: getFirstValue('homepage', 'download.modInfo.homepage', 'modInfo.homepage')
    })), (getFirstValue('category', 'download.modInfo.category', 'modInfo.category') && {
        category: getFirstValue('category', 'download.modInfo.category', 'modInfo.category')
    })), (getFirstValue('description', 'download.modInfo.description', 'modInfo.description') && {
        description: getFirstValue('description', 'download.modInfo.description', 'modInfo.description')
    })), (getFirstValue('author', 'download.modInfo.author', 'modInfo.author') && {
        author: getFirstValue('author', 'download.modInfo.author', 'modInfo.author')
    })), (getFirstValue('modId', 'download.modInfo.modId', 'modInfo.modId') && {
        modId: getFirstValue('modId', 'download.modInfo.modId', 'modInfo.modId')
    })), (getFirstValue('fileId', 'download.modInfo.fileId', 'modInfo.fileId') && {
        fileId: getFirstValue('fileId', 'download.modInfo.fileId', 'modInfo.fileId')
    }));
    // Build the complete IModInfo object
    const modInfo = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ fileName,
        fileSizeBytes,
        gameId,
        fileVersion,
        fileMD5,
        sourceURI }, (logicalFileName && { logicalFileName })), (source && { source })), (domainName && { domainName })), (expires && { expires })), (archived !== undefined && { archived })), (status && { status })), (rules && { rules })), (Object.keys(details).length > 0 && { details }));
    // Remove any undefined values to keep the object clean
    const cleanModInfo = Object.fromEntries(Object.entries(modInfo).filter(([_, value]) => value !== undefined && value !== null && value !== ''));
    return cleanModInfo;
}
