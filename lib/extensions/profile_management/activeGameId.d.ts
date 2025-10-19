import { IProfile } from './types/IProfile';
import { IState } from '../../types/IState';
export declare const activeProfile: (state: any) => IProfile;
export declare const activeGameId: (state: IState) => string;
export declare const lastActiveProfileForGame: import("re-reselect").ParametricSelector<IState, string, string> & {
    resultFunc: (res1: {
        [gameId: string]: string;
    }, res2: string) => string;
    dependencies: [import("re-reselect").ParametricSelector<IState, string, {
        [gameId: string]: string;
    }>, import("re-reselect").ParametricSelector<IState, string, string>];
    recomputations: () => number;
    resetRecomputations: () => number;
} & {
    getMatchingSelector: (state: IState, props: string, ...args: any[]) => import("re-reselect").OutputParametricSelector<IState, string, string, (res1: {
        [gameId: string]: string;
    }, res2: string) => string, [import("re-reselect").ParametricSelector<IState, string, {
        [gameId: string]: string;
    }>, import("re-reselect").ParametricSelector<IState, string, string>]>;
    removeMatchingSelector: (state: IState, props: string, ...args: any[]) => void;
    clearCache: () => void;
    cache: import("re-reselect").ICacheObject;
    keySelector: import("re-reselect").ParametricKeySelector<IState, string>;
};
