"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSanityCheck = exports.reduxSanity = exports.StateError = void 0;
const util_1 = require("./util");
class StateError extends Error {
    constructor(action, message) {
        super(message);
        this.name = this.constructor.name;
        this.mAction = action;
    }
}
exports.StateError = StateError;
const sanityChecks = {};
function reduxSanity(callback) {
    return (store) => (next) => (action) => {
        let invalid = false;
        (sanityChecks[action.type] || []).forEach(check => {
            const res = check(store.getState(), action);
            if (res === false) {
                invalid = true;
            }
            else if (res !== undefined) {
                callback(new StateError(action, res));
                invalid = true;
            }
        });
        if (invalid) {
            return action;
        }
        return next(action);
    };
}
exports.reduxSanity = reduxSanity;
function registerSanityCheck(type, check) {
    (0, util_1.setdefault)(sanityChecks, type, []).push(check);
}
exports.registerSanityCheck = registerSanityCheck;
