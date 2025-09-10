import * as reduxAct from 'redux-act';
import { IUpdateEntry } from '@nexusmods/nexus-api';

/**
 * Set current login flow identifier.
 * Pass a string id when a login session is active, '__failed' on failure, or undefined to clear.
 */
export declare const setLoginId: reduxAct.ComplexActionCreator1<string | undefined, string | undefined, {}>;

/**
 * Mark OAuth login as pending with the authorization URL, or undefined to clear/reset.
 */
export declare const setOauthPending: reduxAct.ComplexActionCreator1<string | undefined, string | undefined, {}>;

/**
 * Set the current login error message (human-readable).
 */
export declare const setLoginError: reduxAct.ComplexActionCreator1<string, string, {}>;

/**
 * Store the timestamp and results of the last update check for a given game.
 */
export declare const setLastUpdateCheck: reduxAct.ComplexActionCreator4<string, number, number, IUpdateEntry[], {
    gameId: string;
    time: number;
    range: number;
    updateList: IUpdateEntry[];
}, {}>;

/**
 * Track a free-user download URL currently in progress/queue.
 */
export declare const addFreeUserDLItem: reduxAct.ComplexActionCreator1<string, string, {}>;

/**
 * Remove a tracked free-user download URL from progress/queue.
 */
export declare const removeFreeUserDLItem: reduxAct.ComplexActionCreator1<string, string, {}>;