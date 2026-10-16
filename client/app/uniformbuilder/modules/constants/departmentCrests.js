export const DEPARTMENT_CREST_IMAGES = Object.freeze({
  S1: "s1",
  S2: "s2",
  S3: "s3",
  S5: "s5",
  S6: "s6",
});

export const DEPARTMENT_CRESTS = [
  {
    crestName: "S1",
    crestImage: DEPARTMENT_CREST_IMAGES.S1,
  },
  {
    crestName: "S2",
    crestImage: DEPARTMENT_CREST_IMAGES.S2,
  },
  {
    crestName: "S3",
    crestImage: DEPARTMENT_CREST_IMAGES.S3,
  },
  {
    crestName: "S5",
    crestImage: DEPARTMENT_CREST_IMAGES.S5,
  },
  {
    crestName: "S6",
    crestImage: DEPARTMENT_CREST_IMAGES.S6,
  },
];

//We test our search by checking against longer phrases. Once that is done, we check against more primitive phrases
//I dont like the look of this either, but I think this is the best compromise considering the vast amount of billets we use.
export const DEPARTMENT_CREST_MAPPING_RULES = [
  { test: (str) => /Regimental Technical Aide/i.test(str), crestName: "S6" },
  {
    test: (str) => /^(ODS|NCOA|RRD|RTC|[A-Z]+\d+)\b/i.test(str),
    crestName: (str) =>
      str.match(/^(ODS|NCOA|RRD|RTC|[A-Z]+\d+)\b/i)[1].toUpperCase(),
  },
];
