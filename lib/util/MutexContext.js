"use strict";
/// This implements a react hook (and wrapper) component that ensure of the components using it,
/// only one is visible at the same time.
/// It's currently intended to prevent multiple modals from showing up at once
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
exports.MutexWrapper = exports.useRandomId = exports.useMutex = exports.MutexConsumer = exports.MutexProvider = exports.createQueue = void 0;
const React = __importStar(require("react"));
const shortid_1 = require("shortid");
class MutexContextValue {
    constructor() {
        this.mQueue = [];
    }
    get current() {
        return this.mQueue.length > 0 ? this.mQueue[0] : null;
    }
    add(newItem) {
        const idx = this.mQueue.indexOf(newItem);
        if (idx === -1) {
            this.mQueue.unshift(newItem);
        }
    }
    remove(item) {
        const idx = this.mQueue.indexOf(item);
        if (idx !== -1) {
            this.mQueue.splice(idx, 1);
        }
    }
}
const MutexContext = React.createContext(null);
function createQueue() {
    return new MutexContextValue();
}
exports.createQueue = createQueue;
exports.MutexProvider = MutexContext.Provider;
exports.MutexConsumer = MutexContext.Consumer;
function useMutex(show) {
    const ctx = React.useContext(MutexContext);
    const mutexId = useRandomId();
    const [, updateState] = React.useState();
    const forceUpdate = React.useCallback(() => updateState({}), []);
    React.useEffect(() => {
        if (ctx === undefined) {
            return;
        }
        if (show) {
            ctx.add(mutexId);
            forceUpdate();
        }
        return () => {
            ctx.remove(mutexId);
            forceUpdate();
        };
    }, [show]);
    return (ctx.current === mutexId) && (mutexId !== null);
}
exports.useMutex = useMutex;
function useRandomId() {
    const ref = React.useRef();
    if (ref.current === undefined) {
        ref.current = (0, shortid_1.generate)();
    }
    return ref.current;
}
exports.useRandomId = useRandomId;
function MutexWrapper(props) {
    // const primary = useMutex(props.show);
    // return primary ? React.createElement('div', undefined, props.children) : null;
    return React.createElement('div', undefined, props.children);
}
exports.MutexWrapper = MutexWrapper;
