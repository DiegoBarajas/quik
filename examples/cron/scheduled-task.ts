import { Cron, Schedule } from "@desaubv/quik/cron";

const cron = Cron();

cron.setConfig({
    language: "en",
    timeZone: "America/Mexico_City",

    onError: (error) => {
        console.error("Cron task error:", error);
    },
});

cron.add({
    name: "scheduled-task",
    schedule: Schedule.at("09:00"), // More info about Schedule in ./schedule.ts
    timezone: "America/Mexico_City",

    task: () => {
        console.log("Scheduled task executed at 09:00.");
    },
});

cron.start();