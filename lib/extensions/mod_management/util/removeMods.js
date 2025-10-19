"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeMod = removeMod;
exports.removeMods = removeMods;
const util_1 = require("../../../util/util");
function removeMod(api, gameId, modId) {
    return new Promise((resolve, reject) => {
        api.events.emit('remove-mod', gameId, modId, err => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}
function removeMods(api, gameId, modIds) {
    if (modIds.length === 0) {
        return Promise.resolve();
    }
    const notiParams = {
        type: 'activity',
        title: 'Removing mods',
        message: '...',
        progress: 0,
    };
    notiParams.id = api.sendNotification(Object.assign({}, notiParams));
    const progressCB = (idx, length, name) => {
        api.sendNotification(Object.assign(Object.assign({}, notiParams), { message: name, progress: (idx * 100) / length }));
    };
    return (0, util_1.toPromise)(cb => api.events.emit('remove-mods', gameId, modIds, cb, { progressCB }))
        .then(() => {
        api.events.emit('mods-enabled', modIds, false, gameId);
    })
        .finally(() => {
        api.dismissNotification(notiParams.id);
    });
}
