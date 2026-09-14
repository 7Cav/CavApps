// Award type taxonomy. Values MUST equal the corresponding class names in
// AwardClasses.jsx — getCanvasObject routes on these strings to instantiate the
// matching class. Do not rename a value without renaming its class.
export const AwardType = Object.freeze({
  Medal: "Medal",
  Ribbon: "Ribbon",
  MedalWithValor: "MedalWithValor",
  MedalTiered: "MedalTiered",
  RibbonDonationLogic: "RibbonDonationLogic",
  RibbonPerRank: "RibbonPerRank",
  UnitCitation: "UnitCitation",
  BadgeCombat: "BadgeCombat",
  WeaponQual: "WeaponQual",
  Tab: "Tab",
});
