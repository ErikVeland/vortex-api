import { IComponentContext } from '../types/IComponentContext';
import { IExtensionApi } from '../types/IExtensionContext';
import { II18NProps } from '../types/II18NProps';
import { IMainPage } from '../types/IMainPage';
import { INotification } from '../types/INotification';
import { IProfile, IProgress, IUIBlocker } from '../types/IState';
import { TFunction } from '../util/i18n';
import * as React from 'react';
export interface IBaseProps {
    t: TFunction;
    className: string;
    api: IExtensionApi;
}
export interface IExtendedProps {
    objects: IMainPage[];
}
export interface IMainWindowState {
    showLayer: string;
    loadedPages: string[];
    hidpi: boolean;
    focused: boolean;
    menuOpen: boolean;
}
export interface IConnectedProps {
    tabsMinimized: boolean;
    visibleDialog: string;
    mainPage: string;
    secondaryPage: string;
    activeProfileId: string;
    nextProfileId: string;
    progressProfile: {
        [progressId: string]: IProgress;
    };
    customTitlebar: boolean;
    version: string;
    updateChannel: string;
    userInfo: any;
    notifications: INotification[];
    uiBlockers: {
        [id: string]: IUIBlocker;
    };
    profiles: {
        [key: string]: IProfile;
    };
}
export interface IActionProps {
    onSetTabsMinimized: (minimized: boolean) => void;
    onSetOpenMainPage: (page: string, secondary: boolean) => void;
    onHideDialog: () => void;
    onUnblockUI: (id: string) => void;
}
export type IProps = IBaseProps & IConnectedProps & IExtendedProps & IActionProps & II18NProps;
export declare const MainContext: React.Context<IComponentContext>;
export declare class MainWindow extends React.Component<IProps, IMainWindowState> {
    static childContextTypes: React.ValidationMap<any>;
    private applicationButtons;
    private settingsPage;
    private nextState;
    private globalButtons;
    private modifiers;
    private menuLayer;
    private menuObserver;
    private sidebarRef;
    private sidebarTimer;
    private mutexQueue;
    constructor(props: IProps);
    getChildContext(): IComponentContext;
    componentDidMount(): void;
    componentWillUnmount(): void;
    shouldComponentUpdate(nextProps: IProps, nextState: IMainWindowState): boolean;
    componentDidUpdate(prevProps: IProps, prevState: IMainWindowState): void;
    render(): JSX.Element;
    private updateState;
    private getModifiers;
    private updateModifiers;
    private renderTitleBar;
    private renderHeader;
    private updateSize;
    private setFocus;
    private unsetFocus;
    private renderBody;
    private renderPageGroup;
    private renderPage;
    private setMainPage;
}
declare const _default: import("react-redux").ConnectedComponent<React.ComponentClass<IBaseProps, any>, import("react-redux").Omit<React.ClassAttributes<React.Component<IBaseProps, any, any>> & IBaseProps, never>>;
export default _default;
