import { useState } from "react";
import "./App.css";
import * as tus from "tus-js-client";

function App() {
  const [file, setFile] = useState<File>();
  const [percentage, setPercentage] = useState<any>();

  function uploadFile() {
    if (file) {
      var upload = new tus.Upload(file, {
        endpoint: "http://localhost:3001/uploads/",
        retryDelays: [0, 3000, 5000, 10000, 20000],
        metadata: {
          filename: file.name,
          filetype: file.type,
        },
        onError: function (error) {
          console.log("Failed because: " + error);
        },
        onProgress: function (bytesUploaded, bytesTotal) {
          var percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
          setPercentage(percentage);
        },
        onSuccess: function () {
          console.log("Download %s from %s", upload.url);
        },
      });

      // Check if there are any previous uploads to continue.
      upload.findPreviousUploads().then(function (previousUploads) {
        // Found previous uploads so we select the first one.
        if (previousUploads.length) {
          upload.resumeFromPreviousUpload(previousUploads[0]);
        }

        // Start the upload
        upload.start();
      });
    }
  }
  return (
    <div className="App">
      <form>
        <input
          type="file"
          onChange={(e) =>
            e.currentTarget.files && setFile(e.currentTarget.files[0])
          }
        />
        <button
          type="button"
          onClick={() => {
            uploadFile();
          }}
        >
          Upload
        </button>
        <span>Percentage: {percentage}%</span>you
      </form>
    </div>
  );
}

export default App;
