const express = require("express");
const { Server } = require("@tus/server");
const { FileStore } = require("@tus/file-store");

const uploadApp = express();
const app = express();
const PORT = 3001;
let exec = require("child_process").exec;

const server = new Server({
  path: "/files",
  datastore: new FileStore({ directory: "./files" }),
  onUploadFinish: (req, res, upload) => {
    let command = `mongoimport -d test -c Quest --file ./files/${upload.id} --headerline --type=csv`
    exec(command, (err, stdout, stderr) => {
      console.log(err)
      console.log(stdout)
      console.log(stderr)
      // check for errors or if it was succesfuly
      // cb()
    })
  },
});

uploadApp.all("*", server.handle.bind(server));
app.use("/uploads", uploadApp);

app.listen(PORT, (error) => {
  if (!error)
    console.log(
      "Server is Successfully Running, and App is listening on port " + PORT
    );
  else console.log("Error occurred, server can't start", error);
});
