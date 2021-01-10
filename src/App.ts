import * as bodyParser from "body-parser";
import * as cors from "cors";
import * as express from "express";
import * as helmet from "helmet";
import * as morgan from "morgan";
import * as errorHandler from "./helpers/errorHandler"

import api from "./api/index";

const corsOptions = {
  origin: [
    process.env.ORIGIN,
    // 'http://localhost:3000',
    // 'http://localhost:3000/',
    // 'http://localhost:7357'
  ],
  credentials: true,
};
class App {
  public express: express.Application;

  constructor() {
    this.express = express();
    this.setMiddlewares();
    this.setRoutes();
    this.catchErrors();
  }

  private setMiddlewares(): void {
    this.express.use(cors(corsOptions));
    this.express.use(morgan("dev"));
    this.express.use(bodyParser.json({ limit: "50mb" }));
    this.express.use(bodyParser.urlencoded({ extended: false }));
    this.express.use(helmet());
  }

  private setRoutes(): void {
    this.express.use("/api", api);
    this.express.get("/", (req, res) => {
      res.send("<h1>Scraper Backend Up</h1>");
    });
  }

  private catchErrors(): void {
    this.express.use(errorHandler.notFound);
    this.express.use(errorHandler.internalServerError);
  }
}

export default new App().express;
