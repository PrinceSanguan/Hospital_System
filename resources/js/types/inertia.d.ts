// Type declarations for Inertia
declare module '@inertiajs/core' {
  import { ComponentType, ReactNode } from 'react';

  export interface PageProps {
    [key: string]: unknown;
  }

  export function createInertiaApp(options: {
    title?: (title: string) => string;
    resolve: (name: string) => Promise<any>;
    setup: (options: { el: HTMLElement; App: ComponentType; props: any }) => void;
    progress?: {
      color?: string;
      delay?: number;
      includeCSS?: boolean;
      showSpinner?: boolean;
    };
  }): Promise<void>;
}

declare module '@inertiajs/react' {
  import { ComponentType, ReactNode } from 'react';

  export interface PageProps {
    [key: string]: unknown;
  }

  export function Link(props: {
    href: string;
    className?: string;
    children?: ReactNode;
    method?: 'get' | 'post' | 'put' | 'patch' | 'delete';
    replace?: boolean;
    preserveScroll?: boolean;
    preserveState?: boolean;
    only?: string[];
    headers?: Record<string, string>;
    data?: Record<string, unknown>;
    [key: string]: unknown;
  }): JSX.Element;

  export function usePage<T = PageProps>(): {
    props: T;
    url: string;
    component: string;
    version: string | null;
  };

  export function setup(): void;

  export function useForm<TForm = Record<string, unknown>>(
    initialValues?: TForm
  ): {
    data: TForm;
    setData: (
      key: keyof TForm | Partial<TForm>,
      value?: unknown
    ) => void;
    errors: Record<keyof TForm, string>;
    hasErrors: boolean;
    processing: boolean;
    progress: {
      percentage: number;
      size: number;
      totalSize: number;
    } | null;
    wasSuccessful: boolean;
    recentlySuccessful: boolean;
    transform: (callback: (data: TForm) => TForm) => void;
    reset: (...fields: (keyof TForm)[]) => void;
    clearErrors: (...fields: (keyof TForm)[]) => void;
    submit: (
      method: string,
      url: string,
      options?: Record<string, unknown>
    ) => void;
    get: (
      url: string,
      options?: Record<string, unknown>
    ) => void;
    post: (
      url: string,
      options?: Record<string, unknown>
    ) => void;
    put: (
      url: string,
      options?: Record<string, unknown>
    ) => void;
    patch: (
      url: string,
      options?: Record<string, unknown>
    ) => void;
    delete: (
      url: string,
      options?: Record<string, unknown>
    ) => void;
  };

  export const router: {
    get(url: string, data?: Record<string, unknown>, options?: Record<string, unknown>): void;
    post(url: string, data?: Record<string, unknown>, options?: Record<string, unknown>): void;
    put(url: string, data?: Record<string, unknown>, options?: Record<string, unknown>): void;
    patch(url: string, data?: Record<string, unknown>, options?: Record<string, unknown>): void;
    delete(url: string, data?: Record<string, unknown>, options?: Record<string, unknown>): void;
    reload(options?: Record<string, unknown>): void;
    visit(url: string, options?: Record<string, unknown>): void;
  };

  export const Head: ComponentType<{ title: string, children?: ReactNode }>;

  // Add other missing type declarations as needed
  export interface PageProps {
    errors: Record<string, string>;
    flash: {
      success?: string;
      error?: string;
      [key: string]: string | undefined;
    };
    url: string;
    [key: string]: any;
  }

  // Extend usePage to include our specific props
  export function usePage<T = PageProps>(): {
    props: T & PageProps;
  };
}

// Declaring global route function for type safety
declare global {
  function route(name: string, params?: Record<string, unknown>): string;
}
