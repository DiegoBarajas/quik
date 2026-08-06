import fs from "node:fs"
import path from "node:path";

import colors from "colors"

import { dateToString } from "./time.js";

/* Types */
type ConfigValue = string | null | false;
type Cases = "uppercase" | "lowercase" | "capitalize" | "none" | null;
type ColorName =
    | "red"
    | "green"
    | "yellow"
    | "blue"
    | "magenta"
    | "cyan"
    | "white"
    | "gray";

type SaveConfig = {
    logFilePath: ConfigValue,
    errorFilePath: ConfigValue,
    warningFilePath: ConfigValue,
}
type ColorConfig = {
    logColor: ColorName | null | false;
    errorColor: ColorName | null | false;
    warningColor: ColorName | null | false;
    debugColor: ColorName | null | false;
}
type Formatconfig = {
    timestampFormat: ConfigValue,
    titleCase: Cases,
}

type Config = {
    save: SaveConfig,
    color: ColorConfig,
    format: Formatconfig,
}
type PartialConfig = Partial<{
    save: Partial<SaveConfig>;
    color: Partial<ColorConfig>;
    format: Partial<Formatconfig>;
}>;

const defaultConfig: Config = {
    save: {
        logFilePath: null,
        errorFilePath: "logs/error.log",
        warningFilePath: null,
    },
    color: {
        logColor: "blue",
        errorColor: "red",
        warningColor: "yellow",
        debugColor: null,
    },
    format: {
        timestampFormat: "dd/MM/yyyy HH:mm:ss",
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
    const body = parseContent(level, ...content);

    saveToFile(file, body);

    if (color) {
        const colorFn = colors[color] ?? ((s: string) => s);
        console.log(colorFn(body));
    } else {
        console.log(body);
    }
}

function parseContent(level: string, ...body: unknown[]): string {
    let message = ""
    if (config.format.timestampFormat) {
        const timestamp = dateToString(new Date(), config.format.timestampFormat);
        message += `${timestamp} `;
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

    message += level + tokenize(...body).join(" ");
    return message;
}

function saveToFile(filePath: ConfigValue, content: string): void {
    if (!filePath || !content.length) return;

    const dir = path.dirname(filePath);
    const logMessage = content + "\n";

    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(filePath, logMessage);
}

export const logger = {
    // Setter config
    setConfig(newConfig: PartialConfig): void {
        config = {
            ...config,
            save: {
                ...config.save,
                ...newConfig.save,
            },
            color: {
                ...config.color,
                ...newConfig.color,
            },
            format: {
                ...config.format,
                ...newConfig.format,
            },
        };
    },

    // Getter config
    config(): Readonly<Config> {
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