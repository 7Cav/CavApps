const express = require("express");
const router = express.Router();

// Reports the image's release tag so the deploy workflow can tell when the
// new container is the one serving. The Dockerfile sets APP_VERSION from its
// ARG VERSION; a local build has no tag and answers "dev".
router.get("/version", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({ version: process.env.APP_VERSION || "dev" });
});

module.exports = router;
