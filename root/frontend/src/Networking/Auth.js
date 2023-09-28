import axios from "axios";

export async function login(data) {
  return new Promise((resolve, reject) => {
    axios
      .post("/api/login", data, {
        headers: { "Content-Type": "application/json" },
      })
      .then((response) => {
        resolve(response.data);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export async function signup(data) {
  return new Promise((resolve, reject) => {
    axios
      .post("/api/signup", data, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        resolve(response.data);
      })
      .catch((error) => {
        reject(error);
      });
  });
}
