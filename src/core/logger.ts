import fs from "node:fs"
import path from "node:path";

import { colors } from "./colors.js"
import { dateToString, isValidTimeZone } from "./time.js";
import { translate } from "./translator.js";

/* Types */
type ConfigValue = string | null | false;
type Cases = "uppercase" | "lowercase" | "capitalize" | "none" | null;
type ColorName =
    | "black"
    | "red"
    | "green"
    | "yellow"
    | "blue"
    | "magenta"
    | "cyan"
    | "white";

type ColorValue = ColorName | null;
type SaveConfig = {
    infoFilePath: ConfigValue,
    logFilePath: ConfigValue,
    errorFilePath: ConfigValue,
    warningFilePath: ConfigValue,
}
type ColorConfig = {
    logColor: ColorValue;
    infoColor: ColorValue;
    errorColor: ColorValue;
    warningColor: ColorValue;
    debugColor: ColorValue;
}
type Formatconfig = {
    timestampFormat: ConfigValue,
    titleCase: Cases,
    prefix?: string
    suffix?: string
    timeZone?: string
}

type LoggerConfig = {
    language: Language,
    save: SaveConfig,
    color: ColorConfig,
    format: Formatconfig,
}
type PartialConfig = Partial<{
    save: Partial<SaveConfig>;
    color: Partial<ColorConfig>;
    format: Partial<Formatconfig>;
}>;

const defaultConfig: LoggerConfig = {
    language: "en",
    save: {
        logFilePath: null,
        infoFilePath: null,
        errorFilePath: "logs/error.log",
        warningFilePath: "logs/warning.log",
    },
    color: {
        logColor: "blue",
        infoColor: "green",
        errorColor: "red",
        warningColor: "yellow",
        debugColor: null
    },
    format: {
        timestampFormat: "DD-MM-YYYY hh:mm:ss",
        titleCase: "uppercase"
    }
}

let config = structuredClone(defaultConfig);

function tokenize(...args: unknown[]): string[] {
    return args.map(arg => {
        if (typeof arg === "string") return arg;

        if (arg instanceof Error) {
            return arg.stack ?? arg.message;
        }

        if (arg === null || arg === undefined) {
            return String(arg);
        }

        if (typeof arg === "object") {
            try {
                return JSON.stringify(arg);
            } catch {
                return "[Circular]";
            }
        }

        return String(arg);
    });
}

function write(
    level: string,
    color: ColorName | null | false,
    file: ConfigValue,
    ...content: unknown[]
) {
    const [header, body] = parseContent(level, ...content);
    saveToFile(file, header + body);

    const prefix = config.format.prefix ?? "";
    const suffix = config.format.suffix ?? "";

    if (color) {
        const colorFn = colors[color] ?? ((s: string) => s);
        console.log(`${prefix}${header}${colorFn(body)}${suffix}`);
    } else {
        console.log(`${prefix}${header}${body}${suffix}`);
    }
}

function parseContent(level: string, ...body: unknown[]): [string, string] {
    let header = "";
    if (config.format.timestampFormat) {
        const now = new Date();
        const timeZone = config.format.timeZone;
        let tz = timeZone;

        if (timeZone && !isValidTimeZone(timeZone)) {
            tz = undefined;
        }

        const timestamp = dateToString(
            now,
            config.format.timestampFormat,
            tz
        );

        header += `${timestamp} `;
    }

    switch (config.format.titleCase) {
        case "uppercase":
            level = `[${level.toUpperCase()}] `;
            break;
        case "lowercase":
            level = `[${level.toLocaleLowerCase()}] `;
            break;
        case "capitalize":
            level = `[${level.charAt(0).toUpperCase() + level.slice(1).toLowerCase()}] `;
            break;
        case "none":
            level = `[${level}] `;
            break;
        default:
            level = "";
            break;
    }
    let content = level + tokenize(...body).join(" ");
    return [header, content];
}

function saveToFile(filePath: ConfigValue, content: string): void {
    if (!filePath || !content.length) return;

    const dir = path.dirname(filePath);
    const logMessage = content + "\n";

    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(filePath, logMessage);
}

function mergeConfig(
    current: LoggerConfig,
    update: PartialConfig
): LoggerConfig {
    return {
        ...current,
        ...update,
        save: {
            ...current.save,
            ...update.save,
        },
        color: {
            ...current.color,
            ...update.color,
        },
        format: {
            ...current.format,
            ...update.format,
        },
    };
}

export const logger = {
    // Setter config
    setConfig(newConfig: PartialConfig): void {
        config = mergeConfig(config, newConfig);
    },

    // Getter config
    config(): Readonly<LoggerConfig> {
        return Object.freeze(structuredClone(config));
    },

    log(...content: unknown[]) {
        const messages = translate(config.language, "logger");
        write(
            messages.levels.log,
            config.color.logColor,
            config.save.logFilePath,
            ...content
        );
    },

    info(...content: unknown[]) {
        const messages = translate(config.language, "logger");
        write(
            messages.levels.info,
            config.color.infoColor,
            config.save.infoFilePath,
            ...content
        );
    },

    error(...content: unknown[]) {
        const messages = translate(config.language, "logger");
        write(
            messages.levels.error,
            config.color.errorColor,
            config.save.errorFilePath,
            ...content
        );
    },

    warning(...content: unknown[]) {
        const messages = translate(config.language, "logger");
        write(
            messages.levels.warning,
            config.color.warningColor,
            config.save.warningFilePath,
            ...content
        );
    },

    debug(...content: unknown[]) {
        const messages = translate(config.language, "logger");
        write(
            messages.levels.debug,
            config.color.debugColor,
            null,
            ...content
        );
    },

    custom(
        level: string,
        color: ColorName | null | false,
        file: ConfigValue,
        ...content: unknown[]
    ) {
        write(level, color, file, ...content);
    }


}