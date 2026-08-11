# Quik

Quik is an Express-based TypeScript library designed to simplify the creation of modern Node.js backends.

It provides a clean API for building HTTP servers, routers, middleware, scheduled tasks, and cron-based jobs while reducing repetitive code.

## Features

* Express-based HTTP server
* Fluent routing API
* Middleware support
* JSON, URL-encoded, raw, and text body parsing
* HTTP server configuration
* Cron task management powered by `node-cron`
* Cron schedule builder
* Time zone support
* Built-in logger
* TypeScript support
* ESM and CommonJS package entry points

## Requirements

* Node.js 22 or later

## Installation

```bash
npm install @desaubv/quik
```

## Quick Start

```ts
import { Server, Router } from "@desaubv/quik";

const router = Router();

router
    .path("/hello")
    .get((req, res) => {
        res.json({
            message: "Hello, world!",
        });
    });

const server = Server();

server
    .addRoute("/", router)
    .start();
```

By default, the server listens on:

```text
http://localhost:8080
```

## Cron

Cron functionality is available through the `/cron` subpath:

```ts
import { Cron, Schedule } from "@desaubv/quik/cron";

const cron = Cron();

cron.add({
    name: "backup",
    schedule: Schedule.every(6).hours(),
    task: async () => {
        console.log("Running backup...");
    },
});
```

The cron manager can then be attached to the server:

```ts
const server = Server();

server
    .addCron(cron)
    .start();
```

## HTTP Status Codes

HTTP status codes are available through the `/http` subpath:

```ts
import { Status } from "@desaubv/quik/http";

router
    .path("/users")
    .get((req, res) => {
        res
            .status(Status.OK)
            .json([]);
    });
```

## Package Exports

Quik provides three public entry points:

### Main

```ts
import {
    Server,
    Router,
    QuikRouter,
    logger,
} from "@desaubv/quik";
```

### Cron

```ts
import {
    Cron,
    QuikCron,
    Schedule,
} from "@desaubv/quik/cron";
```

### HTTP

```ts
import { Status } from "@desaubv/quik/http";
```

## Server Configuration

```ts
const server = Server();

server.setConfig({
    http: {
        port: 3000,
        host: "localhost",
    },
});
```

### HTTP Options

```ts
server.setConfig({
    http: {
        port: 8080,
        host: "localhost",
        keepAlive: 5000,
        timeout: 10000,
        maxConnections: 100,
        shutdownTimeout: 5000,
    },
});
```

### Express Options

```ts
server.setConfig({
    express: {
        trustProxy: true,
    },
});
```

## Body Parser

Quik supports the Express body parsers:

```ts
server.setConfig({
    bodyParser: {
        type: "json",
    },
});
```

Available types:

```text
json
urlencoded
raw
text
```

Each type accepts the corresponding Express options.

For example:

```ts
server.setConfig({
    bodyParser: {
        type: "json",
        options: {
            limit: "1mb",
        },
    },
});
```

## Middleware

Global middleware can be registered with `addMiddleware()`:

```ts
server.addMiddleware(
    middleware1,
    middleware2,
);
```

Route-specific middleware can be registered through the router:

```ts
router
    .path("/users")
    .middleware(authMiddleware)
    .get((req, res) => {
        res.json([]);
    });
```

## Router

Create a router with:

```ts
const router = Router();
```

Register routes using the fluent API:

```ts
router
    .path("/users")
    .get(handler);

router
    .path("/users")
    .post(handler);

router
    .path("/users/:id")
    .put(handler);

router
    .path("/users/:id")
    .patch(handler);

router
    .path("/users/:id")
    .delete(handler);
```

Supported HTTP methods:

```text
GET
POST
PUT
PATCH
DELETE
```

Mount the router on the server:

```ts
server.addRoute("/api", router);
```

A route registered as:

```text
/users
```

will therefore be available at:

```text
/api/users
```

## Cron Schedule Builder

Instead of writing cron expressions manually, use `Schedule`:

```ts
import { Schedule } from "@desaubv/quik/cron";
```

Examples:

```ts
Schedule.every(10).seconds();

Schedule.every(5).minutes();

Schedule.every(2).hours();

Schedule.every(3).days();

Schedule.every(2).months();

Schedule.at("08:30");

Schedule.weekday("monday", "09:00");

Schedule.weekdaysAt("09:00");

Schedule.weekendsAt("10:00");
```

### Examples

```ts
Schedule.every(5).minutes();
// */5 * * * *

Schedule.every(6).hours();
// 0 */6 * * *

Schedule.at("08:30");
// 30 8 * * *

Schedule.weekday("monday", "09:00");
// 0 9 * * 1

Schedule.weekdaysAt("09:00");
// 0 9 * * 1-5

Schedule.weekendsAt("10:00");
// 0 10 * * 0,6
```

## Cron Configuration

Cron instances can be configured with `setConfig()`:

```ts
cron.setConfig({
    language: "en",
    timeZone: "America/Los_Angeles",

    onError: (error) => {
        console.error(error);
    },
});
```

A task can also define its own time zone:

```ts
cron.add({
    name: "daily-report",
    schedule: Schedule.at("12:00"),
    timezone: "America/Los_Angeles",

    task: async () => {
        console.log("Generating report...");
    },
});
```

A task-specific time zone takes precedence over the default cron time zone.

## Complete Example

```ts
import {
    Server,
    Router,
} from "@desaubv/quik";

import {
    Cron,
    Schedule,
} from "@desaubv/quik/cron";

const router = Router();

router
    .path("/health")
    .get((req, res) => {
        res
            .status(200)
            .json({
                status: "ok",
            });
    });

router
    .path("/users")
    .get((req, res) => {
        res.json([]);
    });

const cron = Cron();

cron.add({
    name: "cleanup",
    schedule: Schedule.every(30).minutes(),

    task: async () => {
        console.log("Running cleanup...");
    },
});

cron.add({
    name: "daily-report",
    schedule: Schedule.at("08:00"),
    timezone: "America/Los_Angeles",

    task: async () => {
        console.log("Generating daily report...");
    },
});

const server = Server();

server
    .setConfig({
        http: {
            port: 8080,
        },
    })
    .addMiddleware((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        next();
    })
    .addRoute("/api", router)
    .addCron(cron)
    .start();
```

The resulting API includes:

```text
GET /api/health
GET /api/users
```

while the configured cron tasks run alongside the HTTP server.

## Logger

Quik includes a configurable logger with support for multiple log levels, colors, timestamps, file output, formatting, and localization.

```ts
import { logger } from "@desaubv/quik";
```

### Log Levels

Quik provides five predefined log levels:

```ts
logger.log("Application message");

logger.info("Server started");

logger.warning("Configuration is missing");

logger.error("Something went wrong");

logger.debug("Debug information");
```

The logger accepts multiple values:

```ts
logger.info(
    "User created:",
    {
        id: 123,
        name: "John",
    },
);
```

Errors are handled automatically:

```ts
try {
    throw new Error("Something went wrong");
} catch (error) {
    logger.error("Request failed:", error);
}
```

### Default Output

The default format is:

```text
DD-MM-YYYY hh:mm:ss [LEVEL] message
```

For example:

```text
11-08-2026 00:34:30 [INFO] Server started
```

### Configuration

Logger configuration can be changed using `setConfig()`:

```ts
logger.setConfig({
    color: {
        infoColor: "green",
        errorColor: "red",
        warningColor: "yellow",
        logColor: "blue",
        debugColor: null,
    },

    format: {
        timestampFormat: "DD-MM-YYYY hh:mm:ss",
        titleCase: "uppercase",
    },
});
```

Configuration updates are merged with the existing configuration.

### Getting Configuration

Use `config()` to retrieve the current logger configuration:

```ts
const config = logger.config();

console.log(config);
```

The returned configuration is read-only.

### File Output

Each log level can optionally be written to its own file.

```ts
logger.setConfig({
    save: {
        logFilePath: "logs/app.log",
        infoFilePath: "logs/info.log",
        warningFilePath: "logs/warning.log",
        errorFilePath: "logs/error.log",
    },
});
```

Quik automatically creates the required directories.

For example:

```text
logs/
├── app.log
├── info.log
├── warning.log
└── error.log
```

Set a path to `null` to disable file output for a level:

```ts
logger.setConfig({
    save: {
        infoFilePath: null,
    },
});
```

### Colors

The following colors are supported:

```text
black
red
green
yellow
blue
magenta
cyan
white
```

Configure colors per log level:

```ts
logger.setConfig({
    color: {
        logColor: "blue",
        infoColor: "green",
        warningColor: "yellow",
        errorColor: "red",
        debugColor: "cyan",
    },
});
```

Set a color to `null` to disable coloring:

```ts
logger.setConfig({
    color: {
        debugColor: null,
    },
});
```

### Message Formatting

The logger supports custom prefixes and suffixes:

```ts
logger.setConfig({
    format: {
        prefix: "[Quik] ",
        suffix: " ",
    },
});
```

This can produce output such as:

```text
[Quik] 11-08-2026 00:34:30 [INFO] Server started
```

### Title Case

The log level can be formatted using:

```ts
logger.setConfig({
    format: {
        titleCase: "uppercase",
    },
});
```

Available values:

| Value          | Output          |
| -------------- | --------------- |
| `"uppercase"`  | `[INFO]`        |
| `"lowercase"`  | `[info]`        |
| `"capitalize"` | `[Info]`        |
| `"none"`       | `[INFO]`        |
| `null`         | No level header |

### Timestamp

The timestamp can be customized:

```ts
logger.setConfig({
    format: {
        timestampFormat: "YYYY-MM-DD hh:mm:ss",
    },
});
```

Disable timestamps by setting:

```ts
logger.setConfig({
    format: {
        timestampFormat: null,
    },
});
```

### Time Zone

A specific IANA time zone can be configured:

```ts
logger.setConfig({
    format: {
        timeZone: "America/Los_Angeles",
    },
});
```

Quik validates configured time zones and falls back to the system time zone if an invalid value is provided.

### Custom Log Levels

Use `custom()` when the predefined levels are not enough:

```ts
logger.custom(
    "SUCCESS",
    "green",
    "logs/success.log",
    "Operation completed successfully",
);
```

The method accepts:

```ts
logger.custom(
    level,
    color,
    file,
    ...content,
);
```

### Clearing the Console

The console can be cleared using:

```ts
logger.clear();
```

## Logger Configuration Reference

| Property                 | Type                      | Description                   |
| ------------------------ | ------------------------- | ----------------------------- |
| `save.logFilePath`       | `string \| null \| false` | File for `log()` messages     |
| `save.infoFilePath`      | `string \| null \| false` | File for `info()` messages    |
| `save.errorFilePath`     | `string \| null \| false` | File for `error()` messages   |
| `save.warningFilePath`   | `string \| null \| false` | File for `warning()` messages |
| `color.logColor`         | `ColorName \| null`       | Color for `log()`             |
| `color.infoColor`        | `ColorName \| null`       | Color for `info()`            |
| `color.errorColor`       | `ColorName \| null`       | Color for `error()`           |
| `color.warningColor`     | `ColorName \| null`       | Color for `warning()`         |
| `color.debugColor`       | `ColorName \| null`       | Color for `debug()`           |
| `format.timestampFormat` | `string \| null \| false` | Timestamp format              |
| `format.titleCase`       | `Cases`                   | Log-level formatting          |
| `format.prefix`          | `string`                  | Text before the log           |
| `format.suffix`          | `string`                  | Text after the log            |
| `format.timeZone`        | `string`                  | IANA time zone                |

## Logger Defaults

The default configuration is:

```ts
{
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
        debugColor: null,
    },

    format: {
        timestampFormat: "DD-MM-YYYY hh:mm:ss",
        titleCase: "uppercase",
    },
}
```

## Development

Clone the repository and install dependencies:

```bash
git clone https://github.com/DiegoBarajas/quik.git
cd quik
npm install
```

Build the package:

```bash
npm run build
```

Start the TypeScript build in watch mode:

```bash
npm run dev
```

## License

Quik is released under the MIT License.
