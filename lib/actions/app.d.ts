import * as reduxAct from 'redux-act';
import VortexInstallType from '../types/VortexInstallType';
export declare const setStateVersion: reduxAct.ComplexActionCreator1<string, string, {}>;
export declare const setApplicationVersion: reduxAct.ComplexActionCreator1<string, string, {}>;
export declare const setExtensionEnabled: reduxAct.ComplexActionCreator2<string, boolean, {
    extensionId: string;
    enabled: boolean;
}, {}>;
export declare const setExtensionVersion: reduxAct.ComplexActionCreator2<string, string, {
    extensionId: string;
    version: string;
}, {}>;
export declare const setExtensionEndorsed: reduxAct.ComplexActionCreator2<string, string, {
    extensionId: string;
    endorsed: string;
}, {}>;
export declare const removeExtension: reduxAct.ComplexActionCreator1<string, string, {}>;
export declare const forgetExtension: reduxAct.ComplexActionCreator1<string, string, {}>;
export declare const completeMigration: reduxAct.ComplexActionCreator1<string, string, {}>;
export declare const setInstanceId: reduxAct.ComplexActionCreator1<string, string, {}>;
export declare const setWarnedAdmin: reduxAct.ComplexActionCreator1<number, number, {}>;
export declare const setInstallType: reduxAct.ComplexActionCreator1<VortexInstallType, VortexInstallType, {}>;
