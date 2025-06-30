interface FileInfos {
  message: string;
  path: string;
  status: boolean;
}
declare interface Window {
  mt: {
    config: {
      load: () => Promise<{
        necessary: Record<string, string>;
        optional: Record<string, string>;
        extraFolders: string[];
      }>;
      save: (configs: {
        necessary: Record<string, string>;
        optional: Record<string, string>;
        extraFolders: string[];
      }) => Promise<{ success: boolean }>;
      backup: () => Promise<{ success: boolean; backupPath: string }>;
      reset: () => Promise<{ success: boolean; message: string }>;
    };
    file: {
      checkFolderName: (path: string) => Promise<any>;
      copyFileResource: ({
        theme: string,
        src: string,
        destPath: string,
      }) => Promise<any>;
    };
    dialog: {
      openFile: () => Promise<FileInfos>;
      openFolder: () => Promise<FileInfos>;
    };
    update: {
      checkForUpdates: () => Promise<{
        updateAvailable: boolean;
        version?: string;
        releaseNotes?: string;
      }>;
      downloadUpdate: () => Promise<boolean>;
      quitAndInstall: () => void;
      getAppVersion: () => Promise<string>;
    };
  };
}
