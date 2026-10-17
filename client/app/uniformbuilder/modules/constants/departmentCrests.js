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

export const DEPARTMENT_CREST_TITLE_EXCEPTIONS = [
  {
    positionTitle: "Regimental Technical Aide",
    alias: "S6",
  },
];

export const DEPARTMENT_CREST_REGEX = /^(ODS|NCOA|RRD|RTC|[S]+\d+)\b/i;
