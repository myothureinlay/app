import type { IconStyle } from '../types';

export function iconForStyle(icon: string, style: IconStyle) {
  if (style !== 'filled') return icon;
  if (icon.startsWith('logo-')) return icon;
  return icon.endsWith('-outline') ? icon.replace(/-outline$/, '') : icon;
}
