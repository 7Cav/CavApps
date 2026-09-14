// Ribbon/medal attachment-device taxonomy and the max displayable count per
// device. For a numeral device the count is the highest numeral image that
// exists. MAX_AWARD_COUNT is the source of those numbers, not a copy of them:
// AwardRegistry.getMaxAwardCount reads this table. (It once described a switch
// statement there, which PR #130 replaced with this lookup.)
export const AwardAttachmentType = Object.freeze({
  OAK_CLUSTERS: "oakClusters",
  UNIT_CITATION_CLUSTERS: "unitCitationClusters",
  UNIT_CITATION_S_STARS: "unitCitationSStars",
  OAK_CLUSTERS_SERVICE: "oakClustersService",
  OAK_CLUSTERS_VALOR: "oakClustersValor",
  SILVER_STARS: "silverStars",
  STARS: "stars",
  STARS_DONATION: "starsDonation",
  GC_NOTCHES: "gcNotches",
  NCO_NUMS: "ncoNums",
});

export const MAX_AWARD_COUNT = Object.freeze({
  [AwardAttachmentType.OAK_CLUSTERS]: 19,
  [AwardAttachmentType.UNIT_CITATION_CLUSTERS]: 10,
  [AwardAttachmentType.UNIT_CITATION_S_STARS]: 5,
  [AwardAttachmentType.OAK_CLUSTERS_SERVICE]: 6,
  [AwardAttachmentType.OAK_CLUSTERS_VALOR]: 14,
  [AwardAttachmentType.SILVER_STARS]: 5,
  [AwardAttachmentType.STARS]: 10,
  [AwardAttachmentType.STARS_DONATION]: 12,
  [AwardAttachmentType.GC_NOTCHES]: 9,
  [AwardAttachmentType.NCO_NUMS]: 6,
});
