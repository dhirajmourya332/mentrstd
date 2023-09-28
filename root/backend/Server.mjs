import express from "express";
import http from "http";
import { ConnectToMongoDB } from "./Utils/DB.mjs";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import Login from "./RequestHandlers/Login.mjs";
import Signup from "./RequestHandlers/Signup.mjs";
import AuthenticateUser from "./Middlewares/AuthenticateUser.mjs";
import CreateNewSession from "./RequestHandlers/CreateNewSession.mjs";
import PushChunk from "./RequestHandlers/PushChunk.mjs";
import AllSessions from "./RequestHandlers/AllSessions.mjs";
import Videos from "./RequestHandlers/Videos.mjs";

class Server {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
  }
  //initialization function that runs before server starts listning
  async init() {
    //connect to db
    await ConnectToMongoDB();
  }
  async start() {
    try {
      await this.init();
    } catch (error) {
      console.log(error);
      process.exit(1);
    }

    //middlewares
    this.app.use(cookieParser());
    this.app.use(bodyParser.json({ limit: 100000000 }));

    //open endpoints
    this.app.post("/api/login", Login);
    this.app.post("/api/signup", Signup);
    //authenticated endpoints
    this.app.post(
      "/api/create-new-session",
      AuthenticateUser,
      CreateNewSession
    );
    this.app.post("/api/push-chunk/:sessionId", AuthenticateUser, PushChunk);
    this.app.get("/api/all-sessions", AuthenticateUser, AllSessions);
    this.app.get("/api/videos/:videoId", AuthenticateUser, Videos);
    this.server.keepAliveTimeout = 50000;
    this.server.listen(process.env.PORT, () => {
      console.log(
        `Server instance started listing at port: ${process.env.PORT}`
      );
    });
  }
}

export default Server;
