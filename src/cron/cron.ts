import cron from "node-cron";
import { type ScheduledTask } from "node-cron";

import {
    CronTaskAlreadyExistsError,
    CronInvalidScheduleError,
    CronInvalidTimeZoneError,
    CronTaskExecutionError,
} from "./exceptions.js";

import { isValidTimeZone } from "../core/time.js";
import type { CronConfig, CronTask, PartialCronConfig } from "./types.js";

// Default configuration 
const defaultConfig: CronConfig = {
    language: "en",
};

// Cron Class
class QuikCron {
    private tasks = new Map<string, CronTask>();
    private jobs = new Map<string, ScheduledTask>();

    #config: CronConfig = structuredClone(defaultConfig);

    constructor() {
        
    }

    add(task: CronTask): void {
        if (this.tasks.has(task.name)) {
            throw new CronTaskAlreadyExistsError(
                task.name
            );
        }

        if (!cron.validate(task.schedule)) {
            throw new CronInvalidScheduleError(
                task.schedule
            );
        }

        if (
            task.timezone &&
            !isValidTimeZone(task.timezone)
        ) {
            throw new CronInvalidTimeZoneError(
                task.timezone
            );
        }

        this.tasks.set(task.name, {
            ...task,
        });
    }

    remove(name: string): boolean {
        this.jobs.get(name)?.stop();
        this.jobs.delete(name);

        return this.tasks.delete(name);
    }

    has(name: string): boolean {
        return this.tasks.has(name);
    }

    get(name: string): CronTask | undefined {
        return this.tasks.get(name);
    }

    getTasks(): CronTask[] {
        return [...this.tasks.values()];
    }

    start(): void {
        for (const task of this.tasks.values()) {
            if (this.jobs.has(task.name)) {
                continue;
            }

            const timezone =
                task.timezone ?? this.#config.timeZone;

            const options = timezone
                ? { timezone }
                : {};

            const job = cron.schedule(
                task.schedule,
                async () => {
                    try {
                        await task.task();
                    } catch (error) {
                        const exception =
                            new CronTaskExecutionError(
                                task.name,
                                error
                            );

                        this.#config.onError?.(exception);
                    }
                },
                options
            );

            this.jobs.set(task.name, job);
        }
    }

    stop(): void {
        for (const job of this.jobs.values()) {
            job.stop();
        }

        this.jobs.clear();
    }

    config(): Readonly<CronConfig> {
        return Object.freeze(
            structuredClone(this.#config)
        );
    }

    setConfig(config: PartialCronConfig): void {
        if (
            config.timeZone &&
            !isValidTimeZone(config.timeZone)
        ) {
            throw new CronInvalidTimeZoneError(
                config.timeZone
            );
        }

        this.#config = {
            ...this.#config,
            ...config,
        };
    }
}

function Cron(): QuikCron {
    return new QuikCron();
}

export { QuikCron, Cron };
