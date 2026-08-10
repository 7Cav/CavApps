const express = require("express");
const router = express.Router();
const cors = require("cors");
const cRequest = require("../controllers/cRequest");
const rRequest = require("../controllers/rRequest");
const mRequest = require("../controllers/mRequest");
const iRequest = require("../controllers/iRequest");
const gRequest = require("../controllers/gRequest");
const app = express();

app.use(
  cors({
    origin: "*",
  }),
);

router.get("/combat", cRequest);
router.get("/reserves", rRequest);
router.get("/medal-eligible", mRequest);
router.get("/individual", (req, res) => {
  const userName = req.query.username;
  if (!userName) {
    return res.status(400).send("Username is required");
  }
  iRequest(req, res, userName);
});
router.get("/groups", gRequest);
module.exports = router;
