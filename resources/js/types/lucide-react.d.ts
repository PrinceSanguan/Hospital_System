declare module 'lucide-react' {
  import { ComponentType, SVGProps } from 'react';

  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
    absoluteStrokeWidth?: boolean;
    [key: string]: unknown;
  }

  export type LucideIcon = ComponentType<IconProps>;

  // Define specific icons used in the app
  export const Microscope: LucideIcon;
  export const Stethoscope: LucideIcon;
  export const Calendar: LucideIcon;
  export const ClipboardList: LucideIcon;
  export const UserRound: LucideIcon;
  export const UserCog: LucideIcon;
  export const Clock: LucideIcon;
  export const MapPin: LucideIcon;
  export const Phone: LucideIcon;
  export const Mail: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const X: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const Info: LucideIcon;
  export const Bell: LucideIcon;
} 