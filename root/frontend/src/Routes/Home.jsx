import { useEffect } from "react";
import { useNavigate } from "react-router";

export default function Home() {
  const navigate = useNavigate();

  //just navigating user to login page
  useEffect(() => {
    navigate("/login");
  });
  return <div></div>;
}
