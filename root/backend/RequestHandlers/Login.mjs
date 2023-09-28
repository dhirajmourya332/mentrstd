import User from "../Models/User.mjs";
import { CreateJWT } from "../Utils/JWT.mjs";
import { CompareHashPassword } from "../Utils/Password.mjs";

/**
 *
 * @param {*} req
 * @param {*} res
 * @description A request handler for login request
 */
function Login(req, res) {
  const { username, password } = req.body;
  if (username && password) {
    User.findOne({ username: username })
      .then((document) => {
        if (document && CompareHashPassword(password, document.password_hash)) {
          res.cookie("authToken", CreateJWT({ uid: document._id }), {
            httpOnly: true,
          });
          //responding with data null instead of redirect, cause client aplication will have indepency of redirect page
          res.json({ success: true, data: null });
        } else {
          //responding invalid username or password error if password and password hash does not match
          res.json({ success: false, error: "INVALID_USERNAME_OR_PASSWORD" });
        }
      })
      .catch((error) => {
        //responding login error when no user found with the given uid in the database
        res.json({ success: false, error: "INVALID_USERNAME_OR_PASSWORD" });
      });
  } else {
    //responding something went wrong error when either username of password is not found in user request body
    //not exposing detailed error from server
    res.json({ success: false, error: "SOMETHING_WENT_WRONG" });
  }
}

export default Login;
