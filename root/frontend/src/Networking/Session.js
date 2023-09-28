import axios from "axios";

//this function request the server to create new sessionid with required payload (session title)
export async function createNewSession(data) {
  return new Promise((resolve, reject) => {
    axios
      .post("/api/create-new-session", data)
      .then((response) => {
        if (response.data["success"]) {
          resolve(response.data.data);
        } else {
          reject(response.data.error);
        }
      })
      .catch((error) => reject(error));
  });
}

//this funcition converts blob to base64
async function blobToBase64(blob, callback) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function () {
      const base64String = reader.result.split(",")[1];
      resolve(base64String);
    };
    reader.readAsDataURL(blob);
  });
}

//this function uploads the recorded chunk with some metadata and command in json format
export async function pushChunk(sessionId, chunkData, mimeType, command) {
  return new Promise(async (resolve, reject) => {
    axios
      .post(
        `/api/push-chunk/${sessionId}`,
        {
          data:
            //converting blob to base64 so that it can be serialized into json
            command === "append" ? await blobToBase64(chunkData) : chunkData,
          mimeType: mimeType,
          command: command,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      )
      .then((response) => {
        if (response.data["success"]) {
          resolve(response.data.data);
        } else {
          reject(response.data.error);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}

//this function request server to get all the session metadata recorded by user
export async function getAllSessions() {
  return new Promise((resolve, reject) => {
    axios
      .get("/api/all-sessions")
      .then((response) => {
        if (response.data["success"]) {
          resolve(response.data.data);
        } else {
          reject(response.data.error);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}
