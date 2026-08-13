import { Cron } from "@desaubv/quik/cron";

const cron = Cron();

cron.add({
    name: "hello",
    schedule: "* * * * *",
    task: () => {
        console.log("Hello from Quik Cron!");
    },
});

cron.start();