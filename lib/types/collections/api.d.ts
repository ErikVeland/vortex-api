import { IGameSpecificInterfaceProps } from './IGameSpecificInterfaceProps';
import { IState, IMod } from '../IState';
import { IExtensionApi } from '../IExtensionContext';
export interface ICollectionsGameSupportEntry {
    gameId: string;
    generator: (state: IState, gameId: string, stagingPath: string, modIds: string[], mods: {
        [modId: string]: IMod;
    }) => Promise<any>;
    parser: (api: IExtensionApi, gameId: string, collection: any) => Promise<void>;
    interface: (props: IGameSpecificInterfaceProps) => JSX.Element;
}
