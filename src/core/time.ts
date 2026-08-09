function dateToString(date: Date, format: string, timeZone?: string): string {
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
    });

    const parts = formatter.formatToParts(date);
    const values = Object.fromEntries(
        parts
            .filter(({ type }) => type !== "literal")
            .map(({ type, value }) => [type, value])
    );

    return format.replace(/(YYYY|MM|DD|hh|mm|ss)/g, (match): string => {
        switch (match) {
            case "YYYY":
                return values.year || "";
            case "MM":
                return values.month || "";
            case "DD":
                return values.day || "";
            case "hh":
                return values.hour || "";
            case "mm":
                return values.minute || "";
            case "ss":
                return values.second || "";
            default:
                return match;
        }
    });
}

function isValidTimeZone(timeZone: string): boolean {
    try {
        new Intl.DateTimeFormat("en-US", {
            timeZone,
        });

        return true;
    } catch {
        return false;
    }
}

export { dateToString, isValidTimeZone };
