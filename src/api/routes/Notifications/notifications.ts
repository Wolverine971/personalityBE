import { io, redis } from "../../..";
let ioConnected = false
export const notificationsSetup = async (userId: string) => {

    if (!ioConnected && redis) {
        io.of("/notifications").on("connection", (socket) => {
          console.log("New connection: " + socket.id);
          // Send the message of connection for receiving the user ID
          socket.emit("connected");
          ioConnected = true

          // Receive the ID
        //   socket.on("join", (userId) => {
            const newChannel = "push:notifications:" + userId;
            console.log("Connecting to redis: " + newChannel);

            // store in the socket our connection
            socket.redisClient = redis.createClient();
            socket.redisClient.subscribe(newChannel);
            socket.redisClient.subscribe('currentUsers');

            // subscribe to our channel (We don't need to check because we have a
            // connection per channel/user)
            socket.redisClient.on("message", (channel, message) => {
              console.log(channel + ": " + message);
              // socket.emit("notification", channel, message);
              socket.emit(channel, message);
            });
        //   });
        });
      }

}