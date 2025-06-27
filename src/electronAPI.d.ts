interface FileInfos {
    message: string;
    path: string;
    status: boolean;
}
declare interface Window {
    electronAPI: {
        openFile: () => Promise<FileInfos>,
        openFolder: () => Promise<FileInfos>,
        checkFolderName: (path: string) => Promise<any>,
        copyFileResource: ({ theme: string, src: string, destPath: string }) => Promise<any>;
        getStream: () => Promise<any[]>;
        loadConfigs: () => Promise<{
            necessary: Record<string, string>;
            optional: Record<string, string>;
            extraFolders: string[];
        }>;
        saveConfigs: (configs: {
            necessary: Record<string, string>;
            optional: Record<string, string>;
            extraFolders: string[];
        }) => Promise<{ success: boolean }>;
        backupConfigs: () => Promise<{ success: boolean; backupPath: string }>;
        getAppVersion: () => Promise<string>;
        checkForUpdates: () => Promise<{
            updateAvailable: boolean;
            version?: string;
            releaseNotes?: string;
        }>;
        resetConfigs: () => Promise<{ success: boolean, message: string }>;
        downloadUpdate: () => Promise<boolean>;
        quitAndInstall: () => void;
    }
}