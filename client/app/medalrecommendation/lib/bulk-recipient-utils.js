export function cleanBulkText(value) {
  return String(value ?? "")
    .replace(/\s+/gu, " ")
    .trim();
}

export function normalizeBulkLookup(value) {
  return cleanBulkText(value)
    .toLowerCase()
    .replace(/[.,'’`\-_/\\()[\]{}:;]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

export function getPersonBillets(person) {
  if (Array.isArray(person?.billets) && person.billets.length) {
    return person.billets.map(cleanBulkText).filter(Boolean);
  }

  return [
    cleanBulkText(person?.primaryBillet),
    ...(Array.isArray(person?.secondaryBillets)
      ? person.secondaryBillets.map(cleanBulkText)
      : []),
  ].filter(Boolean);
}

export function formatBulkPersonName(person) {
  return cleanBulkText(
    `${person?.rankLong ?? person?.rankAbbreviation ?? ""} ${person?.firstName ?? ""} ${person?.lastName ?? ""}`,
  );
}

export function formatBilletSummary(person) {
  const billets = getPersonBillets(person);

  if (!billets.length) {
    return "Billet information unavailable";
  }

  if (billets.length === 1) {
    return billets[0];
  }

  return `${billets[0]} • Secondary: ${billets.slice(1).join(", ")}`;
}

function recipientMatchKeys(person) {
  const firstName = cleanBulkText(person?.firstName);
  const lastName = cleanBulkText(person?.lastName);
  const fullName = cleanBulkText(
    person?.fullName || `${firstName} ${lastName}`,
  );
  const rankAbbreviation = cleanBulkText(person?.rankAbbreviation);
  const rankLong = cleanBulkText(person?.rankLong);
  const rosterName = cleanBulkText(person?.rosterName);
  const dropdownName = cleanBulkText(person?.dropdownName);

  return [
    dropdownName,
    rosterName,
    fullName,
    `${firstName} ${lastName}`,
    `${lastName} ${firstName}`,
    `${rankAbbreviation} ${fullName}`,
    `${rankLong} ${fullName}`,
    `${rankAbbreviation} ${firstName} ${lastName}`,
    `${rankLong} ${firstName} ${lastName}`,
  ]
    .map(normalizeBulkLookup)
    .filter(Boolean);
}

export function buildRecipientMatchIndex(roster) {
  const index = new Map();

  (roster ?? []).forEach((person) => {
    const dropdownName = cleanBulkText(person?.dropdownName);
    if (!dropdownName) {
      return;
    }

    recipientMatchKeys(person).forEach((key) => {
      if (!index.has(key)) {
        index.set(key, new Set());
      }

      index.get(key).add(dropdownName);
    });
  });

  return index;
}

export function resolveRecipientName(value, roster, matchIndex) {
  const normalized = normalizeBulkLookup(value);
  if (!normalized) {
    return null;
  }

  const index = matchIndex ?? buildRecipientMatchIndex(roster);
  const matches = index.get(normalized);

  if (!matches || matches.size !== 1) {
    return null;
  }

  return Array.from(matches)[0];
}

export function matchPastedRecipients(text, roster, alreadySelected = []) {
  const matchIndex = buildRecipientMatchIndex(roster);
  const selected = new Set(alreadySelected);
  const matched = [];
  const unmatched = [];
  const duplicates = [];

  String(text ?? "")
    .split(/\r?\n/u)
    .map(cleanBulkText)
    .filter(Boolean)
    .forEach((line) => {
      const resolved = resolveRecipientName(line, roster, matchIndex);

      if (!resolved) {
        unmatched.push(line);
        return;
      }

      if (selected.has(resolved)) {
        duplicates.push(line);
        return;
      }

      selected.add(resolved);
      matched.push(resolved);
    });

  return {
    matched,
    unmatched,
    duplicates,
  };
}

export function buildOrganizationOptions(roster) {
  const organizations = new Map();

  (roster ?? []).forEach((person) => {
    getPersonBillets(person).forEach((billet) => {
      const normalized = normalizeBulkLookup(billet);
      if (normalized && !organizations.has(normalized)) {
        organizations.set(normalized, billet);
      }
    });
  });

  return Array.from(organizations.values()).sort((left, right) =>
    left.localeCompare(right, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );
}

export function filterBulkRoster(roster, search, organization) {
  const normalizedSearch = normalizeBulkLookup(search);
  const normalizedOrganization = normalizeBulkLookup(organization);

  return (roster ?? []).filter((person) => {
    const billets = getPersonBillets(person);
    const searchableText = normalizeBulkLookup(
      [
        person?.dropdownName,
        formatBulkPersonName(person),
        person?.fullName,
        person?.rosterName,
        ...billets,
      ]
        .filter(Boolean)
        .join(" "),
    );

    const billetText = normalizeBulkLookup(billets.join(" "));

    const matchesSearch =
      !normalizedSearch || searchableText.includes(normalizedSearch);
    const matchesOrganization =
      !normalizedOrganization || billetText.includes(normalizedOrganization);

    return matchesSearch && matchesOrganization;
  });
}

export function resolveExistingRecipients(recipients, roster) {
  const matchIndex = buildRecipientMatchIndex(roster);
  const matched = [];
  const unmatched = [];
  const seen = new Set();

  (recipients ?? []).forEach((recipient) => {
    const cleanRecipient = cleanBulkText(recipient);
    if (!cleanRecipient) {
      return;
    }

    const resolved = resolveRecipientName(cleanRecipient, roster, matchIndex);
    if (!resolved) {
      unmatched.push(cleanRecipient);
      return;
    }

    if (!seen.has(resolved)) {
      seen.add(resolved);
      matched.push(resolved);
    }
  });

  return { matched, unmatched };
}

export function orderSelectedRecipients(selectedNames, roster) {
  const selected = new Set(selectedNames ?? []);
  const ordered = [];

  (roster ?? []).forEach((person) => {
    const dropdownName = cleanBulkText(person?.dropdownName);
    if (selected.has(dropdownName)) {
      ordered.push(dropdownName);
      selected.delete(dropdownName);
    }
  });

  return [...ordered, ...Array.from(selected)];
}
