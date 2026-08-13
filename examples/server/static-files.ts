import { Server } from "@desaubv/quik";

const server = Server();

// server.addStaticDir("./public", "./static");
server.addStaticDir("./public");
server.addStaticDir("./static");

server.start();