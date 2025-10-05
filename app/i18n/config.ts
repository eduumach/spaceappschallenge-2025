import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Importar as traduções
import enCommon from './locales/en-US/common.json';
import ptCommon from './locales/pt-BR/common.json';
import enHome from './locales/en-US/home.json';
import ptHome from './locales/pt-BR/home.json';
import enAnalysis from './locales/en-US/analysis.json';
import ptAnalysis from './locales/pt-BR/analysis.json';
import enEventProfiles from './locales/en-US/eventProfiles.json';
import ptEventProfiles from './locales/pt-BR/eventProfiles.json';
import enResults from './locales/en-US/results.json';
import ptResults from './locales/pt-BR/results.json';

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
        analysis: enAnalysis,
        eventProfiles: enEventProfiles,
        results: enResults,
      },
      'pt-BR': {
        common: ptCommon,
        home: ptHome,
        analysis: ptAnalysis,
        eventProfiles: ptEventProfiles,
        results: ptResults,
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
