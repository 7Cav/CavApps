// The NCO ranks the NCO Professional Development Ribbon is awarded for, one
// MILPAC row per promotion. Rank title is the key: MSG and 1SG are two ranks.
const NcoRank = Object.freeze({
  SGT: "SGT",
  SSG: "SSG",
  SFC: "SFC",
  MSG: "MSG",
  FIRST_SGT: "1SG",
  SGM: "SGM",
  CSM: "CSM",
});

// S1 types the rank into each row's details by hand, so these key on the
// rank words and ignore the rest. "Sergent Promotion", "Promoted to Sergeant"
// and "Sergeant (E-5)" all read as SGT. Longer titles come first so "Command
// Sergeant Major" is not read as "Sergeant Major" or "Sergeant".
const SERGEANT = "serg?e?a?nt";
const NCO_RANK_PATTERNS = [
  [NcoRank.CSM, new RegExp(`command\\s+${SERGEANT}\\s+major`, "i")],
  [NcoRank.SGM, new RegExp(`${SERGEANT}\\s+major`, "i")],
  [NcoRank.FIRST_SGT, new RegExp(`first\\s+${SERGEANT}`, "i")],
  [NcoRank.MSG, new RegExp(`master\\s+${SERGEANT}`, "i")],
  [NcoRank.SFC, new RegExp(`${SERGEANT}\\s+first\\s+class`, "i")],
  [NcoRank.SSG, new RegExp(`staff\\s+${SERGEANT}`, "i")],
  [NcoRank.SGT, new RegExp(SERGEANT, "i")],
];

// The rank a details string names, or null when it names none.
export function parseNcoRank(details) {
  const match = NCO_RANK_PATTERNS.find(([, pattern]) =>
    pattern.test(details ?? ""),
  );
  return match ? match[0] : null;
}
