// import socket from "socket.io";

import CONFIG from "./config/config";
import app from "./App";

// import "../config/db";

const PORT = 3001;

const server = app.listen(PORT, () => {
  console.log(`Server is listening on ${PORT}`);
});

// tslint:disable-next-line: no-var-requires
export const io = require("socket.io")(server, { origins: "*:*" });

