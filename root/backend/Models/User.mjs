import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Types.ObjectId,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    //this index helps when user logs in
    index: true,
  },
  email: {
    type: String,
    unique: true,
  },
  password_hash: {
    type: String,
    required: true,
  },
});

const User = mongoose.model("User", userSchema);

export default User;
