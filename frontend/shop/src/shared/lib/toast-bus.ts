export type ToastVariant = 'info' | 'success' | 'error';

type ToastHandler = (message: string, variant?: ToastVariant) => void;

let handler: ToastHandler | null = null;

export function setToastHandler(nextHandler: ToastHandler | null) {
  handler = nextHandler;
}

export function emitToast(message: string, variant: ToastVariant = 'info') {
  handler?.(message, variant);
}
