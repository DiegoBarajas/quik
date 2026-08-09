class CronError extends Error {
    constructor(message: string) {
        super(message);

        this.name = new.target.name;

        Object.setPrototypeOf(this, new.target.prototype);
    }
}

class CronTaskAlreadyExistsError extends CronError {
    constructor(name: string) {
        super(`Cron task "${name}" already exists.`);
    }
}

class CronTaskNotFoundError extends CronError {
    constructor(name: string) {
        super(`Cron task "${name}" was not found.`);
    }
}

class CronInvalidScheduleError extends CronError {
    constructor(schedule: string) {
        super(`Invalid cron schedule: "${schedule}".`);
    }
}

class CronInvalidTimeZoneError extends CronError {
    constructor(timeZone: string) {
        super(`Invalid time zone: "${timeZone}".`);
    }
}

class CronTaskExecutionError extends CronError {
    constructor(
        name: string,
        cause?: unknown
    ) {
        super(`Cron task "${name}" failed to execute.`);

        if (cause !== undefined) {
            this.cause = cause;
        }
    }
}

export {
    CronError,
    CronTaskAlreadyExistsError,
    CronTaskNotFoundError,
    CronInvalidScheduleError,
    CronInvalidTimeZoneError,
    CronTaskExecutionError,
};
