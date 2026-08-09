import { Cron } from "@desaubv/quik/cron";

const cron = Cron();

cron.setConfig({
    language: "es",
    timeZone: "America/Mexico_City",
});

cron.add({
    name: "cleanup",
    schedule: "0 0 * * *",

    task: async () => {
        console.log("Ejecutando limpieza...");
    },
});

cron.add({
    name: "backup",
    schedule: "0 */6 * * *",

    task: async () => {
        console.log("Ejecutando backup...");
    },
});

cron.add({
    name: "los-angeles-task",
    schedule: "0 12 * * *",
    timezone: "America/Los_Angeles",

    task: async () => {
        console.log("Ejecutando tarea de Los Ángeles...");
    },
});

cron.start();