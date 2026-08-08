import fs from "node:fs"
import path from "node:path";

import {colors} from "./colors.js"
import { dateToString } from "./time.js";

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
    logFilePath: ConfigValue,
    errorFilePath: ConfigValue,
    warningFilePath: ConfigValue,
}
type ColorConfig = {
    logColor: ColorValue;
    errorColor: ColorValue;
    warningColor: ColorValue;
    debugColor: ColorValue;
}
type Formatconfig = {
    timestampFormat: ConfigValue,
    titleCase: Cases,
    prefix?: string
    suffix?: string
}

type LoggerConfig = {
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
    save: {
        logFilePath: null,
        errorFilePath: null, //"logs/error.log",
        warningFilePath: null,
    },
    color: {
        logColor: "blue",
        errorColor: "red",
        warningColor: "yellow",
        debugColor: null
    },
    format: {
        timestampFormat: "DD-MM-YYYY hh:mm:ss",
        titleCase: "uppercase",
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
    const [ header, body ] = parseContent(level, ...content);
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

function parseContent(level: string, ...body: unknown[]) : [string, string] {
    let header = "";
    if (config.format.timestampFormat) {
        const timestamp = dateToString(new Date(), config.format.timestampFormat);
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
    return [ header, content ];
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
        write(
            "log",
            config.color.logColor,
            config.save.logFilePath,
            ...content
        );
    },

    error(...content: unknown[]) {
        write(
            "error",
            config.color.errorColor,
            config.save.errorFilePath,
            ...content
        );
    },

    warning(...content: unknown[]) {
        write(
            "warning",
            config.color.warningColor,
            config.save.warningFilePath,
            ...content
        );
    },

    debug(...content: unknown[]) {
        write(
            "debug",
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