import en from "../locales/en.json" with { type: "json" };
import es from "../locales/es.json" with { type: "json" };

const locales = {
    en,
    es
};

type Language = keyof typeof locales;
type TranslationKey = keyof typeof en;

function translate(
    language: Language,
    key: TranslationKey
) {
    return locales[language][key];
}

export {
    translate
};