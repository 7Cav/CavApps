import {
  AwardAttachmentType,
  MosGroup,
  AwardNameFragment,
  hasValorDevice,
  stripValorDevice,
  BadgeImages,
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

export class BadgeCombat extends Badge {
  isMedical = false;
  isAviation = false;
  imageNum = 0;
  maxAllowed;
  userMos = "";

  constructor(awardData, userMos, AwardRegistry) {
    super(awardData, AwardRegistry);

    const registryDetails = AwardRegistry.getAwardDetails(awardData.awardName);
    this.awardPriority = registryDetails.awardPriority;

    this.userMos = userMos;
    if (MosGroup.AVIATION.includes(this.userMos)) {
      this.isAviation = true;
    }

    if (MosGroup.MEDICAL.includes(this.userMos)) {
      this.isMedical = true;
    }

    this.imageNum = this.getImageNum(this.awardPriority);
    this.setMaxAllowed();
  }

  setMaxAllowed() {
    if (this.isMedical) {
      this.maxAllowed = 6;
      return;
    }

    //we need to give 15T (aircrew) an exception so that they stop at aircrew badges.
    if (this.isAviation) {
      if (MosGroup.AIRCREW.includes(this.userMos)) {
        this.maxAllowed = 8;
      } else {
        this.maxAllowed = 11;
      }
      return;
    }

    this.maxAllowed = 5;
  }

  getImageNum(awardPriority) {
    // Maps awardPriority from constants/awardCatalog.js to a badge image that
    // canvas.jsx will use to render from client/public/skunkworks/uniformBadges/combatBadges/<n>.png
    // awardPriority values 1-5 (EIB thru CIB4) are universal and are matched by default and fall through

    if (this.isAviation) {
      switch (awardPriority) {
        case 6:
          return BadgeImages.aircrew;
        case 7:
          return BadgeImages.seniorAircrew;
        case 8:
          return BadgeImages.masterAircrew;
        case 9:
          return BadgeImages.aviator;
        case 10:
          return BadgeImages.seniorAviator;
        case 11:
          return BadgeImages.masterAviator;
      }
    }

    // awardPriority 6 is used for both aviation and medical trees.
    // isMedical will claim the value for the medical tree.
    if (this.isMedical && awardPriority == 6) {
      return BadgeImages.flightMedicBadge;
    }

    return awardPriority;
  }

  updateBadgeCombat(newAwardData, AwardRegistry) {
    const registryDetails = AwardRegistry.getAwardDetails(
      newAwardData.awardName,
    );
    const newAwardPriority = registryDetails.awardPriority;

    if (
      newAwardPriority > this.awardPriority &&
      newAwardPriority <= this.maxAllowed
    ) {
      if (
        newAwardData.awardName == AwardNameFragment.FLIGHT_MEDIC_BADGE &&
        !this.isMedical
      ) {
        return;
      }

      if (
        newAwardData.awardName.includes(AwardNameFragment.AVIATOR) &&
        !this.isAviation
      ) {
        return;
      }

      this.awardTitle = newAwardData.awardName;
      this.awardPriority = newAwardPriority;
      this.imageNum = this.getImageNum(newAwardPriority);
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
