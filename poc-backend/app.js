const express = require("express");
const { Server } = require("@tus/server");
const db = require('./db.js');
const CSVStore  = require("./csv-store.js");

const uploadApp = express();
const app = express();
const PORT = 3001;

const server = new Server({
  path: "/files",
  datastore: new CSVStore({db,rowSize:100}),
  onUploadFinish: (req, res, upload) => {
    console.log("Uploaded files", upload)
  },
});



uploadApp.all("*", server.handle.bind(server));
app.use("/uploads", uploadApp);

app.listen(PORT, (error) => {
  if (!error) {
    console.log(
      "Server is Successfully Running, and App is listening on port " + PORT
    );
  }
  else console.log("Error occurred, server can't start", error);
});
