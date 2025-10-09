type ExtractOptions = {
    ssc?: boolean;
    password?: string;
    allowExternalSymlinks?: boolean;
    removeQuarantine?: boolean;
};
type AddOptions = {
    ssw?: boolean;
};
export declare function validateExtractionWithinDest(destPath: string): void;
export declare function sanitizeExtractedEntries(destPath: string, options?: {
    allowExternalSymlinks?: boolean;
    allowedRoots?: string[];
}): void;
export declare function removeQuarantineRecursively(targetPath: string): Promise<void>;
export declare function extractArchive(archivePath: string, destPath: string, options?: ExtractOptions): Promise<void>;
export declare function addToArchive(destArchive: string, files: string[], options?: AddOptions): Promise<void>;
export {};
