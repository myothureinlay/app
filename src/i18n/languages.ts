import type { LanguageCode } from '../types';

export interface LanguageMetadata {
  code: LanguageCode;
  label: string;
  nativeName: string;
  locale: string;
}

export const languages: LanguageMetadata[] = [
  { code: 'en', label: 'English', nativeName: 'English', locale: 'en-US' },
  { code: 'my', label: 'Burmese', nativeName: 'မြန်မာ', locale: 'my-MM' },
  { code: 'th', label: 'Thai', nativeName: 'ไทย', locale: 'th-TH' },
  { code: 'zh-Hans', label: 'Chinese Simplified', nativeName: '简体中文', locale: 'zh-CN' },
];

export const supportedLanguages = languages.map((language) => language.code);

export function localeForLanguage(code: LanguageCode) {
  return languages.find((language) => language.code === code)?.locale ?? 'en-US';
}
