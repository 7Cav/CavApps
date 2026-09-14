import {
  AwardAttachmentType,
  hasValorDevice,
  parseNcoRankNumeral,
  stripValorDevice,
} from "./constants";

export class Award {
  awardTitle = null;
  //awardDetail = null;
  awardPriority = null;

  constructor(data) {
    this.awardTitle = data.awardName;
  }
}

export class Ribbon extends Award {
  maxAwardcount = null;
  ribbonAttachmentType = null;
  ribbonDisplayedAttachmentCount = 0;
  ribbonTrueAttachmentCount = 0;

  constructor(data, AwardRegistry) {
    super(data);

    const registryDetails = AwardRegistry.getAwardDetails(data.awardName);

    if (registryDetails.awardAttachmentType != undefined) {
      this.ribbonAttachmentType = registryDetails.awardAttachmentType;
    }
    this.awardPriority = registryDetails.awardPriority;
    this.maxAwardcount = AwardRegistry.getMaxAwardCount(this.awardTitle);

    Ribbon.totalRibbonCount++;
  }

  // Called once per further MILPAC row of this award. A subclass that reads
  // the row takes it as an argument; the base count ignores it.
  incrementAwardCount() {
    this.ribbonTrueAttachmentCount++;
    this.calculateNewDisplayCount();
  }

  calculateNewDisplayCount() {
    // Clusters and stars mark the awards past the first, so their count runs
    // one lower than the award count. A numeral shows the award count itself
    // (7CAV-DR-021, section 5.2.3.6: Air Medal, 2nd award = "2"). A subclass
    // that reads the numeral off the rows overrides this method.
    if (this.ribbonAttachmentType === AwardAttachmentType.NCO_NUMS) {
      this.displayNumeral(this.ribbonTrueAttachmentCount + 1);
      return;
    }
    if (this.ribbonTrueAttachmentCount <= this.maxAwardcount) {
      this.ribbonDisplayedAttachmentCount++;
    }
  }

  // A numeral of 1 is never drawn; the ribbon stays plain. For a numeral,
  // maxAwardcount is the highest numeral image that exists.
  displayNumeral(numeral) {
    this.ribbonDisplayedAttachmentCount =
      numeral > 1 ? Math.min(numeral, this.maxAwardcount) : 0;
  }
}

export class Medal extends Ribbon {
  medalPriority;

  constructor(data, AwardRegistry) {
    super(data, AwardRegistry);
    const registryDetails = AwardRegistry.getAwardDetails(data.awardName);
    this.medalPriority = registryDetails.medalPriority;
    Medal.totalMedalCount++;
  }
}

export class MedalWithValor extends Medal {
  hasValorDevice = false;

  constructor(data, AwardRegistry) {
    super(data, AwardRegistry);

    if (hasValorDevice(this.awardTitle)) {
      this.overrideAwardTitle(data.awardName);
    }
  }

  overrideAwardTitle(awardName) {
    const baseAwardName = stripValorDevice(awardName);
    this.awardTitle = baseAwardName;
    this.hasValorDevice = true;
    this.ribbonAttachmentType = AwardAttachmentType.OAK_CLUSTERS_VALOR;
    this.maxAwardcount = 14;
  }
}

export class RibbonDonationLogic extends Ribbon {
  constructor(data, AwardRegistry) {
    super(data, AwardRegistry);
    this.ribbonTrueAttachmentCount = 1;
  }

  incrementAwardCount() {
    this.ribbonTrueAttachmentCount++;
    this.calculateNewDisplayCount();
  }

  //prettier-ignore
  calculateNewDisplayCount() {
    if (this.ribbonTrueAttachmentCount < 7) {
      this.ribbonDisplayedAttachmentCount++;
    }
    if ( this.ribbonTrueAttachmentCount >= 7 && this.ribbonTrueAttachmentCount < 11) {
      this.ribbonDisplayedAttachmentCount = 5;
    }
    if (this.ribbonTrueAttachmentCount >= 11 && this.ribbonTrueAttachmentCount < 16) {
      this.ribbonDisplayedAttachmentCount = 6;
    }
    if (this.ribbonTrueAttachmentCount >= 16 && this.ribbonTrueAttachmentCount < 21) {
      this.ribbonDisplayedAttachmentCount = 7;
    }
    if (this.ribbonTrueAttachmentCount >= 21 && this.ribbonTrueAttachmentCount < 26) {
      this.ribbonDisplayedAttachmentCount = 8;
    }
    if (this.ribbonTrueAttachmentCount >= 26 && this.ribbonTrueAttachmentCount < 51) {
      this.ribbonDisplayedAttachmentCount = 9;
    }
    if (this.ribbonTrueAttachmentCount >= 51 && this.ribbonTrueAttachmentCount < 76) {
      this.ribbonDisplayedAttachmentCount = 10;
    }
    if ( this.ribbonTrueAttachmentCount >= 76 && this.ribbonTrueAttachmentCount < 101) {
      this.ribbonDisplayedAttachmentCount = 11;
    }
    if (this.ribbonTrueAttachmentCount >= 101) {
      this.ribbonDisplayedAttachmentCount = 12;
    }
  }
}

// The NCO Professional Development Ribbon's numeral marks the highest NCO
// rank held above Sergeant (7CAV-DR-021, section 5.2.3.6): Sergeant plain,
// Staff Sergeant "2", up to Command Sergeant Major "7". S1 names the rank in
// each MILPAC row's details. The numeral is the highest rank named across the
// rows, however many there are, and a demotion never lowers it.
//
// The SOP has no rule for a row that names no rank. Such a row cannot prove a
// rank above Sergeant, so it never raises the numeral. A trooper whose only
// rows are blank draws a plain ribbon.
export class RibbonByHighestRank extends Ribbon {
  highestRankNumeral = 0;

  constructor(data, AwardRegistry) {
    super(data, AwardRegistry);
    this.noteRank(data);
    this.calculateNewDisplayCount();
  }

  incrementAwardCount(row) {
    this.noteRank(row);
    super.incrementAwardCount();
  }

  noteRank(row) {
    const numeral = parseNcoRankNumeral(row.awardDetails);
    if (numeral !== null && numeral > this.highestRankNumeral) {
      this.highestRankNumeral = numeral;
    }
  }

  calculateNewDisplayCount() {
    this.displayNumeral(this.highestRankNumeral);
  }
}

export class MedalTiered extends Medal {
  highestTierAchieved = 0;

  constructor(data, AwardRegistry) {
    super(data, AwardRegistry);

    this.updateTieredMedal(data.awardDetails);
    this.ribbonTrueAttachmentCount = null;
  }

  incrementAwardCount() {
    return;
  }

  updateTieredMedal(detail) {
    //Stackup logic
    if (this.ribbonAttachmentType == AwardAttachmentType.GC_NOTCHES) {
      switch (detail) {
        case "Gold Knot":
          this.highestTierAchieved = 3;
          this.ribbonDisplayedAttachmentCount = 7;
          break;
        case "Silver Knot":
          if (this.highestTierAchieved <= 1) {
            this.ribbonDisplayedAttachmentCount = 4;
            this.highestTierAchieved = 2;
          }
          break;
        case "Bronze Knot":
          if (this.highestTierAchieved <= 0) {
            this.ribbonDisplayedAttachmentCount = 1;
            this.highestTierAchieved = 1;
          }
          break;
        default:
          if (this.highestTierAchieved == 0) {
            this.ribbonDisplayedAttachmentCount = 0;
          }
          break;
      }
    }

    //Server upgrade ribbon logic
    if (this.ribbonAttachmentType == AwardAttachmentType.STARS) {
      switch (detail) {
        case "Gold Star":
          this.highestTierAchieved = 2;
          this.ribbonDisplayedAttachmentCount = 10;
          break;
        case "Silver Star":
          if (this.highestTierAchieved <= 1) {
            this.ribbonDisplayedAttachmentCount = 5;
            this.highestTierAchieved = 1;
          }
          break;
        default:
          if (this.highestTierAchieved == 0) {
            this.ribbonDisplayedAttachmentCount = 0;
          }
          break;
      }
    }
  }
}

export class Badge extends Award {
  // Do things
}

// A member wears one combat badge: the highest-ranked of those they hold and
// their MOS may display. Eligibility is settled before construction, in
// getCanvasObject.jsx — every award reaching this class is one the member may
// wear, so all that is left is to keep the highest.
export class BadgeCombat extends Badge {
  imageNum = 0;

  constructor(awardData, AwardRegistry) {
    super(awardData, AwardRegistry);

    const registryDetails = AwardRegistry.getAwardDetails(awardData.awardName);
    this.awardPriority = registryDetails.awardPriority;
    this.imageNum = registryDetails.badgeImage;
  }

  updateBadgeCombat(newAwardData, AwardRegistry) {
    const registryDetails = AwardRegistry.getAwardDetails(
      newAwardData.awardName,
    );

    if (registryDetails.awardPriority > this.awardPriority) {
      this.awardTitle = newAwardData.awardName;
      this.awardPriority = registryDetails.awardPriority;
      this.imageNum = registryDetails.badgeImage;
    }
  }
}

export class UnitCitation extends Award {
  //Why am i using extends Award even though it is the same as ribbon? Its because im grouping them seperately

  maxAwardcount = null;
  ribbonAttachmentType = null;
  ribbonDisplayedAttachmentCount = 0;
  ribbonTrueAttachmentCount = 0;

  constructor(data, AwardRegistry) {
    super(data);

    const registryDetails = AwardRegistry.getAwardDetails(data.awardName);

    if (registryDetails.awardAttachmentType != undefined) {
      this.ribbonAttachmentType = registryDetails.awardAttachmentType;
    }
    this.awardPriority = registryDetails.awardPriority;
    this.maxAwardcount = AwardRegistry.getMaxAwardCount(this.awardTitle);

    Ribbon.totalRibbonCount++;
  }

  incrementAwardCount() {
    this.ribbonTrueAttachmentCount++;
    this.calculateNewDisplayCount();
  }

  calculateNewDisplayCount() {
    if (this.ribbonTrueAttachmentCount <= this.maxAwardcount) {
      this.ribbonDisplayedAttachmentCount++;
    }
  }
}

export class WeaponQual extends Award {
  expertQuals = [];
  sharpshooterQuals = [];
  marksmanQuals = [];

  weaponOrder = [
    "rifle",
    "grenade",
    "tankWeapons",
    "m203",
    "machineGun",
    "recoillessRifle",
    "pistol",
    "aeroweapons",
    //"carbine",
    //"autoRifle",
    "hydra70",
  ];

  constructor(data, AwardRegistry) {
    super(data);
    this.awardTitle = "Weapon Qualifications";
    this.addAward(data, AwardRegistry);
  }

  sortQuals(qualArray) {
    qualArray.sort((a, b) => {
      const indexA = this.weaponOrder.indexOf(a);
      const indexB = this.weaponOrder.indexOf(b);

      if (indexA === -1) return 1;
      if (indexB === -1) return -1;

      return indexA - indexB;
    });
  }

  addAward(data, AwardRegistry) {
    const registryDetails = AwardRegistry.getAwardDetails(data.awardName);

    if (data.awardName.includes("Expert")) {
      this.expertQuals.push(registryDetails.awardTag);
      this.sortQuals(this.expertQuals);
    }

    if (data.awardName.includes("Sharpshooter")) {
      this.sharpshooterQuals.push(registryDetails.awardTag);
      this.sortQuals(this.sharpshooterQuals);
    }

    if (data.awardName.includes("Marksman")) {
      this.marksmanQuals.push(registryDetails.awardTag);
      this.sortQuals(this.marksmanQuals);
    }
  }
}

export class Tab extends Award {
  constructor(data, AwardRegistry) {
    super(data);
    const registryDetails = AwardRegistry.getAwardDetails(data.awardName);
    this.awardPriority = registryDetails.awardPriority;
  }
}
