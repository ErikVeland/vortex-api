type ExtractOptions = {
    ssc?: boolean;
    password?: string;
};
type AddOptions = {
    ssw?: boolean;
};
export declare function extractArchive(archivePath: string, destPath: string, options?: ExtractOptions): Promise<void>;
export declare function addToArchive(destArchive: string, files: string[], options?: AddOptions): Promise<void>;
export {};
