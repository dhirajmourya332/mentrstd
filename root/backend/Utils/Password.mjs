import { compareSync, hashSync } from "bcrypt";

/**
 *
 * @param {String} password
 * @description Creates hash of password
 */
export function HashPassword(password) {
  if (!password) {
    throw new Error(
      "The password must be a non empty string found: " + typeof password
    );
  }
  return hashSync(password, 10);
}

/**
 *
 * @param {String} password
 * @param {String} passwordHash
 * @returns {Boolean}
 * @description Returns true if password and password hash matches else false
 */
export function CompareHashPassword(password, passwordHash) {
  if (!password) {
    throw new Error(
      "The password must be a non empty string found: " + typeof password
    );
  }
  if (!passwordHash) {
    throw new Error(
      "The password hash must be a non empty string found: " +
        typeof passwordHash
    );
  }
  return compareSync(password, passwordHash);
}
