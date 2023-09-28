import { useCallback, useEffect, useRef, useState } from "react";
import { createNewSession, pushChunk } from "../Networking/Session";
import { useNavigate } from "react-router-dom";

export default function NewSession() {
  const navigate = useNavigate();
  const [userWebCamStream, setUserWebCamStream] = useState(null);
  const [userAudioStream, setAudioStream] = useState(null);
  const [hasRecordingBegan, setHasRecordingBegan] = useState(false);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [hasRecordingEnded, setHasRecordingEnded] = useState(false);
  const [displayStream, setDisplayStream] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [hasMediaToPush, setHasMediaToPush] = useState(false);
  const isPushingRecordedMediaChunk = useRef(false);
  const [displayRecorder, setDisplayRecorder] = useState(null);
  const [audioRecorder, setAudioRecorder] = useState(null);
  const [sessionTitle, setSessionTitle] = useState("");

  //this useEffect adds srcObject attribute to video element for userwebcam once webcamstream is available
  const userWebCamRef = useRef(null);
  useEffect(() => {
    if (userWebCamStream && userWebCamRef.current) {
      userWebCamRef.current.srcObject = userWebCamStream;
    }
  }, [userWebCamStream, userWebCamRef]);

  //this is not a ref but a callback to show display stream into the video
  const userScreenDisplayVideoRef = useCallback(
    (node) => {
      if (node !== null) node.srcObject = displayStream;
    },
    [displayStream]
  );

  //this function puts the usefacecam video on top of window and back to webpage
  function togglePictureInPicture() {
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
    } else if (document.pictureInPictureEnabled) {
      if (userWebCamRef.current)
        userWebCamRef.current.requestPictureInPicture();
    }
  }

  //this useeffect gets webcam permission and updates the userWebcamStream state variable
  //taking cam access only after getting title
  useEffect(() => {
    if (!userWebCamStream && sessionTitle !== "") {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          setUserWebCamStream(stream);
        })
        .catch((error) => {
          alert("This website requires userwebcam permission");
          console.log(error);
        });
    }
  }, [userWebCamStream, sessionTitle]);

  //this useeffect gets microphone permission and updates the userAudioStrean state variable
  useEffect(() => {
    if (!userAudioStream && sessionTitle !== "") {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          setAudioStream(stream);
        })
        .catch((error) => {});
    }
  }, [userAudioStream, sessionTitle]);

  //this function gets/(creats if not exists) indexeddb database and objectstore to store the recorded chunks in with other related information
  async function getIDBsessionMediaChunksStore(operation) {
    return new Promise((resolve, reject) => {
      //checking for support of indexedDB
      if (!("indexedDB" in window)) {
        reject("No browser suppor for indexedDB");
      }
      let db, sessionMediaChunksStore;

      const dbRequest = indexedDB.open("session", 1);
      dbRequest.onupgradeneeded = (event) => {
        db = dbRequest.result;
        if (!db.objectStoreNames.contains("sessionMediaChunksStore")) {
          sessionMediaChunksStore = db.createObjectStore(
            "sessionMediaChunksStore",
            { autoIncrement: true }
          );
          sessionMediaChunksStore.createIndex("sessionIdIndex", "sessionId");
        }
      };
      dbRequest.onsuccess = (event) => {
        db = event.target.result;
        sessionMediaChunksStore = db
          .transaction(["sessionMediaChunksStore"], operation)
          .objectStore("sessionMediaChunksStore");

        resolve([db, sessionMediaChunksStore]);
      };
    });
  }

  //this useEffect sets the interval and checks if there is any record in indexeddb to push to server and pushed it if exists also delets the records that is successfuly pushed to the server
  useEffect(() => {
    //deleting the record with lowest primary key
    async function deleteRecordedMediaChunkWithLowestPK() {
      return new Promise(async (resolve, reject) => {
        const [db, objectStore] = await getIDBsessionMediaChunksStore(
          "readwrite"
        );

        const index = objectStore.index("sessionIdIndex");

        const cursorRequest = index.openCursor(
          IDBKeyRange.lowerBound(0),
          "next"
        );

        cursorRequest.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            const keyToDelete = cursor.primaryKey;

            objectStore.delete(keyToDelete);

            resolve(true);
          }
        };
      });
    }
    //gets the record from indexeddb with lowest primary key and pushed it to the server
    async function getAndPushMediaChunk() {
      if (!isPushingRecordedMediaChunk.current) {
        isPushingRecordedMediaChunk.current = true;
        const [db, objectStore] = await getIDBsessionMediaChunksStore(
          "readonly"
        );

        const index = objectStore.index("sessionIdIndex");
        const getRequest = index.get(IDBKeyRange.lowerBound(0));
        getRequest.onsuccess = async () => {
          if (getRequest.result) {
            await pushChunk(
              sessionId,
              getRequest.result.data,
              getRequest.result.mimeType,
              getRequest.result.command
            )
              .then(async (response) => {
                if (getRequest.result.command === "end") {
                  navigate("/dashboard");
                }
                await deleteRecordedMediaChunkWithLowestPK();
                isPushingRecordedMediaChunk.current = false;
                getAndPushMediaChunk();
              })
              .catch((error) => {
                console.log(error);
                isPushingRecordedMediaChunk.current = false;
              });
          } else {
            isPushingRecordedMediaChunk.current = false;
          }
        };
      }
    }
    let interval;
    if (hasRecordingBegan) {
      interval = setInterval(() => {
        getAndPushMediaChunk();
      }, 4000);
    }
    return () => {
      clearInterval(interval);
    };
  }, [hasRecordingBegan, sessionId, isPushingRecordedMediaChunk, navigate]);

  async function startRecording() {
    if (!displayStream) {
      //getting display stream with resolution equals to users screen
      navigator.mediaDevices
        .getDisplayMedia({
          video: {
            height: window.screen.height,
            width: window.screen.width,
          },
        })
        .then(async (stream) => {
          setDisplayStream(stream);
          setHasRecordingBegan(true);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }

  //this function stores the recorded media chunk in indexeddb, using callback because it is called from more than 1 useEffects
  const storeMediaChunk = useCallback(async (data) => {
    return new Promise(async (resolve, reject) => {
      const [_, objectStore] = await getIDBsessionMediaChunksStore("readwrite");
      const addRequest = objectStore.add(data);
      addRequest.onsuccess = () => {
        setHasMediaToPush(true);
        resolve(true);
      };
    });
  }, []);
  // async function storeMediaChunk(data, objectStore) {
  //   return new Promise(async (resolve, reject) => {
  //     const [_, objectStore] = await getIDBsessionMediaChunksStore(
  //       "readwrite"
  //     );
  //     const addRequest = objectStore.add(data);
  //     addRequest.onsuccess = () => {
  //       setHasMediaToPush(true);
  //       resolve(true);
  //     };
  //   });
  // }

  //this useeffect calls function startRecorder when we have displaystream and hasRecordingBegan state is true
  useEffect(() => {
    async function startRecorder() {
      try {
        const { sessionId } = await createNewSession({
          title: sessionTitle,
        });

        setSessionId(sessionId);
        const [db, sessionMediaChunksStore] =
          await getIDBsessionMediaChunksStore("readwrite");
        await sessionMediaChunksStore.clear();

        // const audioStream = await getAudioStream();
        // const combinedStream = new MultiStreamsMixer([stream, audioStream]);

        const displayRecorder = new MediaRecorder(displayStream, {
          mimeType: "video/webm;codecs=vp8",
        });
        setDisplayRecorder(displayRecorder);
        displayRecorder.ondataavailable = async (event) => {
          if (event.data && event.data.size > 0) {
            await storeMediaChunk({
              sessionId: sessionId,
              data: event.data,
              mimeType: "video/webm",
              command: "append",
            });
          }
        };

        const audioRecorder = new MediaRecorder(userAudioStream, {
          mimeType: "audio/webm;codecs=opus",
        });
        setAudioRecorder(audioRecorder);
        audioRecorder.ondataavailable = async (event) => {
          if (event.data && event.data.size > 0) {
            await storeMediaChunk({
              sessionId: sessionId,
              data: event.data,
              mimeType: "audio/webm",
              command: "append",
            });
          }
        };

        displayRecorder.start(10000);
        audioRecorder.start(10000);
      } catch (error) {
        console.log(error);
      }
    }
    if (displayStream && hasRecordingBegan) {
      startRecorder();
    }
  }, [
    displayStream,
    userAudioStream,
    hasRecordingBegan,
    storeMediaChunk,
    sessionTitle,
  ]);

  async function stopRecording() {
    displayRecorder.stop();
    audioRecorder?.stop();
    userAudioStream.getTracks().forEach(function (track) {
      track.stop();
    });
    displayStream.getTracks().forEach(function (track) {
      track.stop();
    });
    userWebCamStream.getTracks().forEach(function (track) {
      track.stop();
    });
    await storeMediaChunk({
      sessionId: sessionId,
      data: null,
      mimeType: null,
      command: "end",
    });
    setHasRecordingEnded(true);
    setHasMediaToPush(true);
  }
  function resumeRecording() {
    displayRecorder.resume();
    audioRecorder?.resume();
    setIsRecordingPaused(false);
  }
  function pauseRecording() {
    displayRecorder.pause();
    audioRecorder?.pause();
    setIsRecordingPaused(true);
  }

  //rendering session input form is there sessionTitle value is empty string
  //temporary sessiontitle just to get userinput and make the inputtag controlled
  const [tempSessionTitle, setTempSessionTitle] = useState("");
  if (sessionTitle === "") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-100">
        <div className="w-full max-w-sm bg-slate-200 flex flex-col gap-5 p-3 rounded-md">
          <h2 className="text-center text-xl font-bold text-slate-800">
            Enter the title of the session
          </h2>
          <input
            value={tempSessionTitle}
            autoFocus
            placeholder="Session title..."
            onChange={(e) => {
              setTempSessionTitle(e.target.value);
            }}
            type="text"
            className="focus:outline-none p-2 rounded-md border border-slate-800"
          ></input>
          <button
            className="p-1 rounded-md border border-slate-800 bg-slate-800 text-slate-200 disabled:border-slate-600 disabled:bg-transparent  disabled:text-slate-600"
            disabled={tempSessionTitle === ""}
            onClick={() => {
              setSessionTitle(tempSessionTitle);
            }}
          >
            Submit
          </button>
        </div>
      </div>
    );
  }
  return hasRecordingEnded ? (
    //displaying user not to close browser tab while there are some chunks left to be uploaded to the server
    <div className="min-h-screen w-full bg-slate-100 flex items-center justify-center p-3">
      <div className="w-full max-w-sm flex flex-col gap-3 p-3 bg-slate-200 items-center rounded-md">
        <div className="h-52">
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
        <div className="flex flex-row items-center">
          <p className="text-center text-slate-800">
            Please do not close the browser window, the recorded video is being
            uploaded.
          </p>
        </div>
        <div className="flex flex-row items-center justify-center h-10 p-2">
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
      </div>
    </div>
  ) : userWebCamStream ? (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col items-center justify-center gap-5 p-5 ">
      <div className="w-3/5 bg-slate-300 aspect-16/9 rounded-md overflow-hidden">
        <video
          ref={userScreenDisplayVideoRef}
          className="h-full w-full"
          autoPlay
          controls={false}
          muted
        />
      </div>
      <div className="p-2 w-3/5 px-7 rounded-md flex flex-row items-center justify-center gap-5 bg-slate-200">
        <button
          className="h-12 p-3 rounded-full bg-slate-300"
          onClick={hasRecordingBegan ? stopRecording : startRecording}
        >
          {hasRecordingBegan ? (
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 28 28"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
            >
              <g
                id="Page-1"
                stroke="none"
                strokeWidth="1"
                fill="none"
                fillRule="evenodd"
              >
                <g
                  id="Icon-Set-Filled"
                  transform="translate(-520.000000, -571.000000)"
                  fill="#000000"
                >
                  <path
                    d="M546,571 L522,571 C520.896,571 520,571.896 520,573 L520,597 C520,598.104 520.896,599 522,599 L546,599 C547.104,599 548,598.104 548,597 L548,573 C548,571.896 547.104,571 546,571"
                    id="stop"
                  ></path>
                </g>
              </g>
            </svg>
          ) : (
            //this svg is a triangular play button
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
          )}
        </button>
        {hasRecordingBegan && (
          <button
            className="h-10 p-2 bg-slate-300 rounded-full"
            onClick={isRecordingPaused ? resumeRecording : pauseRecording}
          >
            {isRecordingPaused ? (
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
            ) : (
              <svg
                fill="#000000"
                width="100%"
                height="100%"
                viewBox="0 0 32 32"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M5.92 24.096q0 0.832 0.576 1.408t1.44 0.608h4.032q0.832 0 1.44-0.608t0.576-1.408v-16.16q0-0.832-0.576-1.44t-1.44-0.576h-4.032q-0.832 0-1.44 0.576t-0.576 1.44v16.16zM18.016 24.096q0 0.832 0.608 1.408t1.408 0.608h4.032q0.832 0 1.44-0.608t0.576-1.408v-16.16q0-0.832-0.576-1.44t-1.44-0.576h-4.032q-0.832 0-1.408 0.576t-0.608 1.44v16.16z"></path>
              </svg>
            )}
          </button>
        )}
        <div
          className="absolute bottom-0 m-2 right-0 h-52 w-52 cursor-pointer bg-slate-200"
          onClick={togglePictureInPicture}
        >
          <video
            ref={userWebCamRef}
            autoPlay
            controls={false}
            className="h-full w-full -z-10"
          />
          <div className="h-full w-full bg-slate-100/70 absolute top-0 left-0 flex items-center justify-center">
            Put face video on top.
          </div>
        </div>
      </div>
    </div>
  ) : (
    //displaying just logo until user gives the webcam access permission
    <div className="min-h-screen flex items-center justify-center">
      <div className="h-52">
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
    </div>
  );
}
