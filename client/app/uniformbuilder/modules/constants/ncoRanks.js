// The NCO Professional Development Ribbon's numeral marks the highest NCO rank
// held above Sergeant (7CAV-DR-021, section 5.2.3.6 "Numerals"): Sergeant
// draws a plain ribbon, Staff Sergeant "2", and so on up to Command Sergeant
// Major "7". Each rank's numeral doubles as its order, so the highest rank
// named across a trooper's rows is the largest numeral.
const NcoRankNumeral = Object.freeze({
  SGT: 1,
  SSG: 2,
  SFC: 3,
  MSG: 4,
  FIRST_SGT: 5,
  SGM: 6,
  CSM: 7,
});

// S1 types the rank into each row's details by hand, so these key on the
// rank words and ignore the rest. "Sergent Promotion", "Promoted to Sergeant"
// and "Sergeant (E-5)" all read as SGT. Longer titles come first so "Command
// Sergeant Major" is not read as "Sergeant Major" or "Sergeant".
const SERGEANT = "serg?e?a?nt";
const NCO_RANK_PATTERNS = [
  [NcoRankNumeral.CSM, new RegExp(`command\\s+${SERGEANT}\\s+major`, "i")],
  [NcoRankNumeral.SGM, new RegExp(`${SERGEANT}\\s+major`, "i")],
  [NcoRankNumeral.FIRST_SGT, new RegExp(`first\\s+${SERGEANT}`, "i")],
  [NcoRankNumeral.MSG, new RegExp(`master\\s+${SERGEANT}`, "i")],
  [NcoRankNumeral.SFC, new RegExp(`${SERGEANT}\\s+first\\s+class`, "i")],
  [NcoRankNumeral.SSG, new RegExp(`staff\\s+${SERGEANT}`, "i")],
  [NcoRankNumeral.SGT, new RegExp(SERGEANT, "i")],
];

// The numeral of the rank a details string names, or null when it names none.
export function parseNcoRankNumeral(details) {
  const match = NCO_RANK_PATTERNS.find(([, pattern]) =>
    pattern.test(details ?? ""),
  );
  return match ? match[0] : null;
}
