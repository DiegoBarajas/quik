type Weekday =
    | "sunday"
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday";

type ScheduleUnit =
    | "second"
    | "minute"
    | "hour"
    | "day"
    | "month";

const weekdays: Record<Weekday, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
};

export class ScheduleBuilder {
    #value: number;

    constructor(value = 1) {
        if (!Number.isInteger(value) || value < 1) {
            throw new RangeError(
                "Schedule value must be a positive integer."
            );
        }

        this.#value = value;
    }

    seconds(): string {
        return this.#interval("second");
    }

    second(): string {
        return this.seconds();
    }

    minutes(): string {
        return this.#interval("minute");
    }

    minute(): string {
        return this.minutes();
    }

    hours(): string {
        return this.#interval("hour");
    }

    hour(): string {
        return this.hours();
    }

    days(): string {
        return this.#interval("day");
    }

    day(): string {
        return this.days();
    }

    months(): string {
        return this.#interval("month");
    }

    month(): string {
        return this.months();
    }

    dayAt(time: string): string {
        const [hour, minute] = this.#parseTime(time);

        return `${minute} ${hour} * * *`;
    }

    at(time: string): string {
        return this.dayAt(time);
    }

    weekdayAt(
        weekday: Weekday,
        time: string
    ): string {
        const [hour, minute] = this.#parseTime(time);

        return `${minute} ${hour} * * ${weekdays[weekday]}`;
    }

    sundayAt(time: string): string {
        return this.weekdayAt("sunday", time);
    }

    mondayAt(time: string): string {
        return this.weekdayAt("monday", time);
    }

    tuesdayAt(time: string): string {
        return this.weekdayAt("tuesday", time);
    }

    wednesdayAt(time: string): string {
        return this.weekdayAt("wednesday", time);
    }

    thursdayAt(time: string): string {
        return this.weekdayAt("thursday", time);
    }

    fridayAt(time: string): string {
        return this.weekdayAt("friday", time);
    }

    saturdayAt(time: string): string {
        return this.weekdayAt("saturday", time);
    }

    weekdaysAt(time: string): string {
        const [hour, minute] = this.#parseTime(time);

        return `${minute} ${hour} * * 1-5`;
    }

    weekendsAt(time: string): string {
        const [hour, minute] = this.#parseTime(time);

        return `${minute} ${hour} * * 0,6`;
    }

    #interval(unit: ScheduleUnit): string {
        switch (unit) {
            case "second":
                return `*/${this.#value} * * * * *`;

            case "minute":
                return `*/${this.#value} * * * *`;

            case "hour":
                return `0 */${this.#value} * * *`;

            case "day":
                return `0 0 */${this.#value} * *`;

            case "month":
                return `0 0 1 */${this.#value} *`;
        }
    }

    #parseTime(time: string): [number, number] {
        if (!/^\d{2}:\d{2}$/.test(time)) {
            throw new TypeError(
                `Invalid time "${time}". Expected HH:mm.`
            );
        }

        const parts = time.split(":");

        const hour = Number(parts[0]);
        const minute = Number(parts[1]);

        if (
            hour < 0 ||
            hour > 23 ||
            minute < 0 ||
            minute > 59
        ) {
            throw new RangeError(
                `Invalid time "${time}".`
            );
        }

        return [hour, minute];
    }
}

export class Schedule {
    static every(value = 1): ScheduleBuilder {
        return new ScheduleBuilder(value);
    }

    static at(time: string): string {
        return new ScheduleBuilder().at(time);
    }

    static weekday(
        weekday: Weekday,
        time: string
    ): string {
        return new ScheduleBuilder().weekdayAt(
            weekday,
            time
        );
    }

    static weekdaysAt(time: string): string {
        return new ScheduleBuilder().weekdaysAt(time);
    }

    static weekendsAt(time: string): string {
        return new ScheduleBuilder().weekendsAt(time);
    }
}