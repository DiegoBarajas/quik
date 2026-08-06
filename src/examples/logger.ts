import { logger } from "@desaubv/quik";

logger.setConfig({
    format: {
        prefix: "< ",
        suffix: " >",
        titleCase: "capitalize",
        timestampFormat: "DD-MM-YYYY@hh:mm:ss"
    }
})

logger.setConfig({
    color: {
        debugColor: "green",
        warningColor: null
    }
})

logger.log("Hello World", 15);
logger.warning("Lorem ipsum", null);
logger.error({ error: "IOERROR", message: "An error was encountred" });
logger.debug("DATABASE CONNECTED:", true);