const cacheManager = require("../controllers/cacheManager");

module.exports = async (req, res) => {
  const cachedMedalRecipientRoster =
    cacheManager.getCachedMedalRecipientRoster();

  if (cachedMedalRecipientRoster) {
    res.send(cachedMedalRecipientRoster);
  } else {
    res.status(503).send("Cache is empty");
  }
};
