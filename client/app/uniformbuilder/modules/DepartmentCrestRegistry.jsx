import {
  DEPARTMENT_CRESTS,
  DEPARTMENT_CREST_MAPPING_RULES,
} from "./constants/departmentCrests";

export class DepartmentCrestRegistry {
  constructor() {
    this.crests = new Map();
    this.initalizeCrests();
  }

  initalizeCrests() {
    for (const { crestName, ...details } of DEPARTMENT_CRESTS) {
      this.crests.set(crestName, details);
    }
  }

  //Do a complicated search for a matching phrase
  getCrestByPosition(positionName) {
    for (const rule of DEPARTMENT_CREST_MAPPING_RULES) {
      if (rule.test(positionName)) {
        const resolvedName =
          typeof rule.crestName === "function"
            ? rule.crestName(positionName)
            : rule.crestName;

        return this.crests.get(resolvedName) || null;
      }
    }
  }
}
