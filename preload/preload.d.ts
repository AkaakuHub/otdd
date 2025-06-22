declare global {
    interface Window {
        electronAPI: {
            getExtensions: () => Promise<any[]>;
            toggleExtension: (extensionId: string, enabled: boolean) => Promise<void>;
            getAppVersion: () => Promise<string>;
            minimizeWindow: () => Promise<void>;
            maximizeWindow: () => Promise<void>;
            closeWindow: () => Promise<void>;
        };
    }
}
export {};
//# sourceMappingURL=preload.d.ts.map