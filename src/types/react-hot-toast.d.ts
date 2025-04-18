declare module 'react-hot-toast' {
  import { ReactNode } from 'react';

  export interface ToastOptions {
    id?: string;
    icon?: ReactNode;
    duration?: number;
    position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    style?: React.CSSProperties;
    className?: string;
    iconTheme?: {
      primary: string;
      secondary: string;
    };
    ariaProps?: {
      role: string;
      'aria-live': string;
    };
  }

  export interface ToasterProps {
    position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    toastOptions?: ToastOptions;
    reverseOrder?: boolean;
    gutter?: number;
    containerStyle?: React.CSSProperties;
    containerClassName?: string;
  }

  export const Toaster: React.FC<ToasterProps>;

  export function toast(message: ReactNode, options?: ToastOptions): string;
  export namespace toast {
    function success(message: ReactNode, options?: ToastOptions): string;
    function error(message: ReactNode, options?: ToastOptions): string;
    function loading(message: ReactNode, options?: ToastOptions): string;
    function custom(message: ReactNode, options?: ToastOptions): string;
    function dismiss(toastId?: string): void;
    function remove(toastId?: string): void;
    function promise<T>(
      promise: Promise<T>,
      messages: {
        loading: ReactNode;
        success: ReactNode;
        error: ReactNode;
      },
      options?: ToastOptions
    ): Promise<T>;
  }
} 