import dotenv from "dotenv";
dotenv.config();

import cluster from "cluster";
import { cpus } from "os";
import Server from "./Server.mjs";

//instentiating a new server instance for each cpu core on the device
if (cluster.isPrimary) {
  cpus().forEach(() => {
    cluster.fork();
  });
  //handelling server instance exit and forking an new server instance again
  cluster.on("exit", (worker, code, signal) => {
    cluster.fork();
  });
} else {
  //creating new server instance
  const serverInstance = new Server();
  await serverInstance.start();
}
