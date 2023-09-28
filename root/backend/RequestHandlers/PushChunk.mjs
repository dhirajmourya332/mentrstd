import {
  appendFileSync,
  appendFile,
  existsSync,
  writeFileSync,
  unlinkSync,
  renameSync,
  statSync,
  rename,
} from "fs";
import { dirname, join } from "path";
import mime from "mime-types";
import { fileURLToPath } from "url";
import { getVideoDurationInSeconds } from "get-video-duration";

import Ffmpeg from "fluent-ffmpeg";
import Session from "../Models/Session.mjs";

async function mergeAudioAndVideo(
  inputVideoPath,
  inputAudioPath,
  outputVideoPath
) {
  return new Promise((resolve, reject) => {
    Ffmpeg()
      .input(inputVideoPath)
      .input(inputAudioPath)
      .output(outputVideoPath)
      .videoCodec("copy")
      .on("end", () => {
        resolve(true);
      })
      .on("error", (error) => {
        reject(error);
      })
      .run();
  });
}

async function updateSession(sessionId, data) {
  return new Promise((resolve, reject) => {
    Session.updateOne({ _id: sessionId }, data)
      .then((res) => {
        if (res.acknowledged && res.modifiedCount === 1) {
          resolve(true);
        } else {
          console.log(
            `couldn't update the session document with id: ${sessionId}`
          );
          reject(true);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}

async function getVideoLength(videoPath) {
  return new Promise((resolve, reject) => {
    getVideoDurationInSeconds(videoPath)
      .then((duration) => {
        resolve(duration);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function PushChunk(req, res) {
  const { uid } = req;
  const { data, mimeType, command } = req.body;
  const { sessionId } = req.params;
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const filePath = join(
    __dirname,
    `../videos/${sessionId}.${mime.extension(mimeType)}`
  );

  //if the command is to append the chunk into the file
  if (command === "append") {
    appendFile(filePath, Buffer.from(data, "base64"), (error) => {
      if (!error) {
        res.json({ success: true, data: null });
      } else {
        //incase if file does not exists then writing new file
        if (error.code === "ENOENT") {
          writeFileSync(filePath, Buffer.from(data, "base64"));
          res.json({ success: true, data: null });
        } else {
          console.log(error);
        }
      }
    });
    //if the command is end; merge both the audio and the video file into one and upload it to file hosting service
  } else {
    //merge audio and video files and upload it to s3
    if (existsSync(join(__dirname, `../videos/${sessionId}.weba`))) {
      mergeAudioAndVideo(
        join(__dirname, `../videos/${sessionId}.webm`),
        join(__dirname, `../videos/${sessionId}.weba`),
        join(__dirname, `../RecordedVideos/${sessionId}.webm`)
      )
        .then(async () => {
          unlinkSync(join(__dirname, `../videos/${sessionId}.webm`));
          unlinkSync(join(__dirname, `../videos/${sessionId}.weba`));
          //getting the size of videofile in bytes
          const videoSize = statSync(
            join(__dirname, `../RecordedVideos/${sessionId}.webm`)
          ).size;
          //getting the video length
          const videoLength = await getVideoLength(
            join(__dirname, `../RecordedVideos/${sessionId}.webm`)
          );

          //currently just storing the file in the localsystem only and  not uploading on filehosting service
          const url = `/api/videos/${sessionId}`;
          await updateSession(sessionId, {
            length: videoLength,
            size: videoSize,
            url: url,
            is_ended: true,
          });
          res.json({ success: true, data: null });
        })
        .catch((error) => {
          console.log(error);
          res.json({ success: false, error: "COULD_NOT_UPLOAD_FILE" });
        });
    } else {
      rename(
        join(__dirname, `../videos/${sessionId}.webm`),
        join(__dirname, `../RecordedVideos/${sessionId}.webm`),
        async (error) => {
          if (error) {
            console.log(error);
            res.json({ success: false, error: "COULD_NOT_UPLOAD_FILE" });
          }
          unlinkSync(join(__dirname, `../videos/${sessionId}.webm`));
          //getting the size of videofile in bytes
          const videoSize = statSync(
            join(__dirname, `../RecordedVideos/${sessionId}.webm`)
          ).size;
          //getting the video length
          const videoLength = await getVideoLength(
            join(__dirname, `../RecordedVideos/${sessionId}.webm`)
          );

          //currently just storing the file in the localsystem only and  not uploading on filehosting service
          const url = `/api/videos/${sessionId}`;
          await updateSession(sessionId, {
            length: videoLength,
            size: videoSize,
            url: url,
            is_ended: true,
          });
          res.json({ success: true, data: null });
        }
      );
    }
  }
}

export default PushChunk;
