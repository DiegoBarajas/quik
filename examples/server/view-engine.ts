import { Server } from "@desaubv/quik"
import ejs from "ejs";
/*
    View engines are not bundled with Quik.
    Install the desired view engine separately.
*/

const server = Server();
server.setConfig({
    express: {
        viewEngine: "ejs"
    }
});

server.addViewDir("./views");
server.start();