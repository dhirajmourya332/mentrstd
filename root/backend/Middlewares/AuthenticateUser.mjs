import { VerifyJWT } from "../Utils/JWT.mjs";

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @description Checks and verifies user authToken if success transfer control to next request handler else responds authentication failed error
 */
function AuthenticateUser(req, res, next) {
  const { authToken } = req.cookies;
  if (authToken) {
    const { uid } = VerifyJWT(authToken);
    if (uid) {
      req.uid = uid;
      next();
    } else {
      //responding authentication error when authToken cannot be verified
      res.json({ success: false, error: "AUTHENTICATION_FAILED" });
    }
  } else {
    //responding authentication error when no authToken found in user request header
    res.json({ success: false, error: "AUTHENTICATION_FAILED" });
  }
}

export default AuthenticateUser;
