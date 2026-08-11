const { getMedalEligibleRoster } = require("./medalRosterCache");

module.exports = async (req, res) => {
  try {
    const roster = await getMedalEligibleRoster();

    res.json(roster);
  } catch (error) {
    console.error("Failed to serve Medal-eligible roster:", error);

    res.status(503).json({
      error: "Medal-eligible roster is currently unavailable",
    });
  }
};
