import { I18n } from 'i18n-js';

import type { LanguageCode } from '../types';
import { en } from './locales/en';
import { my } from './locales/my';
import { th } from './locales/th';
import { zhHans } from './locales/zh-Hans';

export const translations = { en, my, th, 'zh-Hans': zhHans };

export const i18n = new I18n(translations);
i18n.defaultLocale = 'en';
i18n.enableFallback = true;

export function setI18nLocale(language: LanguageCode) {
  i18n.locale = language;
}

export function t(key: string, params?: Record<string, string | number>) {
  return i18n.t(key, params);
}
