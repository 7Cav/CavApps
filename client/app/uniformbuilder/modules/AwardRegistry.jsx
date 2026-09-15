import {
  MAX_AWARD_COUNT,
  hasValorDevice,
  stripValorDevice,
  AWARD_CATALOG,
} from "./constants";

export class AwardRegistry {
  constructor() {
    this.awards = new Map();
    this.initalizeAwards();
  }

  initalizeAwards() {
    for (const { name, ...details } of AWARD_CATALOG) {
      this.awards.set(name, details);
    }
  }

  isInRegistry(awardName) {
    return this.awards.has(awardName);
  }

  getAwardDetails(awardName) {
    if (hasValorDevice(awardName)) {
      awardName = stripValorDevice(awardName);
    }

    return this.awards.get(awardName) ?? 0;
  }

  // The catalog gives some awards no device. With no image to draw, a repeat
  // row must never raise the displayed count, so those awards get 0 (#244).
  getMaxAwardCount(awardName) {
    return (
      MAX_AWARD_COUNT[this.getAwardDetails(awardName).awardAttachmentType] ?? 0
    );
  }
}
