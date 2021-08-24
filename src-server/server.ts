import express from "express";
import ws from "ws";
import { AppMessage, isGetOrder, Order } from "../src-shared/messages.js";
import { Player } from "../src-shared/api";
import mongoose from "mongoose";
import UserModel from "../src-shared/users.model.js";
import EmailModel from "../src-shared/email.model.js";

import dotenv from "dotenv";
console.log(dotenv);
dotenv.config();
console.log(dotenv.config);
dotenv.config({ path: "app/.env" });
const uri = process.env.MONGODBCRED;
console.log(uri);
mongoose.connect(
  "mongodb+srv://Remi:TJQvAr9SnEDGU2D@cluster0.43i0s.mongodb.net/Thesis?retryWrites=true&w=majority",
  {
    keepAlive: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  }
);

// setTimeout(() => {
//   UserModel.estimatedDocumentCount().exec((err, count) => {
//     var random = Math.floor(Math.random() * count);
//     UserModel.findOne(
//       { "participant.trials.designerType": "Sound" },
//       (error, foundTrials) => {
//         console.log(
//           "found: ",
//           foundTrials.participant.trials.filter((trial) => {
//             return trial.designerType == "Sound";
//           }),
//           "error: ",
//           error
//         );
//       }
//     ).skip(random);
//   });
// }, 10000);
const PORT: string | number = process.env.PORT || 5000;
const server = express()
  .use((req, res) => {
    res.sendFile("../src-server/server.html");
    console.log("listening");
  })
  .listen(PORT);

const wsServer = new ws.Server({ server });

interface clients {
  socket: ws;
  player: Player;
}
const clients: clients[] = [];

wsServer.on("connection", (socket, request) => {
  console.log("someone connected");

  socket.onmessage = (messageEvent) => {
    const message = JSON.parse(messageEvent.data.toString()) as AppMessage;
    console.log(message);
    if (isGetOrder(message)) {
      console.log("message recieved from client");
      UserModel.estimatedDocumentCount().exec((err, count) => {
        const response: Order = {
          type: "Ord",
          data: count % 2 === 0 ? "Sound" : "3D",
        };
        socket.send(JSON.stringify(response));
        console.log("count error: ", err);
      });
    }
    if (message.type === "PlayerConnected") {
      console.log(message.data.userID);
      clients.push({
        socket,
        player: message.data,
      });
    }

    if (message.type === "PlayerUpdate") {
      console.log("playerupdate");
      // (async () => {
      const user = message.data;
      //let doc = new userSchema
      let doc = {
        // _id: mongoose.Types.ObjectId(),
        participant: user,
      };
      //todo ---------------------- add dot env so mongo creds are hidden

      UserModel.findOneAndUpdate({ "participant.userID": user.userID }, doc, {
        upsert: true,
      }).exec();
    }

    if (message.type === "EmailSubmit") {
      console.log("email submittion");
      const email = message.data;
      let doc = {
        email: email.Email,
      };

      EmailModel.create(doc);
    }
  };
});
//keep anarray of clients
//remove client from array when disconnected (loop to find client)
// message function to send to all clients from server
// rather than sending increments of change just send current position
