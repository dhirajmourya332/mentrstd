import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllSessions } from "../Networking/Session";

function Dashboard() {
  //state to store all the previous recorded sessions
  const [sessions, setSessions] = useState(null);

  //getting all sessions and storing it into sessons state
  useEffect(() => {
    if (!sessions) {
      getAllSessions()
        .then((sessions) => setSessions(sessions))
        .catch((error) => {
          console.log(error);
        });
    }
  }, [sessions]);

  //this function converts time in seconds to formatted time
  function secondsToTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedHours = String(hours).padStart(2, "0");
    const formattedMinutes = String(minutes).padStart(2, "0");
    const formattedSeconds = String(remainingSeconds).padStart(2, "0");

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  }
  return (
    <div className="min-h-screen w-full flex flex-col gap-3">
      <div className="p-2 bg-slate-300 sticky top-0 flex flex-row">
        <div className="h-10 p-1">
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              opacity="0.5"
              d="M14 3H10C6.22876 3 4.34315 3 3.17157 4.17157C2 5.34315 2 7.22876 2 11C2 14.7712 2 16.6569 3.17157 17.8284C4.34315 19 6.22876 19 10 19H14C17.7712 19 19.6569 19 20.8284 17.8284C22 16.6569 22 14.7712 22 11C22 7.22876 22 5.34315 20.8284 4.17157C19.6569 3 17.7712 3 14 3Z"
              fill="#1C274C"
            />
            <path
              d="M9.94955 16.0503C10.8806 15.1192 11.3461 14.6537 11.9209 14.6234C11.9735 14.6206 12.0261 14.6206 12.0787 14.6234C12.6535 14.6537 13.119 15.1192 14.0501 16.0503C16.0759 18.0761 17.0888 19.089 16.8053 19.963C16.7809 20.0381 16.7506 20.1112 16.7147 20.1815C16.2973 21 14.8648 21 11.9998 21C9.13482 21 7.70233 21 7.28489 20.1815C7.249 20.1112 7.21873 20.0381 7.19436 19.963C6.91078 19.089 7.92371 18.0761 9.94955 16.0503Z"
              fill="#1C274C"
            />
          </svg>
        </div>
        <Link
          to={"/newsession"}
          className="ml-auto py-2 px-3 rounded-full border border-slate-800 text-slate-800 hover:text-slate-200 hover:bg-slate-800 shrink-0"
        >
          New session
        </Link>
      </div>
      {sessions ? (
        sessions.length ? (
          <div className="flex flex-col gap-4 p-3">
            {sessions.map((session, index) => {
              return (
                <div
                  key={index}
                  className="flex flex-row items-center gap-3 p-3 bg-slate-200 rounded-md"
                >
                  <h3 className="text-slate-800 font-bold">{session.title}</h3>
                  <div className="flex flex-row gap-5 px-5 shrink-0 items-center ml-auto">
                    <p className="text-slate-800">
                      {secondsToTime(session.length)}
                    </p>
                    <a
                      href={session.url}
                      target="__blank"
                      className="h-9 p-1 bg-slate-300 rounded-full flex items-center justify-center"
                    >
                      <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M16.6582 9.28638C18.098 10.1862 18.8178 10.6361 19.0647 11.2122C19.2803 11.7152 19.2803 12.2847 19.0647 12.7878C18.8178 13.3638 18.098 13.8137 16.6582 14.7136L9.896 18.94C8.29805 19.9387 7.49907 20.4381 6.83973 20.385C6.26501 20.3388 5.73818 20.0469 5.3944 19.584C5 19.053 5 18.1108 5 16.2264V7.77357C5 5.88919 5 4.94701 5.3944 4.41598C5.73818 3.9531 6.26501 3.66111 6.83973 3.6149C7.49907 3.5619 8.29805 4.06126 9.896 5.05998L16.6582 9.28638Z"
                          stroke="#000000"
                          strokeWidth="2"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-slate-800">
            No recorded sessions found
          </div>
        )
      ) : (
        //this is to show loading spinner when sessions is null
        <div className="flex items-center justify-center h-10 p-2 overflow-hidden">
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
        </div>
      )}
    </div>
  );
}

export default Dashboard;
