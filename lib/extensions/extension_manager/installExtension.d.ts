import { IExtensionApi } from '../../types/IExtensionContext';
import { IExtension } from './types';
declare function installExtension(api: IExtensionApi, archivePath: string, info?: IExtension): Promise<void>;
export default installExtension;
