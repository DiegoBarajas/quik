import { Cron, Schedule } from "@desaubv/quik/cron";

const cron = Cron();

/*
 * Schedule.every(value)
 *
 * Creates a schedule that runs at a specified interval.
 *
 * The value must be a positive integer.
 */

// Every second
Schedule.every().second();
// Returns: "*/1 * * * * *"

// Every 10 seconds
Schedule.every(10).seconds();
// Returns: "*/10 * * * * *"

// Every minute
Schedule.every().minute();
// Returns: "*/1 * * * *"

// Every 5 minutes
Schedule.every(5).minutes();
// Returns: "*/5 * * * *"

// Every hour
Schedule.every().hour();
// Returns: "0 */1 * * *"

// Every 2 hours
Schedule.every(2).hours();
// Returns: "0 */2 * * *"

// Every day
Schedule.every().day();
// Returns: "0 0 */1 * *"

// Every 3 days
Schedule.every(3).days();
// Returns: "0 0 */3 * *"

// Every month
Schedule.every().month();
// Returns: "0 0 1 */1 *"

// Every 6 months
Schedule.every(6).months();
// Returns: "0 0 1 */6 *"


/*
 * Schedule.at(time)
 *
 * Runs every day at the specified time.
 *
 * The time must use the HH:mm format.
 */

Schedule.at("08:30");
// Returns: "30 8 * * *"

Schedule.at("23:00");
// Returns: "0 23 * * *"


/*
 * Schedule.weekday(weekday, time)
 *
 * Runs every specified weekday at the specified time.
 */

Schedule.weekday("monday", "08:00");
// Returns: "0 8 * * 1"

Schedule.weekday("friday", "17:30");
// Returns: "30 17 * * 5"


/*
 * Individual weekday methods
 *
 * These methods are shortcuts for Schedule.weekday().
 */

Schedule.every().mondayAt("09:00");
// Returns: "0 9 * * 1"

Schedule.every().wednesdayAt("14:00");
// Returns: "0 14 * * 3"

Schedule.every().fridayAt("18:00");
// Returns: "0 18 * * 5"


/*
 * Schedule.weekdaysAt(time)
 *
 * Runs Monday through Friday at the specified time.
 */

Schedule.weekdaysAt("09:00");
// Returns: "0 9 * * 1-5"


/*
 * Schedule.weekendsAt(time)
 *
 * Runs Saturday and Sunday at the specified time.
 */

Schedule.weekendsAt("10:00");
// Returns: "0 10 * * 0,6"


/*
 * Using a Schedule with Cron
 *
 * Schedule methods return a standard cron expression,
 * so the result can be passed directly to Cron.
 */

cron.add({
    name: "data-sync",
    schedule: Schedule.every(5).minutes(),
    task: () => {
        console.log("Synchronizing data...");
    },
});

cron.add({
    name: "daily-cleanup",
    schedule: Schedule.at("02:00"),
    task: () => {
        console.log("Running daily cleanup...");
    },
});

cron.add({
    name: "weekly-report",
    schedule: Schedule.weekday(
        "monday",
        "08:00"
    ),
    task: () => {
        console.log("Generating weekly report...");
    },
});

cron.add({
    name: "workday-notification",
    schedule: Schedule.weekdaysAt("09:00"),
    task: () => {
        console.log("Sending notification...");
    },
});


/*
 * You can also use standard cron expressions directly.
 *
 * Schedule is only a convenience API. You are not required
 * to use it.
 */

cron.add({
    name: "custom-task",
    schedule: "* * * * *",
    task: () => {
        console.log("Running every minute...");
    },
});

cron.start();