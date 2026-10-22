/// <reference types="vite/client" />

interface KlingCheckoutOptions {
  sessionId: string;
  onSuccess?: (data?: any) => void;
  onCancel?: () => void;
  onError?: (err?: any) => void;
  onClose?: () => void;
}

interface Window {
  kling?: {
    checkout: (options: KlingCheckoutOptions) => void;
  };
}
