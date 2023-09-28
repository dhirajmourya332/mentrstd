import pkg from "jsonwebtoken";
const { sign, verify } = pkg;

/**
 *
 * @param {Object} data
 * @returns {String} JWT
 */
export function CreateJWT(data) {
  if (!data || typeof data !== "object") {
    throw new Error(`data must be of type object, but found: ${typeof data}`);
  }
  try {
    return sign(data, process.env.JWT_SECRET);
  } catch (error) {
    throw error;
  }
}

/**
 *
 * @param {token} token (JWT)
 * @returns {String}
 * @description verifies the JWT and returns false if token is not valid JWT else returns decoded JWT
 */
export function VerifyJWT(token) {
  if (!token) {
    throw new Error(
      `token must be falsy and must be of type string, but found: ${typeof token}`
    );
  }
  try {
    return verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw error;
  }
}
