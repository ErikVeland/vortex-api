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
const notifications_1 = require("../actions/notifications");
const ComponentEx_1 = require("../util/ComponentEx");
const util_1 = require("../util/util");
const platform_1 = require("../util/platform");
const Icon_1 = __importDefault(require("./Icon"));
const React = __importStar(require("react"));
const url = __importStar(require("url"));
class Dropzone extends ComponentEx_1.ComponentEx {
    constructor(props) {
        super(props);
        this.mWrapperMode = false;
        this.handleMacOSFileDrop = (filePath) => {
            // Handle file dropped on macOS dock icon
            if (this.props.accept.includes('files')) {
                this.props.drop('files', [filePath]);
            }
        };
        this.validateURL = (content) => {
            var _a;
            const { t } = this.props;
            const urlInput = (_a = content.input) === null || _a === void 0 ? void 0 : _a.find(input => input.id === 'url');
            const urlValue = (urlInput === null || urlInput === void 0 ? void 0 : urlInput.value) || '';
            if (!(0, util_1.truthy)(urlValue)) {
                return [{
                        actions: ['confirm'],
                        errorText: t('Please enter a URL'),
                        id: 'url'
                    }];
            }
            try {
                const parsed = url.parse(urlValue);
                if ((parsed.protocol !== 'http:') && (parsed.protocol !== 'https:')) {
                    return [{
                            actions: ['confirm'],
                            errorText: t('Invalid protocol "{{proto}}", only http and https are supported', { replace: { proto: parsed.protocol } }),
                            id: 'url'
                        }];
                }
            }
            catch (err) {
                return [{
                        actions: ['confirm'],
                        errorText: t('Invalid URL'),
                        id: 'url'
                    }];
            }
            return [];
        };
        this.onDragOver = (evt) => {
            const { dropActive } = this.state;
            evt.preventDefault();
            if (this.state.dropActive === 'no') {
                this.setDropMode(evt);
            }
            try {
                evt.dataTransfer.dropEffect = this.state.dropActive === 'url'
                    ? 'link'
                    : 'copy';
            }
            catch (err) {
                // continue regardless of error
            }
            return false;
        };
        this.onDragLeave = (evt) => {
            if (['no', 'invalid'].indexOf(this.state.dropActive) !== -1) {
                return;
            }
            evt.preventDefault();
            if (this.mLeaveDelay !== undefined) {
                clearTimeout(this.mLeaveDelay);
            }
            // delay event on drag leave,
            this.mLeaveDelay = setTimeout(() => {
                this.nextState.dropActive = 'no';
            }, 100);
        };
        this.onDrop = (evt) => {
            const { accept, drop } = this.props;
            evt.preventDefault();
            const dropUrl = evt.dataTransfer.getData('Url');
            if ((dropUrl !== '') && (accept.indexOf('urls') !== -1)) {
                drop('urls', [dropUrl]);
            }
            if ((evt.dataTransfer.files.length > 0) && (accept.indexOf('files') !== -1)) {
                const fileList = [];
                for (let i = 0; i < evt.dataTransfer.files.length; ++i) {
                    fileList.push(evt.dataTransfer.files.item(i).path);
                }
                drop('files', fileList);
            }
            this.nextState.dropActive = 'no';
        };
        this.onHover = (evt) => {
            this.nextState.dropActive = 'hover';
        };
        this.onHoverLeave = (evt) => {
            this.nextState.dropActive = 'no';
        };
        this.onClick = () => {
            const { t, accept, dialogDefault, dialogHint } = this.props;
            const clickMode = accept[0];
            if (clickMode === 'urls') {
                this.props.onShowDialog('info', dialogHint, {
                    input: [{
                            id: 'url',
                            type: 'url',
                            value: dialogDefault,
                        }],
                    condition: this.validateURL,
                }, [{ label: 'Cancel' }, { label: 'Download', default: true }])
                    .then(result => {
                    if (result.action === 'Download') {
                        let inputUrl = result.input.url;
                        if (!(0, util_1.truthy)(url.parse(inputUrl).protocol)) {
                            // no protocol specified
                            inputUrl = 'https://' + inputUrl;
                        }
                        this.props.drop('urls', [inputUrl]);
                    }
                });
            }
            else {
                this.context.api.selectFile({
                    defaultPath: dialogDefault,
                    title: dialogHint,
                }).then(filePath => {
                    if (filePath !== undefined) {
                        this.props.drop('files', [filePath]);
                    }
                });
            }
        };
        this.initState({
            dropActive: 'no',
        });
    }
    componentDidMount() {
        // Add macOS-specific event listener for file drops
        if ((0, platform_1.isMacOS)() && this.context.api) {
            this.context.api.events.on('open-file', this.handleMacOSFileDrop);
        }
    }
    componentWillUnmount() {
        // Clean up macOS-specific event listener
        if ((0, platform_1.isMacOS)() && this.context.api) {
            this.context.api.events.removeListener('open-file', this.handleMacOSFileDrop);
        }
    }
    render() {
        const { t, dropText, clickText, icon, clickable, style, dragOverlay } = this.props;
        const { dropActive } = this.state;
        const dropModeToStyle = {
            'no': 'stand-alone',
            'url': 'stand-alone hover-valid',
            'file': 'stand-alone hover-valid',
            'hover': 'stand-alone hover-click',
            'invalid': 'stand-alone hover-invalid',
        };
        return (React.createElement("div", { className: `dropzone ${dropModeToStyle[dropActive]}`, style: style, onDragOver: this.onDragOver, onDragLeave: this.onDragLeave, onDragEnd: this.onDragLeave, onDrop: this.onDrop, onClick: clickable ? this.onClick : undefined },
            React.createElement("div", { className: 'dropzone-content' },
                icon !== undefined ? React.createElement(Icon_1.default, { name: icon }) : null,
                React.createElement("p", null, dropActive === 'no' ? (dropText || t('Drop files or links here')) : t('Drop now')),
                clickText !== undefined ? React.createElement("p", null, clickText) : null),
            dropActive !== 'no' ? dragOverlay : null));
    }
    setDropMode(evt) {
        const { accept } = this.props;
        let newMode = 'invalid';
        if ((evt.dataTransfer.types.indexOf('Url') !== -1)
            && (accept.indexOf('urls') !== -1)) {
            newMode = 'url';
        }
        else if ((evt.dataTransfer.files.length > 0)
            && (accept.indexOf('files') !== -1)) {
            newMode = 'file';
        }
        this.nextState.dropActive = newMode;
    }
}
exports.default = (0, ComponentEx_1.translate)(['common'])((0, ComponentEx_1.connect)(undefined, (dispatch) => ({
    onShowDialog: (type, title, content, actions) => dispatch((0, notifications_1.showDialog)(type, title, content, actions)),
}))(Dropzone));
