# Internacionalização (i18n)

Este projeto usa `i18next` e `react-i18next` para suportar múltiplos idiomas.

## Idiomas Suportados

- 🇧🇷 Português (pt-BR) - Padrão
- 🇺🇸 English (en-US)

## Estrutura de Arquivos

```
app/i18n/
├── config.ts              # Configuração do i18next
├── useTranslation.ts      # Hook customizado
└── locales/
    ├── pt-BR/
    │   └── common.json    # Traduções em português
    └── en-US/
        └── common.json    # Traduções em inglês
```

## Como Usar

### 1. Importar o hook

```tsx
import { useTranslation } from "~/i18n/useTranslation";
```

### 2. Usar no componente

```tsx
export function MyComponent() {
  const { t } = useTranslation();

  return <h1>{t('welcome')}</h1>;
}
```

### 3. Adicionar novas traduções

Edite os arquivos JSON em `app/i18n/locales/{idioma}/`:

**pt-BR/common.json:**
```json
{
  "myNewKey": "Minha nova tradução"
}
```

**en-US/common.json:**
```json
{
  "myNewKey": "My new translation"
}
```

### 4. Criar namespaces adicionais

Para organizar melhor as traduções, crie novos arquivos JSON:

```
locales/
├── pt-BR/
│   ├── common.json
│   └── homepage.json    # Novo namespace
└── en-US/
    ├── common.json
    └── homepage.json    # Novo namespace
```

Depois, importe e configure no `config.ts`:

```tsx
import homepageEN from './locales/en-US/homepage.json';
import homepagePT from './locales/pt-BR/homepage.json';

// ...

resources: {
  'en-US': {
    common: enCommon,
    homepage: homepageEN,
  },
  'pt-BR': {
    common: ptCommon,
    homepage: homepagePT,
  },
}
```

Use no componente:

```tsx
const { t } = useTranslation('homepage');
```

### 5. Mudar idioma

```tsx
import { useTranslation } from "~/i18n/useTranslation";

export function MyComponent() {
  const { i18n } = useTranslation();

  const changeToEnglish = () => {
    i18n.changeLanguage('en-US');
  };

  const changeToBrazilian = () => {
    i18n.changeLanguage('pt-BR');
  };

  return (
    <div>
      <button onClick={changeToEnglish}>English</button>
      <button onClick={changeToBrazilian}>Português</button>
    </div>
  );
}
```

### 6. Componente de Seletor de Idioma

Use o componente pronto:

```tsx
import { LanguageSelector } from "~/components/language-selector";

export function Header() {
  return (
    <header>
      <LanguageSelector />
    </header>
  );
}
```

## Interpolação

Use variáveis nas traduções:

```json
{
  "greeting": "Olá, {{name}}!"
}
```

```tsx
t('greeting', { name: 'João' })
// Resultado: "Olá, João!"
```

## Pluralização

```json
{
  "items_one": "{{count}} item",
  "items_other": "{{count}} itens"
}
```

```tsx
t('items', { count: 1 })  // "1 item"
t('items', { count: 5 })  // "5 itens"
```
