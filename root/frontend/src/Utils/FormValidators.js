export function validateUsername(username) {
  username = username.trim();
  if (!username) return "Username can't be empty";
  else if (!/^[a-zA-Z0-9_]+$/.test(username))
    return "Username must not contain any special characters except _";
  else if (username.length < 6 || username.length > 20)
    return "Username must be between 6 and 20 characters long";

  return null;
}

export function validatePassword(password) {
  password = password.trim();
  const errors = [];

  if (!password) {
    errors.push("Password can't be empty");
  }
  if (password.length < 7 || password.length > 30) {
    errors.push("Password must be between 7 and 30 characters long");
  }

  if (!/.*[!@#$%^&*()\-_=+{}\[\]:;<>,.?/~].*/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return errors.length ? errors : null;
}

export function validateEmail(email) {
  email = email.trim();
  if (!email) return "Email can't be empty";
  else if (
    !/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
      email
    )
  ) {
    return "Invalid email";
  }
  return null;
}
