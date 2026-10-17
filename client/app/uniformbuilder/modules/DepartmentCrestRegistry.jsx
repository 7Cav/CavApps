import {
  DEPARTMENT_CRESTS,
  DEPARTMENT_CREST_TITLE_EXCEPTIONS,
  DEPARTMENT_CREST_REGEX,
} from "./constants/departmentCrests";

export class DepartmentCrestRegistry {
  constructor() {
    this.crests = new Map();
    this.positionAliases = new Map();
    this.initalizeCrests();
    this.initalizeCrestAliases();
  }

  initalizeCrests() {
    for (const { crestName, ...details } of DEPARTMENT_CRESTS) {
      this.crests.set(crestName, details);
    }
  }

  initalizeCrestAliases() {
    for (const { positionTitle, alias } of DEPARTMENT_CREST_TITLE_EXCEPTIONS) {
      this.positionAliases.set(positionTitle, alias);
    }
  }

  getCrestByPosition(positionName) {
    let foundAlias = this.checkForAlias(positionName);

    if (foundAlias) {
      return foundAlias;
    }

    const match = positionName.match(DEPARTMENT_CREST_REGEX);

    if (!match) return null;

    const deptCode = match[1].toUpperCase();

    return this.crests.get(deptCode) || null;
  }

  checkForAlias(positionName) {
    if (this.positionAliases.has(positionName)) {
      return this.positionAliases.get(positionName);
    }
    return null;
  }
}
