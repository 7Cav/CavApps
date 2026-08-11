"use strict";

// -------------------------------------------------------------------------
// Configuration
// -------------------------------------------------------------------------

const DEFAULT_LIMITS = Object.freeze({
  awardSelection: 200,
  rosterSelection: 200,
  serviceField: 500,
  organization: 200,
  choice: 200,
  month: 20,
  year: 4,
  narrative: 2100,
  unitRecipients: 20,
  serviceIndividualRecipients: 20,
  role: 120,
});

const NARRATIVE_SOFT_CHARACTER_LIMIT = 1400;

const SERVICE_TICKET_TITLE_FIELD_KEYS = Object.freeze({
  service_outstanding_volunteer_service_medal: Object.freeze([
    "nonCombatDepartment",
  ]),
  service_army_achievement_medal: Object.freeze(["affectedArea"]),
  service_joint_service_achievement_medal: Object.freeze(["benefitedUnit"]),
  service_army_commendation_medal: Object.freeze(["affectedUnitOrArea"]),
  service_joint_service_commendation_medal: Object.freeze(["benefitedCompany"]),
  service_meritorious_service_medal: Object.freeze(["benefitedUnitOrArea"]),
  service_defense_meritorious_service_medal: Object.freeze([
    "benefitedUnitOrArea",
  ]),
  service_soldiers_medal: Object.freeze(["benefitedUnitOrArea"]),
  service_legion_of_merit: Object.freeze(["creditedDepartmentOrElement"]),
  service_defense_superior_service_medal: Object.freeze([
    "creditedDepartmentOrElement",
    "creditedOperationsAo",
  ]),
  service_distinguished_service_medal: Object.freeze([
    "creditedOrganizationalElement",
  ]),
  service_defense_distinguished_service_medal: Object.freeze([
    "creditedOrganizationalElement",
  ]),
  service_joint_meritorious_unit_award: Object.freeze(["recognizedGroup"]),
  service_superior_unit_award: Object.freeze(["recognizedGroup"]),
});

const SERVICE_MONTHS = Object.freeze([
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]);

const CONTROLLED_FIELD_COMPONENTS = Object.freeze(["select", "month", "year"]);

const SENTENCE_ABBREVIATIONS = Object.freeze([
  "1LT",
  "1SG",
  "2LT",
  "BG",
  "CAPT",
  "COL",
  "CPL",
  "CPT",
  "CSM",
  "CW2",
  "CW3",
  "CW4",
  "CW5",
  "GEN",
  "GOA",
  "LT",
  "LTC",
  "LTG",
  "MAJ",
  "MG",
  "MSG",
  "PFC",
  "PVT",
  "RCT",
  "SFC",
  "SGM",
  "SGT",
  "SPC",
  "SSG",
  "WO1",
]);

// -------------------------------------------------------------------------
// Public generation workflow
// -------------------------------------------------------------------------

function generate(payload, bootstrap) {
  const source = payload || {};
  const context = normalizeReference(bootstrap);
  const checks = validateGeneralInputIntegrity(source, context.limits);
  const award = findAward(source.awardId, context.definitions);
  const rawNarrative = source.narrative;
  const narrative = cleanText(rawNarrative);

  checks.push(
    check(
      "Service award selected",
      Boolean(award),
      "Select a valid Service award.",
    ),
  );

  if (!award) {
    return finishGeneration({
      ready: false,
      award: null,
      recipients: [],
      citation: "",
      checks,
      warnings: [],
      narrative,
      fields: {},
    });
  }

  validateWorksheetScope(source.scope, award, checks);

  const fields = validateAndNormalizeFields(
    source.fields,
    award,
    context,
    checks,
  );
  const recipients = validateAndResolveRecipients(
    source.recipients,
    award,
    context,
    checks,
  );
  const correctedNarrative = normalizeServiceNarrativeNames(
    narrative,
    recipients,
  );

  appendAwardSpecificChecks({
    source,
    award,
    fields,
    rawNarrative,
    narrative: correctedNarrative,
    checks,
  });

  const template = prepareAwardTemplate(award, fields, recipients);

  checks.push(template.check);

  const warnings = buildWarnings(award, correctedNarrative, recipients);
  const ready = checks.every((item) => item.status === "PASS");
  const citation = ready
    ? buildCitation(award, fields, recipients, correctedNarrative, template)
    : "";

  return finishGeneration({
    ready,
    award,
    recipients,
    citation,
    checks,
    warnings,
    narrative: correctedNarrative,
    fields,
  });
}

function findAward(awardId, definitions) {
  const normalizedId = cleanText(awardId);
  return definitions.find((item) => item.id === normalizedId) || null;
}

function validateWorksheetScope(scope, award, checks) {
  if (!scope) {
    return;
  }

  checks.push(
    check(
      "Award matches this worksheet",
      scope === award.scope,
      `Select a Service ${scope === "unit" ? "Unit Award" : "Medal"} for this worksheet.`,
    ),
  );
}

function appendAwardSpecificChecks(options) {
  const { source, award, fields, rawNarrative, narrative, checks } = options;

  validateFieldRelationships(fields, award, checks);
  validateServicePeriod(fields, award, checks);
  checks.push(checkBbcodeSafety(source.fields, award.fields, rawNarrative));
  appendNarrativeChecks(narrative, award, checks);
}

function appendNarrativeChecks(narrative, award, checks) {
  checks.push(
    check(
      "Citation narrative",
      Boolean(narrative),
      award.scope === "unit"
        ? "Write the shared unit citation in your own words."
        : "Write the citation narrative in your own words.",
    ),
  );
  checks.push(
    check(
      "Minimum sentence count",
      Boolean(narrative) &&
        countApproximateSentences(narrative) >= award.minimumSentences,
      `Use at least ${award.minimumSentences} complete narrative sentences.`,
    ),
  );
}

function buildCitation(award, fields, recipients, narrative, template) {
  const fullNames = formatRecipientList(recipients.map(recipientName));
  const narrativeLead = fields.narrativeLead || "distinguished themselves by";
  const lead =
    award.scope === "individual" && fullNames
      ? `${fullNames} ${narrativeLead}`
      : "";

  return [template.opening, lead, narrative, template.closing]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildWarnings(award, narrative, recipients) {
  const warnings = [];
  const wordCount = countWords(narrative);
  const suggestedWordCount = award.minimumSentences * 15;

  if (narrative && wordCount < suggestedWordCount) {
    warnings.push(
      [
        `The narrative is only ${wordCount} words.`,
        `A narrative of approximately ${suggestedWordCount} words is a useful starting point`,
        "for this award. Please proofread and expand it as necessary.",
      ].join(" "),
    );
  }

  if (narrative.length > NARRATIVE_SOFT_CHARACTER_LIMIT) {
    warnings.push(
      [
        `The narrative is ${narrative.length.toLocaleString()} characters.`,
        "The recommended maximum is 1,400 characters; you can still generate the",
        "recommendation, but consider shortening it.",
      ].join(" "),
    );
  }

  const capitalizationWarning = getNarrativeCapitalizationWarning(narrative);
  if (capitalizationWarning) warnings.push(capitalizationWarning);

  if (recipients.length > 20) {
    warnings.push(
      `This recommendation includes ${recipients.length} recipients. ` +
        "Verify the complete bulk recipient list before submission.",
    );
  }

  if (award.eligibility) {
    warnings.push(`Eligibility reminder: ${award.eligibility}`);
  }

  return warnings;
}

function getNarrativeCapitalizationWarning(narrative) {
  const text = cleanText(narrative);
  if (!text) return "";

  const match = text.match(/^(?:["'“‘(]|\[)*\s*([A-Za-z])/u);
  if (!match) return "";

  const firstLetter = match[1];
  if (firstLetter !== firstLetter.toUpperCase()) return "";

  return (
    "Narrative opening: The first word begins with a capital letter. " +
    "Verify that it is a proper noun; otherwise begin with a lowercase word " +
    "so it continues the sentence starter correctly."
  );
}

// -------------------------------------------------------------------------
// Reference normalization
// -------------------------------------------------------------------------

function normalizeReference(bootstrap) {
  const source = bootstrap || {};
  const serviceAwards = source.serviceAwards || {};
  const serviceReference = source.serviceReference || {};
  const organizations = serviceReference.organizations || {};
  const choices = serviceReference.choices || {};
  const limits = Object.assign({}, DEFAULT_LIMITS, source.limits || {});
  const minimumUnitRecipients = Math.max(
    1,
    Number(source.rules && source.rules.minimumUnitRecipients) || 4,
  );
  const maximumServiceIndividualRecipients = Math.max(
    1,
    Number(source.rules && source.rules.maximumServiceIndividualRecipients) ||
      limits.serviceIndividualRecipients,
  );
  const maximumServiceUnitRecipients = Array.from(source.roster || []).length;

  return {
    definitions: [
      ...Array.from(serviceAwards.individual || []),
      ...Array.from(serviceAwards.unit || []),
    ],
    roster: Array.from(source.roster || []),
    organizations,
    choices,
    limits,
    rankPrecedence: Array.from(source.rankPrecedence || []),
    minimumUnitRecipients,
    maximumServiceIndividualRecipients,
    maximumServiceUnitRecipients,
  };
}

// -------------------------------------------------------------------------
// General and field validation
// -------------------------------------------------------------------------

function validateGeneralInputIntegrity(source, limits) {
  const recipients = Array.isArray(source.recipients) ? source.recipients : [];
  const checks = [
    validateTextLength(
      "Service award selection length",
      source.awardId,
      limits.awardSelection,
      "Service award selection",
    ),
    validateTextLength(
      "Citation narrative length",
      source.narrative,
      limits.narrative,
      "Citation narrative",
    ),
  ];

  recipients.forEach((recipient, index) => {
    checks.push(
      validateTextLength(
        `Recipient ${index + 1} length`,
        recipient,
        limits.rosterSelection,
        `Recipient ${index + 1}`,
      ),
    );
  });

  return checks;
}

function validateAndNormalizeFields(rawFields, award, context, checks) {
  const source = rawFields || {};
  const fields = {};

  (award.fields || []).forEach((field) => {
    if (!isServiceFieldActive(field, source)) return;

    const rawValue = source[field.key];
    const value = cleanText(rawValue);
    const allowedValues = allowedFieldValues(field, context);

    appendFieldChecks(
      field,
      rawValue,
      value,
      allowedValues,
      context.limits,
      checks,
    );
    fields[field.key] = normalizeFieldValue(field, value, allowedValues.values);
  });

  return fields;
}

function isServiceFieldActive(field, source) {
  const condition = field && field.visibleWhen;
  if (!condition) return true;

  return (
    normalizeLookupValue(source && source[condition.field]) ===
    normalizeLookupValue(condition.equals)
  );
}

function appendFieldChecks(
  field,
  rawValue,
  value,
  allowedValues,
  limits,
  checks,
) {
  checks.push(
    validateTextLength(
      `${field.label} length`,
      rawValue,
      fieldMaximumLength(field, limits),
      field.label,
    ),
  );
  checks.push(
    check(
      field.label,
      field.required === false || Boolean(value),
      `${field.label} is required.`,
    ),
  );

  if (isControlledField(field)) {
    checks.push(validateControlledField(field, value, allowedValues));
  } else if (!["text", "organization"].includes(field.component)) {
    checks.push(
      check(
        `${field.label} configuration`,
        false,
        `The ${field.label} field has an unsupported configuration.`,
      ),
    );
  }
}

function isControlledField(field) {
  return CONTROLLED_FIELD_COMPONENTS.includes(field.component);
}

function validateControlledField(field, value, allowedValues) {
  const approvedValue = findCanonicalValue(value, allowedValues.values);

  return check(
    `${field.label} uses an approved value`,
    allowedValues.validSource && (!value || Boolean(approvedValue)),
    allowedValues.validSource
      ? `Select ${field.label} from the provided options.`
      : `The options for ${field.label} are unavailable.`,
  );
}

function normalizeFieldValue(field, value, allowedValues) {
  if (field.component === "organization") {
    return findCanonicalValue(value, allowedValues) || value;
  }

  return isControlledField(field)
    ? findCanonicalValue(value, allowedValues) || value
    : value;
}

function fieldMaximumLength(field, limits) {
  if (field.component === "organization") return limits.organization;
  if (field.component === "select") return limits.choice;
  if (field.component === "month") return limits.month;
  if (field.component === "year") return limits.year;
  if (field.key === "role") return limits.role;
  return limits.serviceField;
}

function validateTextLength(label, value, maximumLength, fieldName) {
  const maximum = Number(maximumLength);
  const text = cleanText(value);
  const validMaximum = Number.isFinite(maximum) && maximum >= 0;

  return check(
    label,
    !validMaximum || text.length <= maximum,
    `${fieldName} exceeds the ${maximum}-character limit.`,
  );
}

function checkBbcodeSafety(rawFields, awardFields, rawNarrative) {
  const fields = (awardFields || []).map((field) => ({
    label: field.label,
    value: rawFields && rawFields[field.key],
  }));

  fields.push({
    label: "Citation narrative",
    value: rawNarrative,
  });

  const unsafeLabels = fields
    .filter((field) => {
      const text = String(field.value || "");
      return text.includes("[") || text.includes("]");
    })
    .map((field) => field.label);

  return check(
    "Forum BBCode safety",
    unsafeLabels.length === 0,
    unsafeLabels.length
      ? `Remove square brackets [ or ] from: ${unsafeLabels.join(", ")}.`
      : "",
  );
}

// -------------------------------------------------------------------------
// Recipient validation
// -------------------------------------------------------------------------

function validateAndResolveRecipients(rawRecipients, award, context, checks) {
  const selectedNames = normalizeRecipientSelections(rawRecipients);
  const normalizedNames = selectedNames.map(normalizeLookupValue);
  const recipients = resolveRosterMembers(normalizedNames, context.roster);

  appendRecipientChecks(
    selectedNames,
    normalizedNames,
    recipients,
    award,
    context,
    checks,
  );

  return sortRecipients(recipients, context.rankPrecedence);
}

function normalizeRecipientSelections(rawRecipients) {
  return (Array.isArray(rawRecipients) ? rawRecipients : [])
    .map(cleanText)
    .filter(Boolean);
}

function resolveRosterMembers(normalizedNames, roster) {
  const rosterMap = new Map(
    roster.map((person) => [normalizeLookupValue(person.dropdownName), person]),
  );

  return normalizedNames.map((name) => rosterMap.get(name)).filter(Boolean);
}

function appendRecipientChecks(
  selectedNames,
  normalizedNames,
  recipients,
  award,
  context,
  checks,
) {
  const uniqueNames = new Set(normalizedNames);

  checks.push(
    check(
      "Recipient selected",
      selectedNames.length > 0,
      "Select at least one roster member.",
    ),
  );
  checks.push(
    check(
      "No duplicate recipients",
      selectedNames.length > 0 && uniqueNames.size === selectedNames.length,
      "Remove duplicate recipient selections.",
    ),
  );
  checks.push(
    check(
      "Every recipient matches the roster",
      selectedNames.length > 0 && recipients.length === selectedNames.length,
      "Replace any recipient who no longer matches the eligible roster.",
    ),
  );

  appendRecipientScopeCheck(
    selectedNames.length,
    recipients.length,
    award,
    context,
    checks,
  );
}

function appendRecipientScopeCheck(
  selectedCount,
  resolvedCount,
  award,
  context,
  checks,
) {
  if (award.scope === "individual") {
    checks.push(
      check(
        "Service Medal recipient limit observed",
        selectedCount >= 1 &&
          selectedCount <= context.maximumServiceIndividualRecipients &&
          resolvedCount === selectedCount,
        `Select 1–${context.maximumServiceIndividualRecipients} recipients.`,
      ),
    );
  }

  if (award.scope === "unit") {
    const maximum = context.maximumServiceUnitRecipients;
    checks.push(
      check(
        "Service Unit recipient limit observed",
        selectedCount >= context.minimumUnitRecipients &&
          selectedCount <= maximum &&
          resolvedCount === selectedCount,
        `Select at least ${context.minimumUnitRecipients} recipients and no more than ` +
          `the ${maximum} members in the eligible roster.`,
      ),
    );
  }
}

// -------------------------------------------------------------------------
// Award-specific relationships and service periods
// -------------------------------------------------------------------------

function validateFieldRelationships(fields, award, checks) {
  if (
    award.id === "service_joint_service_commendation_medal" &&
    fields.benefitedCompany &&
    fields.assignedCompany
  ) {
    checks.push(
      check(
        "Companies are different",
        normalizeLookupValue(fields.benefitedCompany) !==
          normalizeLookupValue(fields.assignedCompany),
        "Select different benefited and assigned companies.",
      ),
    );
  }
}

function validateServicePeriod(fields, award, checks) {
  if (!awardHasServicePeriod(award)) {
    return;
  }

  const start = parseServiceMonth(fields.startMonth, fields.startYear);
  const end = parseServiceMonth(fields.endMonth, fields.endYear);
  const now = new Date();
  const currentMonth = Date.UTC(now.getFullYear(), now.getMonth(), 1);
  const complete = Boolean(start && end);

  checks.push(
    check(
      "Service period is valid",
      complete && start.time <= end.time,
      "Select a complete service period whose start month is not after its end month.",
    ),
  );
  checks.push(
    check(
      "Service period is not in the future",
      complete && end.time <= currentMonth,
      "The service period cannot end in a future month.",
    ),
  );
}

function awardHasServicePeriod(award) {
  const fieldKeys = new Set((award.fields || []).map((field) => field.key));
  return ["startMonth", "startYear", "endMonth", "endYear"].some((key) =>
    fieldKeys.has(key),
  );
}

function parseServiceMonth(month, year) {
  const monthIndex = SERVICE_MONTHS.indexOf(String(month || ""));
  const numericYear = Number(year);
  const currentYear = new Date().getFullYear();

  if (
    monthIndex < 0 ||
    !/^\d{4}$/.test(String(year || "")) ||
    !Number.isInteger(numericYear) ||
    numericYear < 2010 ||
    numericYear > currentYear
  ) {
    return null;
  }

  return {
    monthIndex,
    year: numericYear,
    time: Date.UTC(numericYear, monthIndex, 1),
  };
}

// -------------------------------------------------------------------------
// Controlled values and templates
// -------------------------------------------------------------------------

function allowedFieldValues(field, context) {
  if (field.component === "organization") {
    return createAllowedValues(context.organizations[field.optionsSource]);
  }

  if (field.component === "select") {
    return createAllowedValues(context.choices[field.optionsSource]);
  }

  if (field.component === "month") {
    return { validSource: true, values: Array.from(SERVICE_MONTHS) };
  }

  if (field.component === "year") {
    return { validSource: true, values: buildServiceYears() };
  }

  return { validSource: true, values: [] };
}

function createAllowedValues(values) {
  return {
    validSource: Array.isArray(values),
    values: Array.from(values || []),
  };
}

function buildServiceYears() {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: Math.max(0, currentYear - 2009) }, (_, index) =>
    String(currentYear - index),
  );
}

function findCanonicalValue(value, allowedValues) {
  const lookup = normalizeLookupValue(value);

  if (!lookup) {
    return "";
  }

  return (
    Array.from(allowedValues || []).find(
      (candidate) => normalizeLookupValue(candidate) === lookup,
    ) || ""
  );
}

function normalizeLookupValue(value) {
  return cleanText(value).toLowerCase();
}

function prepareAwardTemplate(award, fields, recipients) {
  const values = buildTemplateValues(award, fields, recipients);
  const templateText = `${award.openingTemplate || ""} ${award.endingTemplate || ""}`;
  const requiredTokens = findTemplateTokens(templateText);
  const missingValues = requiredTokens.filter(
    (key) => !hasTemplateValue(values, key),
  );
  const opening = fillTemplate(award.openingTemplate, values);
  const closing = fillTemplate(award.endingTemplate, values);
  const unresolvedTokens = findTemplateTokens(`${opening} ${closing}`);
  const incompleteTokens = Array.from(
    new Set([...missingValues, ...unresolvedTokens]),
  );

  return {
    opening,
    closing,
    check: check(
      "Award template is complete",
      Boolean(opening) && Boolean(closing) && incompleteTokens.length === 0,
      templateFailureMessage(incompleteTokens),
    ),
  };
}

function hasTemplateValue(values, key) {
  return (
    Object.prototype.hasOwnProperty.call(values, key) &&
    Boolean(cleanText(values[key]))
  );
}

function templateFailureMessage(incompleteTokens) {
  return incompleteTokens.length
    ? `The award template contains unresolved fields: ${incompleteTokens.join(", ")}.`
    : "The selected award template is incomplete.";
}

function buildTemplateValues(award, fields, recipients) {
  const values = {};

  Object.entries(fields || {}).forEach(([key, value]) => {
    values[toTemplateKey(key)] = value;
  });

  const fullNames = Array.from(recipients || []).map(recipientName);

  values.FULL_NAME = formatRecipientList(fullNames);
  values.FULL_NAME_POSSESSIVE = formatJointPossessiveRecipientList(fullNames);
  values.SERVICE_PERIOD = buildServicePeriod(fields);
  appendDerivedTemplateValues(values, award, fields);

  return values;
}

function appendDerivedTemplateValues(values, award, fields) {
  if (award.id === "service_soldiers_medal") {
    appendSoldiersMedalTemplateValues(values, fields);
  }

  if (award.id === "service_defense_superior_service_medal") {
    appendSuperiorServiceTemplateValues(values, fields);
  }
}

function appendSoldiersMedalTemplateValues(values, fields) {
  const type = normalizeLookupValue(fields.recognitionType);
  const noun = type === "contributions" ? "contributions" : "service";

  values.SOLDIERS_OPENING_PHRASE = `multiple, significant and distinguished meritorious ${noun}`;
  values.SOLDIERS_CLOSING_PHRASE = `exceptionally meritorious ${noun}`;
}

function appendSuperiorServiceTemplateValues(values, fields) {
  const operations =
    normalizeLookupValue(fields.leadershipContext) === "operations";

  values.LEADERSHIP_CONTEXT_PHRASE = operations
    ? "operations"
    : "a secondary billet";
  values.LEADERSHIP_ASSIGNMENT = operations
    ? fields.operationsLeadershipAssignment
    : fields.secondaryLeadershipBillet;
  values.CREDITED_ELEMENT_OR_OPERATIONS_AO = operations
    ? fields.creditedOperationsAo
    : fields.creditedDepartmentOrElement;
}

function buildServicePeriod(fields) {
  if (
    !fields.startMonth ||
    !fields.startYear ||
    !fields.endMonth ||
    !fields.endYear
  ) {
    return "";
  }

  return `${fields.startMonth} ${fields.startYear} to ${fields.endMonth} ${fields.endYear}`;
}

function toTemplateKey(key) {
  return String(key || "")
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .toUpperCase();
}

function fillTemplate(template, values) {
  const replacements = values || {};

  return String(template || "")
    .replace(/\{([A-Z_]+)\}/g, (placeholder, key) => {
      if (!Object.prototype.hasOwnProperty.call(replacements, key)) {
        return placeholder;
      }

      const value = replacements[key];
      return value === undefined || value === null ? "" : String(value);
    })
    .replace(/\s+/g, " ")
    .trim();
}

function findTemplateTokens(value) {
  const tokens = new Set();
  const expression = /\{([A-Z_]+)\}/g;
  const text = String(value || "");
  let match;

  while ((match = expression.exec(text)) !== null) {
    tokens.add(match[1]);
  }

  return Array.from(tokens);
}

// -------------------------------------------------------------------------
// Text and output helpers
// -------------------------------------------------------------------------

function cleanText(value) {
  return String(value === undefined || value === null ? "" : value)
    .split("\u0000")
    .join("")
    .trim();
}

function recipientName(person) {
  return `${person.rankLong || ""} ${person.firstName || ""} ${person.lastName || ""}`
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeServiceNarrativeNames(narrative, recipients) {
  const replacements = [];
  const people = Array.from(recipients || []);
  const lastNameCounts = countRecipientLastNames(people);
  let text = String(narrative || "");

  people.forEach((recipient, index) => {
    const lastNameKey = normalizedLastNameKey(recipient.lastName);
    const includeLastNameOnly = lastNameCounts.get(lastNameKey) === 1;
    const token = `§§${index}§§`;
    let updated = replaceServiceRecipientPatterns(
      text,
      buildServiceRecipientMentionPatterns(recipient),
      token,
      "gi",
    );

    if (includeLastNameOnly) {
      updated = replaceServiceRecipientPatterns(
        updated,
        [
          withOptionalServiceRecipientInitials(
            namePattern(recipient.lastName),
            recipient,
          ),
        ].filter(Boolean),
        token,
        "g",
      );
    }

    if (updated !== text) {
      replacements.push({ token, value: serviceNarrativeName(recipient) });
      text = updated;
    }
  });

  replacements.forEach(({ token, value }) => {
    text = text.split(token).join(value);
  });

  return text;
}

function replaceServiceRecipientPatterns(text, patterns, token, flags) {
  if (!patterns.length) return text;

  const expression = new RegExp(
    `(^|[^A-Za-z0-9])(?:${patterns.join("|")})(?=$|[^A-Za-z0-9])`,
    flags,
  );

  return text.replace(expression, (_match, prefix) => `${prefix}${token}`);
}

function serviceNarrativeName(recipient) {
  return [recipient.rankLong, recipient.lastName]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function countRecipientLastNames(recipients) {
  return Array.from(recipients || []).reduce((counts, recipient) => {
    const key = normalizedLastNameKey(recipient.lastName);

    if (key) counts.set(key, (counts.get(key) || 0) + 1);
    return counts;
  }, new Map());
}

function normalizedLastNameKey(value) {
  return cleanText(value).toLowerCase().replace(/[’']/gu, "'");
}

function buildServiceRecipientMentionPatterns(recipient) {
  const rank = namePattern(recipient.rankAbbreviation);
  const rankLong = namePattern(recipient.rankLong);
  const first = namePattern(recipient.firstName);
  const last = namePattern(recipient.lastName);
  const username = namePattern(extractRosterUsername(recipient.dropdownName));
  const patterns = [
    joinNamePattern(rankLong, first, last),
    joinNamePattern(rankLong, last),
    rank && first && last ? `${rank}\\.?\\s+${first}\\s+${last}` : "",
    rank && last ? `${rank}\\.?\\s+${last}` : "",
    joinNamePattern(first, last),
    username,
  ];

  return Array.from(
    new Set(
      patterns
        .filter(Boolean)
        .map((pattern) =>
          withOptionalServiceRecipientInitials(pattern, recipient),
        ),
    ),
  ).sort((left, right) => {
    return right.length - left.length;
  });
}

function withOptionalServiceRecipientInitials(pattern, recipient) {
  if (!pattern) return "";

  const initialsPattern = matchingServiceRecipientInitialsPattern(
    recipient && recipient.firstName,
  );

  return initialsPattern
    ? `${pattern}(?:(?:,\\s*|\\s+|\\.\\s*)(?:${initialsPattern}))?`
    : pattern;
}

function matchingServiceRecipientInitialsPattern(givenNames) {
  const initials = cleanText(givenNames)
    .split(/\s+/u)
    .map((part) => part.match(/[A-Za-z]/u)?.[0] || "")
    .filter(Boolean);
  const sequences = [];

  for (let count = initials.length; count >= 1; count -= 1) {
    sequences.push(
      initials
        .slice(0, count)
        .map((initial) => `${caseFlexibleInitialPattern(initial)}\\.?`)
        .join("\\s*"),
    );
  }

  return sequences.join("|");
}

function caseFlexibleInitialPattern(value) {
  const character = String(value || "").charAt(0);
  const lower = character.toLowerCase();
  const upper = character.toUpperCase();

  return lower && lower !== upper
    ? `[${lower}${upper}]`
    : escapeRegex(character);
}

function joinNamePattern() {
  return Array.prototype.slice.call(arguments).filter(Boolean).join("\\s+");
}

function namePattern(value) {
  return cleanText(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.split(/['’]/u).map(escapeRegex).join("['’]"))
    .join("\\s+");
}

function extractRosterUsername(dropdownName) {
  const text = cleanText(dropdownName);
  const firstSpace = text.search(/\s/);
  return firstSpace >= 0 ? text.slice(firstSpace + 1).trim() : text;
}

function escapeRegex(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatRecipientList(names) {
  const values = Array.from(names || []).filter(Boolean);

  if (values.length <= 1) return values[0] || "";
  if (values.length === 2) return `${values[0]} and ${values[1]}`;

  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
}

function formatJointPossessiveRecipientList(names) {
  const values = Array.from(names || []).filter(Boolean);

  if (!values.length) return "";

  return formatRecipientList(
    values.map((name, index) =>
      index === values.length - 1 ? toPossessive(name) : name,
    ),
  );
}

function toPossessive(name) {
  return /s$/i.test(name) ? `${name}'` : `${name}'s`;
}

function sortRecipients(recipients, rankPrecedence) {
  const rankOrder = new Map(
    Array.from(rankPrecedence || []).map((rank, index) => [rank, index]),
  );

  return Array.from(recipients || []).sort((left, right) => {
    const leftRank =
      rankOrder.get(left.rankAbbreviation) ?? Number.MAX_SAFE_INTEGER;
    const rightRank =
      rankOrder.get(right.rankAbbreviation) ?? Number.MAX_SAFE_INTEGER;

    return (
      leftRank - rightRank ||
      cleanText(left.lastName).localeCompare(cleanText(right.lastName)) ||
      cleanText(left.firstName).localeCompare(cleanText(right.firstName))
    );
  });
}

function countApproximateSentences(value) {
  let text = cleanText(value);

  if (!text) {
    return 0;
  }

  text = protectSentencePeriods(text);
  const punctuation = text.match(/[.!?]+(?=["'’”)]*(?:\s|$))/g);
  return punctuation ? punctuation.length : 0;
}

function protectSentencePeriods(value) {
  const periodToken = "\uE000";
  const protect = (match) => match.replace(/\./g, periodToken);
  let text = String(value || "");

  text = text.replace(/\b(?:[A-Za-z]\.){2,}/gu, protect);
  text = text.replace(/\b(?:e\.g|i\.e)\./giu, protect);
  text = text.replace(
    new RegExp(`\\b(?:${SENTENCE_ABBREVIATIONS.join("|")})\\.`, "gi"),
    protect,
  );
  text = text.replace(/\b(?:Dept|No|Mr|Mrs|Ms|Dr|Jr|Sr|St)\./giu, protect);
  text = text.replace(
    /\b([A-Z])\.(?=\s+[A-Z][A-Za-z'’.-]+)/gu,
    (_match, initial) => {
      return `${initial}${periodToken}`;
    },
  );
  text = text.replace(/(\d)\.(\d)/g, `$1${periodToken}$2`);
  return text;
}

function countWords(value) {
  const text = cleanText(value);
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

function check(label, passed, failureMessage) {
  return {
    label,
    status: passed ? "PASS" : "FAIL",
    message: passed ? "" : failureMessage,
  };
}

function finishGeneration(options) {
  const award = options.award;
  const recipients = Array.from(options.recipients || []);
  const names = recipients.map(recipientName);
  const title = buildTicketTitle(award, options.fields, recipients);
  const bbcode = options.ready
    ? buildBbcode(award, recipients, options.citation)
    : "";

  return {
    ready: options.ready,
    statusText: options.ready
      ? "READY FOR FINAL REVIEW"
      : "NOT READY — COMPLETE OR CORRECT THE FAILED CHECKS",
    award: award || { name: "Service Award", imageUrl: "" },
    recipientNames: names,
    citation: options.citation,
    ticketTitle: title,
    bbcode,
    checks: options.checks,
    warnings: options.warnings,
    sentenceCount: countApproximateSentences(options.narrative),
    wordCount: countWords(options.narrative),
  };
}

function buildTicketTitle(award, fields, recipients) {
  if (!award || !recipients.length) {
    return "";
  }

  const organization = resolveTicketTitleOrganization(award, fields);
  const recipientLabel = formatTicketRecipient(recipients);

  return [
    "Medal Recommendation",
    organization,
    award.abbreviation,
    recipientLabel,
  ]
    .filter(Boolean)
    .join(" | ");
}

function resolveTicketTitleOrganization(award, fields) {
  const values = fields || {};

  if (award.id === "service_defense_superior_service_medal") {
    return values.leadershipContext === "operations"
      ? cleanText(values.creditedOperationsAo)
      : cleanText(values.creditedDepartmentOrElement);
  }

  const fieldKeys = SERVICE_TICKET_TITLE_FIELD_KEYS[award.id] || [];

  for (const fieldKey of fieldKeys) {
    const value = cleanText(values[fieldKey]);

    if (value) {
      return value;
    }
  }

  return "";
}

function formatTicketRecipient(recipients) {
  if (recipients.length > 1) {
    return "Multiple";
  }

  const recipient = recipients[0] || {};
  const rank = cleanText(recipient.rankAbbreviation);
  const lastName = cleanText(recipient.lastName);
  const firstInitial = cleanText(recipient.firstName).charAt(0);

  return [rank, lastName, firstInitial].filter(Boolean).join(".");
}

function buildBbcode(award, recipients, citation) {
  const image = award.imageUrl ? `[IMG]${award.imageUrl}[/IMG]\n` : "";
  const linkedRecipients = recipients.map(buildRecipientLink).join("\n");

  return `[CENTER][B]${award.name}[/B]\n${image}${linkedRecipients}\n\n${citation}[/CENTER]`;
}

function buildRecipientLink(person) {
  return `[URL=${person.milpacsUrl}]${recipientName(person)}[/URL]`;
}

export { generate, countApproximateSentences, countWords };
