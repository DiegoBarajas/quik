import { CronTaskExecutionError } from "./exceptions.js";

// Types
type CronTask = {
    name: string;
    schedule: string;
    task: () => void | Promise<void>;
    timezone?: string;
};

type CronConfig = {
    language: Language;
    timeZone?: string;
    onError?: (error: CronTaskExecutionError) => void;
};

type PartialCronConfig = Partial<CronConfig>;

export type {
    CronTask,
    CronConfig,
    PartialCronConfig,
};
