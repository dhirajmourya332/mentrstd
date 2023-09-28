import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Types.ObjectId,
  },
  //_id of user who created the session
  user_id: {
    type: mongoose.Types.ObjectId,
    index: true,
  },
  //representing title of Session
  title: {
    type: String,
  },
  //representing length of session video in seconds
  length: {
    type: Number,
  },
  //representing size of session video in bytes
  size: {
    type: Number,
  },
  created_at: {
    type: Date,
    //this index helps to effitiently query on session creation date
    index: true,
  },
  //representing url of recorded session
  url: {
    type: String,
  },
  is_ended: {
    type: Boolean,
    index: true,
  },
});

const Session = mongoose.model("Session", sessionSchema);

export default Session;
