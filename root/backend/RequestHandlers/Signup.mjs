import mongoose from "mongoose";
import User from "../Models/User.mjs";
import { HashPassword } from "../Utils/Password.mjs";

function Signup(req, res) {
  const { username, password, email } = req.body;
  if (username && password && email) {
    const newUser = new User({
      _id: new mongoose.Types.ObjectId(),
      username: username,
      email: email,
      password_hash: HashPassword(password),
    });
    newUser
      .save()
      .then((document) => {
        res.json({ success: true, data: null });
      })
      .catch((error) => {
        res.json({ success: false, error: "SOMETHING_WENT_WRONG" });
      });
  } else {
    res.json({ success: false, error: "SOMETHING_WENT_WRONG" });
  }
}

export default Signup;
