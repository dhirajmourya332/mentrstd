import mongoose from "mongoose";
import Session from "../Models/Session.mjs";

function CreateNewSession(req, res) {
  //getting userid from request, which is assigned by authentication middleware
  const { uid } = req;
  //getting session title from request body
  const { title } = req.body;

  const newSession = new Session({
    _id: new mongoose.Types.ObjectId(),
    user_id: uid,
    title: title,
    created_at: new Date(),
  });
  newSession
    .save()
    .then((document) => {
      res.json({ success: true, data: { sessionId: document._id } });
    })
    .catch((error) => {
      console.log(error);
      res.json({ success: false, error: "FAILED_TO_CREATE_NEW_SESSION" });
    });
}

export default CreateNewSession;
