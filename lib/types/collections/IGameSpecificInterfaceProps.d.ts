import { IRevision } from '@nexusmods/nexus-api';
import { TFunction } from '../../util/i18n';
import { IMod } from '../IState';
export interface IGameSpecificInterfaceProps {
    t: TFunction;
    collection: IMod;
    revisionInfo: IRevision;
}
