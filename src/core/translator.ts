import en from "../locales/en.json" with { type: "json" };
import es from "../locales/es.json" with { type: "json" };

type Locale = typeof en;

const locales = {
    en,
    es,
} satisfies Record<string, Locale>;

type Language = keyof typeof locales;
type TranslationKey = keyof Locale;

function translate<K extends TranslationKey>(
    language: Language,
    key: K
): Locale[K] {
    return locales[language][key];
}

export {
    translate,
};
