import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import ar from './ar.json';

const STORAGE_KEY = 'cardsmith.lang';

function applyLanguage(lang: string) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.body.dataset.lang = lang;
}

const saved = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
const initialLang = saved || 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: initialLang,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

applyLanguage(initialLang);
i18n.on('languageChanged', (lang) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, lang);
  }
  applyLanguage(lang);
});

export default i18n;
