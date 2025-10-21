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
exports.MainWindow = exports.MainContext = void 0;
const session_1 = require("../actions/session");
const window_1 = require("../actions/window");
const FlexLayout_1 = __importDefault(require("../controls/FlexLayout"));
const IconBar_1 = __importDefault(require("../controls/IconBar"));
const ComponentEx_1 = require("../util/ComponentEx");
const MutexContext_1 = require("../util/MutexContext");
const storeHelper_1 = require("../util/storeHelper");
const Dialog_1 = __importDefault(require("./Dialog"));
const DialogContainer_1 = __importDefault(require("./DialogContainer"));
const DNDContainer_1 = __importDefault(require("./DNDContainer"));
const MainFooter_1 = __importDefault(require("./MainFooter"));
const MainPageContainer_1 = __importDefault(require("./MainPageContainer"));
const NotificationButton_1 = __importDefault(require("./NotificationButton"));
const OverlayContainer_1 = __importDefault(require("./OverlayContainer"));
const PageButton_1 = __importDefault(require("./PageButton"));
const Settings_1 = __importDefault(require("./Settings"));
const WindowControls_1 = __importDefault(require("./WindowControls"));
const selectors_1 = require("../extensions/profile_management/selectors");
const api_1 = require("../util/api");
const immutability_helper_1 = __importDefault(require("immutability-helper"));
const PropTypes = __importStar(require("prop-types"));
const React = __importStar(require("react"));
const react_bootstrap_1 = require("react-bootstrap");
// tslint:disable-next-line:no-submodule-imports
const bootstrapUtils_1 = require("react-bootstrap/lib/utils/bootstrapUtils");
const platform_1 = require("../util/platform");
(0, bootstrapUtils_1.addStyle)(react_bootstrap_1.Button, 'secondary');
(0, bootstrapUtils_1.addStyle)(react_bootstrap_1.Button, 'ad');
(0, bootstrapUtils_1.addStyle)(react_bootstrap_1.Button, 'ghost');
(0, bootstrapUtils_1.addStyle)(react_bootstrap_1.Button, 'link');
(0, bootstrapUtils_1.addStyle)(react_bootstrap_1.Button, 'inverted');
exports.MainContext = React.createContext({
    api: undefined,
    getModifiers: undefined,
    menuLayer: undefined,
});
class MainWindow extends React.Component {
    constructor(props) {
        super(props);
        this.globalButtons = [];
        this.modifiers = { alt: false, ctrl: false, shift: false };
        this.menuLayer = null;
        this.sidebarRef = null;
        this.mutexQueue = (0, MutexContext_1.createQueue)();
        this.updateState = (diff) => {
            this.nextState = (0, immutability_helper_1.default)(this.nextState, diff);
            this.setState(this.nextState);
        };
        this.getModifiers = () => {
            return this.modifiers;
        };
        this.updateModifiers = (evt) => {
            this.modifiers = {
                ctrl: evt.ctrlKey,
                shift: evt.shiftKey,
                alt: evt.altKey,
            };
        };
        this.updateSize = () => {
            var _a, _b;
            this.updateState({
                hidpi: { $set: ((_b = (_a = global.screen) === null || _a === void 0 ? void 0 : _a.width) !== null && _b !== void 0 ? _b : 0) > 1920 },
            });
        };
        this.setFocus = () => {
            if (process.env.DEBUG_REACT_RENDERS !== 'true') {
                this.updateState({
                    focused: { $set: true },
                });
            }
        };
        this.unsetFocus = () => {
            if (process.env.DEBUG_REACT_RENDERS !== 'true') {
                this.updateState({
                    focused: { $set: false },
                });
            }
        };
        this.setMainPage = (page, secondary) => {
            const { onSetOpenMainPage } = this.props;
            onSetOpenMainPage(page, secondary);
        };
        this.state = this.nextState = {
            showLayer: '',
            loadedPages: [],
            hidpi: false,
            focused: true,
            menuOpen: false,
        };
        this.settingsPage = {
            id: 'application_settings',
            title: 'Settings',
            group: 'global',
            component: Settings_1.default,
            icon: 'settings',
            propsFunc: () => undefined,
            visible: () => true,
        };
        this.applicationButtons = [];
        this.props.api.events.on('show-main-page', pageId => {
            this.setMainPage(pageId, false);
        });
        this.props.api.events.on('refresh-main-page', () => {
            this.forceUpdate();
        });
        this.props.api.events.on('show-modal', id => {
            this.updateState({
                showLayer: { $set: id },
            });
        });
        // Add event handlers for touch bar events
        this.props.api.events.on('refresh-main-window', () => {
            // Refresh the current view
            this.forceUpdate();
            // Also emit a general refresh event that other components can listen to
            this.props.api.events.emit('refresh-content');
        });
        this.props.api.events.on('show-settings', () => {
            // Show the settings page
            this.setMainPage('Settings', false);
        });
        // Add event handler for high contrast toggle
        this.props.api.events.on('toggle-high-contrast', (enabled) => {
            // Update the state to trigger a re-render with high contrast styling
            if (enabled) {
                document.body.classList.add('high-contrast');
            }
            else {
                document.body.classList.remove('high-contrast');
            }
            // Force a re-render to apply the new styling
            this.forceUpdate();
        });
    }
    getChildContext() {
        const { api } = this.props;
        return { api, menuLayer: this.menuLayer, getModifiers: this.getModifiers };
    }
    componentDidMount() {
        if (this.props.objects.length > 0) {
            const def = this.props.objects.sort((lhs, rhs) => lhs.priority - rhs.priority)[0];
            this.setMainPage(def.title, false);
        }
        if (this.props.customTitlebar) {
            document.body.classList.add('custom-titlebar-body');
        }
        // Add macOS class to body for platform-specific styling
        if ((0, platform_1.isMacOS)()) {
            document.body.classList.add('macOS');
        }
        this.updateSize();
        window.addEventListener('resize', this.updateSize);
        window.addEventListener('keydown', this.updateModifiers);
        window.addEventListener('keyup', this.updateModifiers);
        window.addEventListener('focus', this.setFocus);
        window.addEventListener('blur', this.unsetFocus);
    }
    componentWillUnmount() {
        window.removeEventListener('resize', this.updateSize);
        window.removeEventListener('keydown', this.updateModifiers);
        window.removeEventListener('keyup', this.updateModifiers);
        window.removeEventListener('focus', this.setFocus);
        window.removeEventListener('blur', this.unsetFocus);
    }
    shouldComponentUpdate(nextProps, nextState) {
        return this.props.visibleDialog !== nextProps.visibleDialog
            || this.props.tabsMinimized !== nextProps.tabsMinimized
            || this.props.mainPage !== nextProps.mainPage
            || this.props.secondaryPage !== nextProps.secondaryPage
            || this.props.activeProfileId !== nextProps.activeProfileId
            || this.props.nextProfileId !== nextProps.nextProfileId
            || this.props.customTitlebar !== nextProps.customTitlebar
            || this.props.version !== nextProps.version
            || this.props.updateChannel !== nextProps.updateChannel
            || this.props.userInfo !== nextProps.userInfo
            || this.state.showLayer !== nextState.showLayer
            || this.state.hidpi !== nextState.hidpi
            || this.state.focused !== nextState.focused
            || this.state.menuOpen !== nextState.menuOpen;
    }
    componentDidUpdate(prevProps, prevState) {
        if ((prevProps.mainPage !== this.props.mainPage)
            || (prevProps.secondaryPage !== this.props.secondaryPage)) {
            this.updateState({
                loadedPages: { $push: [this.props.mainPage] },
            });
        }
    }
    render() {
        const { t, visibleDialog, customTitlebar } = this.props;
        const { focused } = this.state;
        const classes = ['main-window'];
        if (customTitlebar) {
            classes.push('custom-titlebar');
        }
        if (!focused) {
            classes.push('blurred');
        }
        return (React.createElement("div", { className: classes.join(' ') },
            React.createElement(exports.MainContext.Provider, { value: {
                    api: this.props.api,
                    menuLayer: this.menuLayer,
                    getModifiers: this.getModifiers,
                } },
                this.renderTitleBar(),
                React.createElement(FlexLayout_1.default, { type: 'column', className: 'main-window-content' },
                    React.createElement(FlexLayout_1.default.Fixed, { className: 'main-window-header' }, this.renderHeader()),
                    React.createElement(FlexLayout_1.default.Flex, { className: 'main-window-body' }, this.renderBody()),
                    React.createElement(FlexLayout_1.default.Fixed, { className: 'main-window-footer' },
                        React.createElement(MainFooter_1.default, { slim: false }))),
                React.createElement(DialogContainer_1.default, { visibleDialog: visibleDialog, onHideDialog: this.props.onHideDialog }),
                React.createElement(DNDContainer_1.default, null),
                React.createElement(OverlayContainer_1.default, null),
                visibleDialog !== undefined ? React.createElement(Dialog_1.default, null) : null)));
    }
    renderTitleBar() {
        const { customTitlebar, t } = this.props;
        return customTitlebar ? (React.createElement("div", { className: 'window-titlebar' },
            React.createElement("div", { className: 'window-title' }, t('Vortex')),
            React.createElement(WindowControls_1.default, null))) : null;
    }
    renderHeader() {
        const { t, tabsMinimized } = this.props;
        const { menuOpen } = this.state;
        return (React.createElement("div", null,
            React.createElement(IconBar_1.default, { id: 'main-buttons', className: 'main-buttons', group: 'main-toolbar', staticElements: this.applicationButtons, t: t, collapse: tabsMinimized }),
            React.createElement("div", { className: 'btn-group', style: { float: 'right' } },
                React.createElement(NotificationButton_1.default, { id: 'notification-button', hide: false }))));
    }
    renderBody() {
        const { t, objects, tabsMinimized } = this.props;
        const sbClass = tabsMinimized ? 'sidebar-compact' : 'sidebar-expanded';
        const pages = objects.map(obj => this.renderPage(obj));
        pages.push(this.renderPage(this.settingsPage));
        const state = this.props.api.getState();
        const profile = (0, selectors_1.profileById)(state, this.props.activeProfileId);
        const game = profile !== undefined ? (0, api_1.getGame)(profile.gameId) : undefined;
        const gameName = (game === null || game === void 0 ? void 0 : game.shortName) || (game === null || game === void 0 ? void 0 : game.name) || 'Mods';
        const pageGroups = [
            { title: undefined, key: 'dashboard' },
            { title: 'General', key: 'global' },
            { title: gameName, key: 'per-game' },
        ];
        return (React.createElement(FlexLayout_1.default, { type: 'row' },
            React.createElement(FlexLayout_1.default.Fixed, { className: sbClass },
                React.createElement(react_bootstrap_1.Nav, { bsStyle: 'pills', stacked: true, className: 'main-nav' }, pageGroups.map(group => this.renderPageGroup(group.title, group.key, pages)))),
            React.createElement(FlexLayout_1.default.Flex, null,
                React.createElement(MainPageContainer_1.default, { pages: pages }))));
    }
    renderPageGroup(title, key, pages) {
        const { t } = this.props;
        const groupPages = pages
            .filter(page => page.props.group === key)
            .sort((lhs, rhs) => lhs.props.priority - rhs.props.priority);
        if (groupPages.length === 0) {
            return null;
        }
        return (React.createElement("div", { key: key },
            title !== undefined ? React.createElement("div", { className: 'nav-group-title' }, t(title)) : null,
            groupPages));
    }
    renderPage(page) {
        const { mainPage, secondaryPage, t } = this.props;
        const visible = (page.id === 'application_settings')
            ? secondaryPage === 'Settings'
            : page.title === mainPage;
        // Only render visible pages
        if (!visible) {
            return null;
        }
        return (React.createElement(PageButton_1.default, { key: page.id, t: t, page: page, namespace: undefined }));
    }
}
exports.MainWindow = MainWindow;
// tslint:disable-next-line:no-unused-variable
MainWindow.childContextTypes = {
    api: PropTypes.object.isRequired,
    menuLayer: PropTypes.object,
    getModifiers: PropTypes.func,
};
const emptyArray = [];
const emptyObject = {};
function mapStateToProps(state) {
    return {
        tabsMinimized: state.settings.window.tabsMinimized,
        visibleDialog: state.session.base.visibleDialog,
        mainPage: state.session.base.mainPage,
        secondaryPage: state.session.base.secondaryPage,
        activeProfileId: state.settings.profiles.activeProfileId,
        nextProfileId: state.settings.profiles.nextProfileId,
        progressProfile: (0, storeHelper_1.getSafe)(state, ['session', 'base', 'progress', 'profile'], {}),
        customTitlebar: state.settings.window.customTitlebar,
        version: (0, storeHelper_1.getSafe)(state, ['session', 'base', 'version'], '0.0.0'),
        updateChannel: (0, storeHelper_1.getSafe)(state, ['settings', 'update', 'channel'], 'stable'),
        userInfo: (0, storeHelper_1.getSafe)(state, ['persistent', 'nexus', 'userInfo'], undefined),
        notifications: state.session.notifications.notifications,
        uiBlockers: state.session.base.uiBlockers,
        profiles: state.persistent.profiles,
    };
}
function mapDispatchToProps(dispatch) {
    return {
        onSetTabsMinimized: (minimized) => dispatch((0, window_1.setTabsMinimized)(minimized)),
        onSetOpenMainPage: (page, secondary) => dispatch((0, session_1.setOpenMainPage)(page, secondary)),
        onHideDialog: () => dispatch((0, session_1.setDialogVisible)(undefined)),
        onUnblockUI: (id) => dispatch((0, session_1.clearUIBlocker)(id)),
    };
}
const ConnectedMainWindow = (0, ComponentEx_1.connect)(mapStateToProps, mapDispatchToProps)(MainWindow);
exports.default = ConnectedMainWindow;
