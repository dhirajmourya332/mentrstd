import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import "./index.css";
import NewSession from "./Routes/NewSession";
import Login from "./Routes/Login";
import Signup from "./Routes/Signup";
import Dashboard from "./Routes/Dashboard";
import Home from "./Routes/Home";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  { path: "login", element: <Login /> },
  { path: "signup", element: <Signup /> },
  {
    path: "newsession",
    element: <NewSession />,
  },
  { path: "dashboard", element: <Dashboard /> },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);
