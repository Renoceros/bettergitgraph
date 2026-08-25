import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const IconBranch: React.FC<IconProps> = ({ size = 14, color = 'currentColor', style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
    <path
      d="M4.5 13.5C5.88071 13.5 7 12.3807 7 11C7 9.89 6.28 8.94 5.28 8.62C5.35 8.1 5.56 7.43 6.08 6.84C6.67 6.17 7.57 5.75 8.87 5.75H9.5C9.8 6.78 10.74 7.5 11.87 7.5C13.25 7.5 14.37 6.38 14.37 5C14.37 3.62 13.25 2.5 11.87 2.5C10.74 2.5 9.8 3.22 9.5 4.25H8.87C7.21 4.25 5.96 4.83 5.08 5.83C4.26 6.77 3.92 7.79 3.8 8.62C2.76 8.92 2 9.87 2 11C2 12.3807 3.11929 13.5 4.5 13.5Z"
      fill={color}
    />
  </svg>
);

export const IconMerge: React.FC<IconProps> = ({ size = 14, color = 'currentColor', style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
    <path
      d="M10.5 4C10.5 2.62 9.38 1.5 8 1.5C6.62 1.5 5.5 2.62 5.5 4C5.5 5.1 6.22 6.04 7.25 6.37V9.63C6.22 9.96 5.5 10.9 5.5 12C5.5 13.38 6.62 14.5 8 14.5C9.38 14.5 10.5 13.38 10.5 12C10.5 10.9 9.78 9.96 8.75 9.63V6.37C9.78 6.04 10.5 5.1 10.5 4ZM13.5 7.5C13.5 6.12 12.38 5 11 5C9.9 5 8.96 5.72 8.63 6.75C8.71 7.27 8.92 7.94 9.44 8.53C10.03 9.2 10.93 9.62 12.23 9.62H12.5V8.12L15 10.12L12.5 12.12V10.62H12.23C10.57 10.62 9.32 10.04 8.44 9.04C7.86 8.38 7.5 7.6 7.37 6.87C6.62 7.24 6.12 8.01 6.12 8.9C6.12 9.8 6.62 10.57 7.37 10.94V12C7.37 12.5 7.6 13 8 13.3V10.7C7.6 10.4 7.37 9.9 7.37 9.4C7.37 8.7 7.8 8.1 8.4 7.8C8.9 7.5 9.5 7.3 10.2 7.2C10.4 6.4 11.1 5.8 12 5.8C12.8 5.8 13.5 6.5 13.5 7.5Z"
      fill={color}
    />
  </svg>
);

export const IconCommit: React.FC<IconProps> = ({ size = 14, color = 'currentColor', style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
    <path
      d="M8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11C9.66 11 11 9.66 11 8C11 6.34 9.66 5 8 5ZM14 7.25H11.87C11.43 5.97 10.27 5.03 8.87 4.8V2H7.13V4.8C5.73 5.03 4.57 5.97 4.13 7.25H2V8.75H4.13C4.57 10.03 5.73 10.97 7.13 11.2V14H8.87V11.2C10.27 10.97 11.43 10.03 11.87 8.75H14V7.25Z"
      fill={color}
    />
  </svg>
);

export const IconCheckout: React.FC<IconProps> = ({ size = 14, color = 'currentColor', style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
    <path
      d="M8 1L6.6 2.4L11.2 7H1V9H11.2L6.6 13.6L8 15L15 8L8 1Z"
      fill={color}
    />
  </svg>
);

export const IconRevert: React.FC<IconProps> = ({ size = 14, color = 'currentColor', style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
    <path
      d="M4.5 3.5V1L1 4.5L4.5 8V5.5C7.54 5.5 10 7.96 10 11C10 12.35 9.52 13.59 8.71 14.56L9.82 15.67C10.88 14.41 11.5 12.78 11.5 11C11.5 7.13 8.37 4 4.5 4V3.5Z"
      fill={color}
    />
  </svg>
);

export const IconCherryPick: React.FC<IconProps> = ({ size = 14, color = 'currentColor', style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
    <path
      d="M8 1.5C6.62 1.5 5.5 2.62 5.5 4C5.5 4.8 5.88 5.52 6.47 5.97L3.72 10.42C3.33 10.15 2.86 10 2.35 10C1.05 10 0 11.05 0 12.35C0 13.65 1.05 14.7 2.35 14.7C3.65 14.7 4.7 13.65 4.7 12.35C4.7 11.84 4.55 11.37 4.28 10.98L7.03 6.53C7.33 6.67 7.65 6.75 8 6.75C8.35 6.75 8.67 6.67 8.97 6.53L11.72 10.98C11.45 11.37 11.3 11.84 11.3 12.35C11.3 13.65 12.35 14.7 13.65 14.7C14.95 14.7 16 13.65 16 12.35C16 11.05 14.95 10 13.65 10C13.14 10 12.67 10.15 12.28 10.42L9.53 5.97C10.12 5.52 10.5 4.8 10.5 4C10.5 2.62 9.38 1.5 8 1.5Z"
      fill={color}
    />
  </svg>
);

export const IconTag: React.FC<IconProps> = ({ size = 14, color = 'currentColor', style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
    <path
      d="M14.7 7.7L8.3 1.3C8 1 7.5 0.8 7 0.8H2C1.3 0.8 0.8 1.3 0.8 2V7C0.8 7.5 1 8 1.3 8.3L7.7 14.7C8.1 15.1 8.7 15.1 9.1 14.7L14.7 9.1C15.1 8.7 15.1 8.1 14.7 7.7ZM4 5C3.4 5 3 4.6 3 4C3 3.4 3.4 3 4 3C4.6 3 5 3.4 5 4C5 4.6 4.6 5 4 5Z"
      fill={color}
    />
  </svg>
);

export const IconReset: React.FC<IconProps> = ({ size = 14, color = 'currentColor', style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
    <path
      d="M8 3C4.13 3 1 6.13 1 10C1 13.87 4.13 17 8 17C11.87 17 15 13.87 15 10H13.5C13.5 13.04 11.04 15.5 8 15.5C4.96 15.5 2.5 13.04 2.5 10C2.5 6.96 4.96 4.5 8 4.5V7L12 3.5L8 0V3Z"
      fill={color}
    />
  </svg>
);

export const IconWarning: React.FC<IconProps> = ({ size = 14, color = 'currentColor', style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
    <path
      d="M8 1L0.5 14H15.5L8 1ZM8 3.8L13.2 12.5H2.8L8 3.8ZM7.2 6.5V9.5H8.8V6.5H7.2ZM7.2 10.5V12H8.8V10.5H7.2Z"
      fill={color}
    />
  </svg>
);

export const IconDanger: React.FC<IconProps> = ({ size = 14, color = '#f14c4c', style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
    <path
      d="M5.3 1L1 5.3V10.7L5.3 15H10.7L15 10.7V5.3L10.7 1H5.3ZM5.8 2.5H10.2L13.5 5.8V10.2L10.2 13.5H5.8L2.5 10.2V5.8L5.8 2.5ZM7.2 4.5V8.5H8.8V4.5H7.2ZM7.2 9.5V11H8.8V9.5H7.2Z"
      fill={color}
    />
  </svg>
);

export const IconCopy: React.FC<IconProps> = ({ size = 14, color = 'currentColor', style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
    <path
      d="M4 2H10C10.6 2 11 2.4 11 3V4H12C12.6 4 13 4.4 13 5V13C13 13.6 12.6 14 12 14H6C5.4 14 5 13.6 5 13V12H4C3.4 12 3 11.6 3 11V3C3 2.4 3.4 2 4 2ZM5 11H6V5C6 4.4 6.4 4 7 4H10V3H4V11H5ZM12 13V5H7V13H12Z"
      fill={color}
    />
  </svg>
);

export const IconTree: React.FC<IconProps> = ({ size = 14, color = 'currentColor', style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
    <path
      d="M8 1C6.9 1 6 1.9 6 3C6 3.7 6.4 4.3 7 4.7V6H4C2.9 6 2 6.9 2 8V9.3C1.4 9.7 1 10.3 1 11C1 12.1 1.9 13 3 13C4.1 13 5 12.1 5 11C5 10.3 4.6 9.7 4 9.3V8C4 7.4 4.4 7 5 7H7V9.3C6.4 9.7 6 10.3 6 11C6 12.1 6.9 13 8 13C9.1 13 10 12.1 10 11C10 10.3 9.6 9.7 9 9.3V7H11C11.6 7 12 7.4 12 8V9.3C11.4 9.7 11 10.3 11 11C11 12.1 11.9 13 13 13C14.1 13 15 12.1 15 11C15 10.3 14.6 9.7 14 9.3V8C14 6.9 13.1 6 12 6H9V4.7C9.6 4.3 10 3.7 10 3C10 1.9 9.1 1 8 1Z"
      fill={color}
    />
  </svg>
);

export const IconTimeline: React.FC<IconProps> = ({ size = 14, color = 'currentColor', style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
    <path
      d="M8 1.5C4.4 1.5 1.5 4.4 1.5 8C1.5 11.6 4.4 14.5 8 14.5C11.6 14.5 14.5 11.6 14.5 8C14.5 4.4 11.6 1.5 8 1.5ZM8 13C5.2 13 3 10.8 3 8C3 5.2 5.2 3 8 3C10.8 3 13 5.2 13 8C13 10.8 10.8 13 8 13ZM8.5 4.5H7.5V8.5L10.5 10.3L11 9.4L8.5 7.9V4.5Z"
      fill={color}
    />
  </svg>
);

export const IconInfo: React.FC<IconProps> = ({ size = 14, color = '#3794ff', style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
    <path
      d="M8 1.5C4.4 1.5 1.5 4.4 1.5 8C1.5 11.6 4.4 14.5 8 14.5C11.6 14.5 14.5 11.6 14.5 8C14.5 4.4 11.6 1.5 8 1.5ZM8 13C5.2 13 3 10.8 3 8C3 5.2 5.2 3 8 3C10.8 3 13 5.2 13 8C13 10.8 10.8 13 8 13ZM7.2 6H8.8V11H7.2V6ZM8 3.8C7.4 3.8 7 4.2 7 4.8C7 5.4 7.4 5.8 8 5.8C8.6 5.8 9 5.4 9 4.8C9 4.2 8.6 3.8 8 3.8Z"
      fill={color}
    />
  </svg>
);

export const IconBook: React.FC<IconProps> = ({ size = 14, color = 'currentColor', style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
    <path
      d="M8 2.5L1 5.5L8 8.5L15 5.5L8 2.5ZM2.8 7.3V11.5L8 14.2L13.2 11.5V7.3L8 9.8L2.8 7.3Z"
      fill={color}
    />
  </svg>
);

export const IconFetch: React.FC<IconProps> = ({ size = 14, color = 'currentColor', style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
    <path
      d="M8 12L4 8H7V2H9V8H12L8 12ZM2 14V13H14V14H2Z"
      fill={color}
    />
  </svg>
);

export const IconCheck: React.FC<IconProps> = ({ size = 14, color = 'currentColor', style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
    <path
      d="M13.5 3.5L6 11L2.5 7.5L3.5 6.5L6 9L12.5 2.5L13.5 3.5Z"
      fill={color}
    />
  </svg>
);

export const IconExternalLink: React.FC<IconProps> = ({ size = 14, color = 'currentColor', style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
    <path
      d="M1.5 1.5H7V3H3V13H13V9H14.5V14.5H1.5V1.5ZM9.5 1.5H14.5V6.5H13V4.06L7.53 9.53L6.47 8.47L11.94 3H9.5V1.5Z"
      fill={color}
    />
  </svg>
);

export const IconGlobe: React.FC<IconProps> = ({ size = 14, color = 'currentColor', style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
    <path
      d="M8 1C4.13 1 1 4.13 1 8C1 11.87 4.13 15 8 15C11.87 15 15 11.87 15 8C15 4.13 11.87 1 8 1ZM8 2.25C9.07 2.25 10.05 2.56 10.9 3.09C10.74 3.73 10.37 4.7 9.5 5.5C8.42 6.5 7.08 7.08 5.75 7.42C5.58 6.58 5.5 5.75 5.5 5C5.5 3.67 6.42 2.42 8 2.25ZM2.35 7.25C3.33 7.08 4.5 6.75 5.42 6C6.17 5.33 6.67 4.42 6.83 3.5C4.75 4.17 3.08 5.5 2.35 7.25ZM2.25 8C2.25 7.83 2.26 7.67 2.28 7.5C3.33 7.5 4.75 7.67 6 8.5C7.25 9.33 8 10.5 8.25 11.75C8.25 11.83 8.25 11.92 8.25 12C8.25 12.58 8.08 13.08 7.83 13.58C4.67 13.17 2.25 10.83 2.25 8ZM8.83 13.67C9.25 13 9.5 12.17 9.5 11.25C9.5 10.33 9.08 9.42 8.33 8.75C7.67 8.17 6.75 7.75 5.75 7.58C7.17 7.25 8.67 6.58 9.83 5.5C10.5 4.83 11 4 11.33 3.17C12.83 4.25 13.75 6 13.75 8C13.75 9.75 12.92 11.33 11.58 12.33C10.75 13.08 9.83 13.5 8.83 13.67Z"
      fill={color}
    />
  </svg>
);

export const IconSync: React.FC<IconProps> = ({ size = 14, color = 'currentColor', style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
    <path
      d="M13.65 2.35A7.958 7.958 0 0 0 8 0C3.58 0 .01 3.58.01 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 8 14c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L9 7h7V0l-2.35 2.35z"
      fill={color}
    />
  </svg>
);

export const IconCloudUpload: React.FC<IconProps> = ({ size = 14, color = 'currentColor', style }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}>
    <path
      d="M12.5 6.5C12.1 4.5 10.3 3 8 3C6.1 3 4.5 4.1 3.8 5.7C1.6 6.1 0 8.1 0 10.5C0 13 2 15 4.5 15H12C14.2 15 16 13.2 16 11C16 8.9 14.4 7.1 12.5 6.5ZM8 7.5L11.5 11H9V14H7V11H4.5L8 7.5Z"
      fill={color}
    />
  </svg>
);
