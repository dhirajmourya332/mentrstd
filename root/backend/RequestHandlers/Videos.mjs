import { createReadStream } from "fs";
import { dirname, join } from "path";
import Session from "../Models/Session.mjs";
import { fileURLToPath } from "url";

function Videos(req, res) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const { videoId } = req.params;
  //getting userid  to check if the video belongs to the user
  const { uid } = req;
  Session.findOne({ _id: videoId })
    .then((doc) => {
      if (doc) {
        if (doc.user_id == uid) {
          createReadStream(
            join(__dirname, `../RecordedVideos/${videoId}.webm`)
          ).pipe(res);
        } else {
          res.json({ success: false, error: "invalid file access" });
        }
      } else {
        res.json({
          success: false,
          error: "no video found with id :" + videoId,
        });
      }
    })
    .catch((error) => {
      console.log(error);
      //not exposing the internal error to the client
      res.json({ success: false, error: "something went wrong" });
    });
}

export default Videos;
