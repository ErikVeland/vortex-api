import { IGameStore } from '../types/IGameStore';
import { IGameStoreEntry } from '../types/IGameStoreEntry';
import { IExtensionApi } from '../types/IExtensionContext';
export interface IStoreQuery {
    id?: string;
    name?: string;
    prefer?: number;
}
declare class GameStoreHelper {
    private mApi;
    private mStores;
    private mStoresDict;
    getGameStore(storeId: string): IGameStore;
    isGameInstalled(id: string, storeId?: string): Promise<string>;
    isGameStoreInstalled(storeId: string): Promise<boolean>;
    registryLookup(lookup: string): Promise<IGameStoreEntry>;
    find: (query: IStoreQuery) => Promise<IGameStoreEntry[]>;
    findByName(name: string | string[], storeId?: string): Promise<IGameStoreEntry>;
    findByAppId(appId: string | string[], storeId?: string): Promise<IGameStoreEntry>;
    launchGameStore(api: IExtensionApi, gameStoreId: string, parameters?: string[], askConsent?: boolean): Promise<void>;
    identifyStore: (gamePath: string) => Promise<string>;
    reloadGames(api?: IExtensionApi): Promise<void>;
    /**
     * @returns list of stores, sorted by priority
     */
    storeIds(): IGameStore[];
    private isStoreRunning;
    private validInput;
    private getStores;
    /**
     * Returns a store entry for a specified pattern.
     * @param searchType dictates which functor we execute.
     * @param pattern the pattern we're looking for.
     * @param storeId optional parameter used when trying to query a specific store.
     */
    private findGameEntry;
}
declare const instance: GameStoreHelper;
export default instance;
