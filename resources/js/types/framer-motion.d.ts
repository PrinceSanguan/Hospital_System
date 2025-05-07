declare module 'framer-motion' {
  import { ComponentType, CSSProperties, ReactElement, ReactNode } from 'react';

  export interface MotionProps {
    initial?: unknown;
    animate?: unknown;
    exit?: unknown;
    transition?: {
      duration?: number;
      delay?: number;
      type?: string;
      [key: string]: unknown;
    };
    variants?: unknown;
    style?: CSSProperties;
    className?: string;
    children?: ReactNode;
    [key: string]: unknown;
  }

  export type MotionComponent<P = Record<string, unknown>> = ComponentType<P & MotionProps>;

  export const motion: {
    div: MotionComponent;
    span: MotionComponent;
    h1: MotionComponent;
    h2: MotionComponent;
    h3: MotionComponent;
    h4: MotionComponent;
    h5: MotionComponent;
    h6: MotionComponent;
    p: MotionComponent;
    a: MotionComponent;
    button: MotionComponent;
    img: MotionComponent;
    section: MotionComponent;
    article: MotionComponent;
    nav: MotionComponent;
    aside: MotionComponent;
    ul: MotionComponent;
    ol: MotionComponent;
    li: MotionComponent;
    header: MotionComponent;
    footer: MotionComponent;
    main: MotionComponent;
    [key: string]: MotionComponent;
  };

  export function AnimatePresence(props: {
    children?: ReactNode;
    exitBeforeEnter?: boolean;
    initial?: boolean;
    mode?: 'sync' | 'wait' | 'popLayout';
    onExitComplete?: () => void;
    custom?: unknown;
    [key: string]: unknown;
  }): ReactElement;

  export type TargetAndTransition = {
    [key: string]: unknown;
  };

  export type VariantLabels = string | string[];
} 