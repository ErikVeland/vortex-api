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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const React = __importStar(require("react"));
const TooltipControls_1 = require("../controls/TooltipControls");
const platform_1 = require("../util/platform");
const lazyRequire_1 = __importDefault(require("../util/lazyRequire"));
const remote = (0, lazyRequire_1.default)(() => require('@electron/remote'));
const window = (() => {
    let res;
    return () => {
        if (res === undefined) {
            res = remote.getCurrentWindow();
        }
        return res;
    };
})();
class WindowControls extends React.Component {
    constructor(props) {
        super(props);
        this.mClosed = false;
        this.minimize = () => {
            window().minimize();
        };
        this.onMaximize = () => {
            this.setState({ isMaximized: true });
            this.forceUpdate();
        };
        this.onUnMaximize = () => {
            this.setState({ isMaximized: false });
            this.forceUpdate();
        };
        this.onClose = () => {
            this.mClosed = true;
        };
        this.onEnterFullScreen = () => {
            this.setState({ isMaximized: true });
            this.forceUpdate();
        };
        this.onLeaveFullScreen = () => {
            this.setState({ isMaximized: window().isMaximized() });
            this.forceUpdate();
        };
        this.toggleMaximize = () => {
            const wasMaximized = window().isMaximized();
            wasMaximized ? window().unmaximize() : window().maximize();
        };
        this.close = () => {
            window().close();
        };
        this.state = {
            isMaximized: window().isMaximized(),
        };
    }
    componentDidMount() {
        window().on('maximize', this.onMaximize);
        window().on('unmaximize', this.onUnMaximize);
        window().on('close', this.onClose);
        // macOS-specific event handlers
        if ((0, platform_1.isMacOS)()) {
            window().on('enter-full-screen', this.onEnterFullScreen);
            window().on('leave-full-screen', this.onLeaveFullScreen);
        }
    }
    componentWillUnmount() {
        window().removeListener('maximize', this.onMaximize);
        window().removeListener('unmaximize', this.onUnMaximize);
        window().removeListener('close', this.onClose);
        // Clean up macOS-specific event handlers
        if ((0, platform_1.isMacOS)()) {
            window().removeListener('enter-full-screen', this.onEnterFullScreen);
            window().removeListener('leave-full-screen', this.onLeaveFullScreen);
        }
    }
    render() {
        const { isMaximized } = this.state;
        if (this.mClosed) {
            return null;
        }
        // On macOS, we don't show the window controls in the UI as they're handled by the system
        if ((0, platform_1.isMacOS)()) {
            return null;
        }
        return (React.createElement("div", { id: 'window-controls' },
            React.createElement(TooltipControls_1.IconButton, { id: 'window-minimize', className: 'window-control', tooltip: '', icon: 'window-minimize', onClick: this.minimize }),
            React.createElement(TooltipControls_1.IconButton, { id: 'window-maximize', className: 'window-control', tooltip: '', icon: isMaximized ? 'window-restore' : 'window-maximize', onClick: this.toggleMaximize }),
            React.createElement(TooltipControls_1.IconButton, { id: 'window-close', className: 'window-control', tooltip: '', icon: 'window-close', onClick: this.close })));
    }
}
exports.default = WindowControls;
