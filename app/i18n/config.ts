import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Importar as traduções
import enCommon from './locales/en-US/common.json';
import ptCommon from './locales/pt-BR/common.json';
import enHome from './locales/en-US/home.json';
import ptHome from './locales/pt-BR/home.json';

// Detectar idioma do navegador ou usar o padrão
const browserLanguage = typeof window !== 'undefined'
  ? navigator.language
  : 'pt-BR';

// Mapear códigos de idioma do navegador para nossos códigos
const languageMap: Record<string, string> = {
  'pt': 'pt-BR',
  'pt-BR': 'pt-BR',
  'en': 'en-US',
  'en-US': 'en-US',
};

const defaultLanguage = languageMap[browserLanguage] || 'pt-BR';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      'en-US': {
        common: enCommon,
        home: enHome,
      },
      'pt-BR': {
        common: ptCommon,
        home: ptHome,
      },
    },
    lng: defaultLanguage,
    fallbackLng: 'pt-BR',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // React já faz escape
    },
  });

export default i18n;
