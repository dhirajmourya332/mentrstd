import Session from "../Models/Session.mjs";

function AllSessions(req, res) {
  const { uid } = req;
  Session.find({ user_id: uid, is_ended: true }, "title length url")
    .sort({ created_at: 1 })
    .then((docs) => {
      res.json({ success: true, data: docs });
    })
    .catch((error) => {
      console.log(error);
      res.json({ success: false, error: "SOMETHING_WENT_WRONG" });
    });
}

export default AllSessions;
