interface ElectronAPI {
  login: (email: string, password: string) => Promise<{
    token: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatar?: string | null;
      createdAt: string;
    };
  }>;
  me: (token: string) => Promise<{
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatar?: string | null;
      createdAt: string;
    };
  }>;
  logout: () => Promise<{ ok: boolean }>;
  getToken: () => Promise<string | null>;
  quit: () => Promise<void>;
  minimize: () => Promise<void>;
  close: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
  toggleMaximize: () => Promise<void>;
  onTrackingToggle: (callback: (enabled: boolean) => void) => void;
  removeTrackingToggleListener: () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
