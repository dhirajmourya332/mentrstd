import { Link } from "react-router-dom";
import { useState } from "react";
import { validateUsername, validatePassword } from "../Utils/FormValidators";
import { login } from "../Networking/Auth";
import { useNavigate } from "react-router";

function Login() {
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState(undefined);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(undefined);
  const [formSubmitInProgress, setFormSubmitInProgress] = useState(false);
  const [formError, setFormError] = useState(undefined);
  const navigate = useNavigate();
  function handleUsernameChange(e) {
    setUsername(e.target.value);
    setUsernameError(validateUsername(e.target.value));
    setFormError(null);
  }
  function handlePasswordChange(e) {
    setPassword(e.target.value);
    setPasswordError(validatePassword(e.target.value));
    setFormError(null);
  }
  async function handleFormSubmit(e) {
    e.preventDefault();
    setFormSubmitInProgress(true);
    login({ username: username, password: password })
      .then((response) => {
        if (response["success"]) {
          navigate("/dashboard");
        } else {
          setFormError(response["error"]);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 rounded-md">
      <div className="flex flex-col p-3 gap-3 bg-slate-200 w-full max-w-sm rounded-md">
        <h1 className="text-2xl font-bold text-center text-slate-800 py-3">
          Login
        </h1>
        <form className="flex flex-col gap-5 p-2" onSubmit={handleFormSubmit}>
          <div className="flex flex-col gap-2">
            <label htmlFor="username" className="font-bold text-slate-800">
              Username
            </label>
            <input
              id="username"
              autoFocus
              placeholder="Username..."
              className="focus:outline-none p-2  rounded-md"
              type={"text"}
              value={username}
              onChange={handleUsernameChange}
            />
            {/* {usernameError && (
              <span className="text-sm text-red-800 bg-red-200 p-1 rounded-md">
                {usernameError}
              </span>
            )} */}
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="font-bold text-slate-800">
              Password
            </label>
            <input
              id="password"
              placeholder="Password..."
              className="focus:outline-none p-2  rounded-md"
              type={"password"}
              value={password}
              onChange={handlePasswordChange}
            />
            {/* {passwordError &&
              passwordError.map((error, index) => {
                return (
                  <span
                    key={index}
                    className="text-sm text-red-800 bg-red-200 p-1 rounded-md"
                  >
                    {error}
                  </span>
                );
              })} */}
          </div>
          <button
            type="submit"
            className="h-10 mt-3 border border-slate-800 disabled:border-slate-600 font-bold text-slate-200 bg-slate-800 p-3 py-2 rounded-md disabled:text-slate-500 disabled:bg-transparent"
            disabled={
              usernameError === undefined ||
              usernameError ||
              passwordError === undefined ||
              passwordError ||
              formSubmitInProgress
                ? true
                : false
            }
          >
            {formSubmitInProgress ? (
              <svg
                className="animate-spin"
                width="100%"
                height="100%"
                viewBox="0 0 16 16"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
              >
                <g fill="#000000" fillRule="evenodd" clipRule="evenodd">
                  <path
                    d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z"
                    opacity=".2"
                  />

                  <path d="M7.25.75A.75.75 0 018 0a8 8 0 018 8 .75.75 0 01-1.5 0A6.5 6.5 0 008 1.5a.75.75 0 01-.75-.75z" />
                </g>
              </svg>
            ) : (
              "Submit"
            )}
          </button>
          {formError && (
            <span className="font-small bg-red-200 text-red-800 p-1 rounded-md">
              {formError}
            </span>
          )}
        </form>
        <div className="text-center text-slate-800">
          New user?{" "}
          <Link to={"/signup"} className="text-blue-700">
            SignUp
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
