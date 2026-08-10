/**
 * Citation generation and validation engine.
 *
 * Recommendation payloads and generated output remain in this application.
 */

"use strict";

    const DEFAULT_LIMITS = Object.freeze({
      operationName: 120,
      operationDate: 10,
      location: 160,
      role: 120,
      unitName: 160,
      narrative: 2100,
      awardName: 200,
      rosterSelection: 200,
      actionChoice: 80,
      unitRecipients: 20,
    });

    const NARRATIVE_SOFT_CHARACTER_LIMIT = 1400;

    function generateIndividual(payload, reference) {
      const context = normalizeReference(reference);
      const integrityChecks = validateIndividualInputIntegrity(payload, context.limits);
      const data = sanitizeIndividualPayload(payload, context.limits);
      const award = context.individualAwards.find((item) => item.name === data.awardName) || null;
      const rosterMap = new Map(context.roster.map((item) => [item.dropdownName, item]));
      const recipients = data.recipients.map((name) => rosterMap.get(name)).filter(Boolean);

      return buildIndividualSubmission(
        data,
        award,
        recipients,
        context.rules,
        context.rankPrecedence,
        integrityChecks
      );
    }

    function generateUnit(payload, reference) {
      const context = normalizeReference(reference);
      const integrityChecks = validateUnitInputIntegrity(payload, context.limits);
      const data = sanitizeUnitPayload(payload, context.limits);
      const award = context.unitAwards.find((item) => item.name === data.awardName) || null;
      const rosterMap = new Map(context.roster.map((item) => [item.dropdownName, item]));
      const recipients = data.recipients.map((name) => rosterMap.get(name)).filter(Boolean);

      return buildUnitSubmission(
        data,
        award,
        recipients,
        context.rules,
        context.rankPrecedence,
        integrityChecks
      );
    }

    function normalizeReference(reference) {
      const source = reference || {};
      const limits = Object.assign({}, DEFAULT_LIMITS, source.limits || {});
      const rules = Object.assign(
        {
          minimumUnitRecipients: 4,
          maximumUnitRecipients: limits.unitRecipients,
          maximumOperationIndividualRecipients: 20,
        },
        source.rules || {}
      );

      return {
        limits,
        rules,
        rankPrecedence: Array.from(source.rankPrecedence || []),
        individualAwards: Array.from(source.individualAwards || []),
        unitAwards: Array.from(source.unitAwards || []),
        roster: Array.from(source.roster || []),
      };
    }

    function sanitizeIndividualPayload(payload, limits) {
      const source = payload || {};
      const recipients = getIndividualRecipientSelections(source).map((value) =>
        cleanText(value, limits.rosterSelection)
      );

      return {
        operationName: cleanText(source.operationName, limits.operationName),
        operationDate: cleanIsoDate(source.operationDate),
        location: cleanText(source.location, limits.location),
        role: cleanText(source.role, limits.role),
        awardName: cleanText(source.awardName, limits.awardName),
        recipients,
        actionScope: cleanText(source.actionScope, limits.actionChoice),
        actionCharacter: cleanText(source.actionCharacter, limits.actionChoice),
        narrative: cleanText(source.narrative, limits.narrative),
      };
    }

    function getIndividualRecipientSelections(source) {
      if (Array.isArray(source.recipients)) {
        return source.recipients.filter((value) => String(value || '').trim());
      }

      return source.recipient ? [source.recipient] : [];
    }

    function sanitizeUnitPayload(payload, limits) {
      const source = payload || {};
      const maximumRecipients = Math.max(0, Number(limits.unitRecipients) || 0);
      const recipients = Array.isArray(source.recipients)
        ? source.recipients
            .slice(0, maximumRecipients)
            .map((value) => cleanText(value, limits.rosterSelection))
            .filter(Boolean)
        : [];

      return {
        operationName: cleanText(source.operationName, limits.operationName),
        operationDate: cleanIsoDate(source.operationDate),
        location: cleanText(source.location, limits.location),
        unitName: cleanText(source.unitName, limits.unitName),
        awardName: cleanText(source.awardName, limits.awardName),
        actionCharacter: cleanText(source.actionCharacter, limits.actionChoice),
        recipients,
        narrative: cleanText(source.narrative, limits.narrative),
      };
    }

    function cleanText(value, maximumLength) {
      const maximum = Number(maximumLength);
      const text = String(value === undefined || value === null ? '' : value)
        .split('\u0000').join('')
        .trim();

      return Number.isFinite(maximum) && maximum >= 0 ? text.slice(0, maximum) : text;
    }

    function cleanIsoDate(value) {
      const text = cleanText(value, DEFAULT_LIMITS.operationDate);
      return isValidOperationDate(text) ? text : '';
    }

    function isValidOperationDate(value) {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
      if (!match) return false;

      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      const date = new Date(year, month - 1, day);

      if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return false;
      }

      const today = new Date();
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      return date.getTime() <= todayOnly.getTime();
    }

    function validateIndividualInputIntegrity(payload, limits) {
      const source = payload || {};
      const recipients = getIndividualRecipientSelections(source);
      const checks = validateTextLengths([
        ['Operation name length', source.operationName, limits.operationName, 'Operation name'],
        ['Citation location length', source.location, limits.location, 'Citation location'],
        ['Combat element / role length', source.role, limits.role, 'Combat element / role'],
        ['Medal selection length', source.awardName, limits.awardName, 'Medal selection'],
        ['Action scope length', source.actionScope, limits.actionChoice, 'Action scope'],
        [
          'Action character length',
          source.actionCharacter,
          limits.actionChoice,
          'Action character',
        ],
        ['Citation narrative length', source.narrative, limits.narrative, 'Citation narrative'],
      ]);

      recipients.forEach((recipient, index) => {
        checks.push(
          ...validateTextLengths([
            [
              `Recipient ${index + 1} length`,
              recipient,
              limits.rosterSelection,
              `Recipient ${index + 1}`,
            ],
          ])
        );
      });

      return checks;
    }

    function validateUnitInputIntegrity(payload, limits) {
      const source = payload || {};
      const recipients = Array.isArray(source.recipients) ? source.recipients : [];
      const maximumRecipients = Math.max(0, Number(limits.unitRecipients) || 0);
      const checks = validateTextLengths([
        ['Operation name length', source.operationName, limits.operationName, 'Operation name'],
        ['Citation location length', source.location, limits.location, 'Citation location'],
        ['Combat unit name length', source.unitName, limits.unitName, 'Combat unit name'],
        ['Unit award selection length', source.awardName, limits.awardName, 'Unit award selection'],
        [
          'Action character length',
          source.actionCharacter,
          limits.actionChoice,
          'Action character',
        ],
        ['Citation narrative length', source.narrative, limits.narrative, 'Citation narrative'],
      ]);

      recipients.forEach((recipient, index) => {
        checks.push(
          ...validateTextLengths([
            [
              `Recipient ${index + 1} length`,
              recipient,
              limits.rosterSelection,
              `Recipient ${index + 1}`,
            ],
          ])
        );
      });

      checks.push(
        check(
          'Maximum recipient count',
          recipients.length <= maximumRecipients,
          `Select no more than ${maximumRecipients} recipients.`
        )
      );

      return checks;
    }

    function validateTextLengths(fields) {
      return fields.map(([label, value, maximumLength, fieldName]) => {
        const maximum = Number(maximumLength);
        const text = String(value === undefined || value === null ? '' : value)
          .split('\u0000').join('')
          .trim();
        const validMaximum = Number.isFinite(maximum) && maximum >= 0;

        return check(
          label,
          !validMaximum || text.length <= maximum,
          `${fieldName} exceeds the ${maximum}-character limit.`
        );
      });
    }

    /** Citation generation and validation engine. */

    function buildIndividualSubmission(
      data,
      award,
      recipients,
      rules,
      rankPrecedence,
      integrityChecks
    ) {
      const checks = Array.from(integrityChecks || []);
      const selectedCount = data.recipients.length;
      const uniqueNames = new Set(data.recipients);
      const orderedRecipients = sortAwardRecipients(recipients, rankPrecedence);
      const maximumRecipients = Math.max(
        1,
        Number(rules && rules.maximumOperationIndividualRecipients) || 20
      );

      checks.push(
        check('Operation name', Boolean(data.operationName), 'Enter the operation name.')
      );
      checks.push(
        check(
          'Operation date',
          Boolean(data.operationDate),
          "Operation date cannot be in the future. Choose today's date or an earlier date."
        )
      );
      checks.push(
        check('Citation location', Boolean(data.location), 'Enter one citation location.')
      );
      checks.push(check('Combat element / role', Boolean(data.role), 'Enter the recipient role.'));
      checks.push(check('Medal selected', Boolean(award), 'Select a valid medal.'));
      checks.push(
        check('Recipient selected', selectedCount > 0, 'Select at least one roster member.')
      );
      checks.push(
        check(
          'No duplicate recipients',
          selectedCount > 0 && uniqueNames.size === selectedCount,
          'Remove duplicate recipient selections.'
        )
      );
      checks.push(
        check(
          'Every recipient matches the roster',
          selectedCount > 0 && orderedRecipients.length === selectedCount,
          'Replace any recipient who no longer matches the active roster.'
        )
      );
      checks.push(
        check(
          'Operation Medal recipient limit observed',
          selectedCount >= 1 && selectedCount <= maximumRecipients,
          `Select 1–${maximumRecipients} recipients.`
        )
      );

      checks.push(
        checkBbcodeSafeFields([
          {
            label: 'Operation name',
            value: data.operationName,
          },
          {
            label: 'Citation location',
            value: data.location,
          },
          {
            label: 'Combat element / role',
            value: data.role,
          },
          {
            label: 'Citation narrative',
            value: data.narrative,
          },
        ])
      );

      if (award) {
        checks.push(
          checkAllowedChoice(
            'Action scope',
            data.actionScope,
            award.allowedScope,
            award.scopeRequired,
            'Select an allowed action scope.'
          )
        );
        checks.push(
          checkAllowedChoice(
            'Action character',
            data.actionCharacter,
            award.allowedCharacter,
            award.characterRequired,
            'Select an allowed action character.'
          )
        );
      }

      const sentenceCount = countApproximateSentences(data.narrative);
      const wordCount = countWords(data.narrative);
      const minimumSentences = award ? award.minimumSentences : 0;

      checks.push(
        check(
          'Citation narrative',
          Boolean(data.narrative),
          'Write the citation narrative in your own words.'
        )
      );
      checks.push(
        check(
          'Minimum sentence count',
          Boolean(data.narrative) && sentenceCount >= minimumSentences,
          minimumSentences
            ? `Use at least ${minimumSentences} complete narrative sentences.`
            : 'Select a medal to determine the required sentence count.'
        )
      );

      const warnings = [];
      if (award && data.narrative && wordCount < award.minimumSentences * 15) {
        warnings.push(
          `The narrative is only ${wordCount} words. A narrative of approximately ${
            award.minimumSentences * 15
          } words is a useful starting point for this award. Please proofread and expand it as necessary.`
        );
      }


      if (data.narrative.length > NARRATIVE_SOFT_CHARACTER_LIMIT) {
        warnings.push(
          `The narrative is ${data.narrative.length.toLocaleString()} characters. The recommended maximum is 1,400 characters; you can still generate the recommendation, but consider shortening it.`
        );
      }

      if (selectedCount > 1) {
        warnings.push(
          'Multiple recipients for this medal: Verify this is the same action and the citation does not change.'
        );
      }

      if (award) {
        warnings.push(...individualEligibilityWarnings(award));
      }

      const blockingFailure = checks.some((item) => item.status === 'FAIL');
      if (blockingFailure || !award || orderedRecipients.length !== selectedCount) {
        return submissionResult(checks, warnings, sentenceCount, wordCount);
      }

      const operation = normalizeOperationName(data.operationName);
      const formattedDate = formatIsoDateLong(data.operationDate);
      const role = grammarAdjustRole(data.role);
      const normalizedNarrative = normalizeIndividualNarrativeNames(
        data.narrative,
        orderedRecipients
      );
      const openingTemplateName = formatIndividualTemplateName(
        orderedRecipients,
        formalFullName
      );
      const endingTemplateName = formatIndividualTemplateName(
        orderedRecipients,
        formalFullName
      );

      const opening = fillTemplate(award.openingTemplate, {
        ACTION: lowerChoice(data.actionCharacter),
        SCOPE: data.actionScope === 'Single' ? 'a single' : 'multiple',
        ACTION_NOUN: data.actionScope === 'Single' ? 'action' : 'actions',
        ELEMENT: role,
        OPERATION: operation,
        LOCATION: data.location,
        DATE: formattedDate,
        FULLNAME: openingTemplateName,
      });

      const ending = fillTemplate(award.endingTemplate, {
        ACTION: lowerChoice(data.actionCharacter),
        FULLNAME: endingTemplateName,
      });

      const citation = [opening, normalizedNarrative, ending]
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      const ticketTitle = buildIndividualTicketTitle(operation, award, orderedRecipients);
      const recipientBbcode = orderedRecipients
        .map(
          (recipient) =>
            `[URL='${recipient.milpacsUrl}'][B]${formalFullName(recipient)}[/B][/URL]`
        )
        .join('\n');

      const bbcode = [
        '[CENTER][B]' + award.name + '[/B]',
        `[URL='${award.filePageUrl}'][IMG]${award.imageUrl}[/IMG][/URL]`,
        recipientBbcode,
        '',
        citation + '[/CENTER]',
      ].join('\n');

      return submissionResult(checks, warnings, sentenceCount, wordCount, {
        ready: true,
        ticketTitle,
        bbcode,
        citation,
        award,
        recipientNames: orderedRecipients.map(formalFullName),
      });
    }

    function buildUnitSubmission(data, award, recipients, rules, rankPrecedence, integrityChecks) {
      const checks = Array.from(integrityChecks || []);
      const orderedRecipients = sortAwardRecipients(recipients, rankPrecedence);
      const selectedCount = data.recipients.length;
      const uniqueNames = Array.from(new Set(data.recipients));
      const missingRosterCount = selectedCount - orderedRecipients.length;

      checks.push(
        check('Operation name', Boolean(data.operationName), 'Enter the operation name.')
      );
      checks.push(
        check(
          'Operation date',
          Boolean(data.operationDate),
          "Operation date cannot be in the future. Choose today's date or an earlier date."
        )
      );
      checks.push(
        check('Citation location', Boolean(data.location), 'Enter one citation location.')
      );
      checks.push(
        check('Combat unit name', Boolean(data.unitName), 'Enter the shared combat-unit name.')
      );
      checks.push(
        check('Unit award selected', Boolean(award), 'Select a valid operation unit award.')
      );

      checks.push(
        checkBbcodeSafeFields([
          {
            label: 'Operation name',
            value: data.operationName,
          },
          {
            label: 'Citation location',
            value: data.location,
          },
          {
            label: 'Combat unit name',
            value: data.unitName,
          },
          {
            label: 'Citation narrative',
            value: data.narrative,
          },
        ])
      );

      checks.push(
        check(
          'Minimum four recipients',
          orderedRecipients.length >= rules.minimumUnitRecipients,
          `Select at least ${rules.minimumUnitRecipients} active combat-roster members.`
        )
      );
      checks.push(
        check(
          'No duplicate recipients',
          selectedCount >= rules.minimumUnitRecipients && uniqueNames.length === selectedCount,
          'Remove duplicate recipient selections.'
        )
      );
      checks.push(
        check(
          'Every recipient matches the roster',
          selectedCount >= rules.minimumUnitRecipients && missingRosterCount === 0,
          'Replace any recipient who no longer matches the active roster.'
        )
      );

      if (award) {
        checks.push(
          checkAllowedChoice(
            'Action character',
            data.actionCharacter,
            award.allowedCharacter,
            award.characterRequired,
            'Select an allowed action character.'
          )
        );
      }

      const sentenceCount = countApproximateSentences(data.narrative);
      const wordCount = countWords(data.narrative);
      const minimumSentences = award ? award.minimumSentences : 0;

      checks.push(
        check(
          'Citation narrative',
          Boolean(data.narrative),
          'Write the shared unit citation in your own words.'
        )
      );
      checks.push(
        check(
          'Minimum sentence count',
          Boolean(data.narrative) && sentenceCount >= minimumSentences,
          minimumSentences
            ? `Use at least ${minimumSentences} complete narrative sentences.`
            : 'Select a unit award to determine the required sentence count.'
        )
      );

      const namedRecipients = findRecipientMentions(data.narrative, orderedRecipients);
      checks.push(
        check(
          'Citation uses unit name, not recipient names',
          namedRecipients.length === 0,
          namedRecipients.length
            ? `Remove individual recipient references: ${namedRecipients.join(', ')}.`
            : 'Use the shared unit name in the citation.'
        )
      );

      const warnings = [];
      if (award && data.narrative && wordCount < award.minimumSentences * 15) {
        warnings.push(
          `The narrative is only ${wordCount} words. A narrative of approximately ${
            award.minimumSentences * 15
          } words is a useful starting point for this award. Please proofread and expand it as necessary.`
        );
      }


      if (data.narrative.length > NARRATIVE_SOFT_CHARACTER_LIMIT) {
        warnings.push(
          `The narrative is ${data.narrative.length.toLocaleString()} characters. The recommended maximum is 1,400 characters; you can still generate the recommendation, but consider shortening it.`
        );
      }
      if (award && award.eligibility) warnings.push(`Eligibility reminder: ${award.eligibility}`);

      const blockingFailure = checks.some((item) => item.status === 'FAIL');
      if (blockingFailure || !award) {
        return submissionResult(checks, warnings, sentenceCount, wordCount);
      }

      const operation = normalizeOperationName(data.operationName);
      const formattedDate = formatIsoDateLong(data.operationDate);
      const opening = fillTemplate(award.openingTemplate, {
        ACTION: lowerChoice(data.actionCharacter),
        UNIT: data.unitName,
        OPERATION: operation,
        LOCATION: data.location,
        DATE: formattedDate,
      });
      const ending = fillTemplate(award.endingTemplate, {
        ACTION: lowerChoice(data.actionCharacter),
      });
      const citation = [opening, data.narrative, ending]
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      const recipientBbcode = orderedRecipients
        .map(
          (recipient) => `[URL='${recipient.milpacsUrl}'][B]${formalFullName(recipient)}[/B][/URL]`
        )
        .join('\n');

      const ticketTitle =
        `Medal Recommendation - ${operation} - ${award.abbreviation} - ` +
        formatTicketRecipient(orderedRecipients);
      const bbcode = [
        '[CENTER][B]' + award.name + '[/B]',
        '',
        `[URL='${award.filePageUrl}'][IMG size="100x42" alt="${award.abbreviation}.jpg"]${award.imageUrl}[/IMG][/URL]`,
        '',
        recipientBbcode,
        '',
        citation + '[/CENTER]',
      ].join('\n');

      return submissionResult(checks, warnings, sentenceCount, wordCount, {
        ready: true,
        ticketTitle: ticketTitle,
        bbcode: bbcode,
        citation: citation,
        award: award,
        recipientNames: orderedRecipients.map(formalFullName),
      });
    }

    /**
     * Normalizes recipient order regardless of the fields in which the
     * troopers were entered. Higher ranks appear first. Recipients holding the
     * same rank are alphabetized by surname, then given name.
     */
    function sortAwardRecipients(recipients, rankPrecedence) {
      const rankOrder = new Map(
        Array.from(rankPrecedence || []).map((rankAbbreviation, index) => [rankAbbreviation, index])
      );

      return Array.from(recipients || []).sort((left, right) => {
        const leftRank = rankOrder.has(left.rankAbbreviation)
          ? rankOrder.get(left.rankAbbreviation)
          : Number.MAX_SAFE_INTEGER;

        const rightRank = rankOrder.has(right.rankAbbreviation)
          ? rankOrder.get(right.rankAbbreviation)
          : Number.MAX_SAFE_INTEGER;

        if (leftRank !== rightRank) {
          return leftRank - rightRank;
        }

        const surnameComparison = compareNames(
          recipientSurname(left),
          recipientSurname(right)
        );

        if (surnameComparison !== 0) {
          return surnameComparison;
        }

        const givenNameComparison = compareNames(left.firstName, right.firstName);

        if (givenNameComparison !== 0) {
          return givenNameComparison;
        }

        return compareNames(left.dropdownName, right.dropdownName);
      });
    }

    function compareNames(left, right) {
      return String(left || '').localeCompare(String(right || ''), undefined, {
        sensitivity: 'base',
        numeric: true,
      });
    }

    function buildIndividualTicketTitle(operation, award, recipients) {
      return (
        `Medal Recommendation - ${operation} - ${award.abbreviation} - ` +
        formatTicketRecipient(recipients)
      );
    }

    function formatTicketRecipient(recipients) {
      if (recipients.length > 1) {
        return 'Multiple';
      }

      const recipient = recipients[0] || {};
      const firstInitial = recipient.firstName ? recipient.firstName.charAt(0) : '';

      return [recipient.rankAbbreviation, recipientSurname(recipient), firstInitial]
        .filter(Boolean)
        .join('.');
    }

    function submissionResult(checks, warnings, sentenceCount, wordCount, output) {
      const ready = output ? Boolean(output.ready) : false;
      return Object.assign(
        {
          ready: ready,
          statusText: ready
            ? 'READY FOR FINAL REVIEW'
            : 'NOT READY — COMPLETE OR CORRECT THE FAILED CHECKS',
          checks: checks,
          warnings: warnings,
          sentenceCount: sentenceCount,
          wordCount: wordCount,
          ticketTitle: '',
          bbcode: '',
          citation: '',
          award: null,
          recipientNames: [],
        },
        output || {}
      );
    }

    function check(label, passed, failureMessage) {
      return {
        label: label,
        status: passed ? 'PASS' : 'FAIL',
        message: passed ? '' : failureMessage,
      };
    }

    /**
     * Rejects square brackets in user-entered text before any forum BBCode is
     * assembled. BBCode has no reliable universal escape sequence, so rejecting
     * its control characters is safer and more transparent than silently
     * changing a trooper's citation.
     */
    function checkBbcodeSafeFields(fields) {
      const unsafeLabels = findBbcodeUnsafeFieldLabels(fields);

      return check(
        'Forum BBCode safety',
        unsafeLabels.length === 0,
        unsafeLabels.length ? `Remove square brackets [ or ] from: ${unsafeLabels.join(', ')}.` : ''
      );
    }

    function findBbcodeUnsafeFieldLabels(fields) {
      return Array.from(fields || [])
        .filter((field) => containsBbcodeControlCharacters(field.value))
        .map((field) => field.label);
    }

    function containsBbcodeControlCharacters(value) {
      const text = String(value || '');
      return text.includes('[') || text.includes(']');
    }

    function checkAllowedChoice(label, selected, allowedText, required, failureMessage) {
      if (!required) return check(label, true, '');
      const allowed = splitAllowedChoices(allowedText);
      return check(label, allowed.includes(selected), failureMessage);
    }

    function splitAllowedChoices(value) {
      const text = String(value || '').trim();
      if (!text || /^fixed/i.test(text)) return [];
      return text
        .split('|')
        .map((item) => item.trim())
        .filter(Boolean);
    }

    function individualEligibilityWarnings(award) {
      const warnings = [];
      if (award.eligibility) warnings.push(`Eligibility reminder: ${award.eligibility}`);
      if (award.survivalRule && award.survivalRule !== 'Not specified') {
        warnings.push(`Survival requirement: ${award.survivalRule}.`);
      }
      if (award.flightWingsRequired) warnings.push('Flight wings are required.');
      if (award.leadershipRequired) warnings.push('An official leadership position is required.');
      if (award.opponentRule && award.opponentRule !== 'None') {
        warnings.push(`Opponent requirement: ${award.opponentRule}.`);
      }
      return warnings;
    }

    /**
     * Replaces placeholders in one pass.
     *
     * A replacement value containing text such as {LOCATION} remains literal
     * text and cannot trigger a second placeholder substitution.
     */
    function fillTemplate(template, replacements) {
      const values = replacements || {};

      return String(template || '')
        .replace(/\{([A-Z_]+)\}/g, (placeholder, key) => {
          if (!Object.prototype.hasOwnProperty.call(values, key)) {
            return placeholder;
          }

          const value = values[key];

          return value === undefined || value === null ? '' : String(value);
        })
        .replace(/\s+/g, ' ')
        .trim();
    }

    function normalizeOperationName(value) {
      let title = String(value || '').trim();
      title = title.replace(/^operation\b/i, '').trim();
      title = title.replace(/^[-–—|:/_,;]+\s*/, '').trim();
      return title ? `Operation ${title}` : 'Operation';
    }

    function grammarAdjustRole(value) {
      const original = String(value || '').trim();
      if (!original) return '';
      if (/^(a|an)\s+/i.test(original)) return original;

      const lower = original.toLowerCase();
      const roleNouns = [
        'trooper',
        'gunner',
        'rifleman',
        'medic',
        'engineer',
        'sniper',
        'spotter',
        'crewman',
        'tanker',
        'tank commander',
        'pilot',
        'driver',
      ];

      if (!roleNouns.some((noun) => lower.endsWith(noun))) return original;

      const vowelStart = /^[aeiou]/i.test(original);
      const article = vowelStart && !/^(us\b|united\b|one\b)/i.test(original) ? 'an' : 'a';
      return `${article} ${lower}`;
    }

    function lowerChoice(value) {
      return String(value || '')
        .trim()
        .toLowerCase();
    }

    function formalFullName(recipient) {
      return [recipient.rankLong, recipientFullName(recipient)]
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function formalShortName(recipient) {
      return [recipient.rankLong, recipientSurname(recipient)]
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function recipientFullName(recipient) {
      const explicitFullName = String(recipient?.fullName || '').trim();

      return (
        explicitFullName ||
        [recipient?.firstName, recipient?.lastName]
          .filter(Boolean)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()
      );
    }

    function recipientSurname(recipient) {
      const rosterUsername = extractRosterUsername(recipient?.dropdownName);
      const separatorIndex = rosterUsername.search(/[.,]/u);
      const rosterSurname = String(
        separatorIndex >= 0 ? rosterUsername.slice(0, separatorIndex) : ''
      ).trim();

      if (rosterSurname) {
        const fullNameKey = recipientFullName(recipient)
          .toLowerCase()
          .replace(/[’']/gu, "'");
        const rosterSurnameKey = rosterSurname
          .toLowerCase()
          .replace(/[’']/gu, "'");

        if (
          fullNameKey === rosterSurnameKey ||
          fullNameKey.endsWith(` ${rosterSurnameKey}`)
        ) {
          return rosterSurname;
        }
      }

      const explicitLastName = String(recipient?.lastName || '').trim();
      if (explicitLastName) return explicitLastName;

      const parts = recipientFullName(recipient).split(/\s+/u).filter(Boolean);
      return parts.at(-1) || '';
    }

    function formatIndividualTemplateName(recipients, formatter) {
      const nameFormatter = typeof formatter === 'function' ? formatter : formalFullName;
      const names = Array.from(recipients || []).map(nameFormatter);

      return formatNameList(names);
    }

    function formatNameList(names) {
      const values = Array.from(names || []).filter(Boolean);

      if (values.length <= 1) return values[0] || '';
      if (values.length === 2) return `${values[0]} and ${values[1]}`;

      return `${values.slice(0, -1).join(', ')}, and ${values.at(-1)}`;
    }

    function normalizeIndividualNarrativeNames(narrative, recipients) {
      const people = Array.from(recipients || []);
      const lastNameCounts = countRecipientLastNames(people);

      return people.reduce((text, recipient) => {
        const lastNameKey = normalizedLastNameKey(recipientSurname(recipient));
        const includeLastNameOnly = lastNameCounts.get(lastNameKey) === 1;
        return normalizeRecipientNarrativeNames(text, recipient, includeLastNameOnly);
      }, String(narrative || ''));
    }

    function normalizeRecipientNarrativeNames(narrative, recipient, includeLastNameOnly) {
      const text = String(narrative || '');
      if (!text || !recipient) return text;

      const token = '§§MRA_RECIPIENT§§';
      let tokenized = replaceRecipientPatterns(
        text,
        buildRecipientMentionPatterns(recipient),
        token,
        'gi'
      );

      if (includeLastNameOnly) {
        tokenized = replaceRecipientPatterns(
          tokenized,
          [buildRecipientLastNamePattern(recipient)].filter(Boolean),
          token,
          'g'
        );
      }

      let occurrence = 0;
      return tokenized.replace(new RegExp(token, 'g'), () => {
        occurrence += 1;
        return occurrence === 1 ? formalFullName(recipient) : formalShortName(recipient);
      });
    }

    function replaceRecipientPatterns(text, patterns, token, flags) {
      if (!patterns.length) return text;

      const expression = new RegExp(
        `(^|[^A-Za-z0-9])(?:${patterns.join('|')})(?=$|[^A-Za-z0-9])`,
        flags
      );

      return text.replace(expression, (_match, prefix) => prefix + token);
    }

    function buildRecipientMentionPatterns(recipient) {
      const rank = namePattern(recipient.rankAbbreviation);
      const rankLong = namePattern(recipient.rankLong);
      const fullName = namePattern(recipientFullName(recipient));
      const last = namePattern(recipientSurname(recipient));
      const username = namePattern(extractRosterUsername(recipient.dropdownName));

      const patterns = [
        joinPattern(rankLong, fullName),
        joinPattern(rankLong, last),
        rank && fullName ? `${rank}\\.?\\s+${fullName}` : '',
        rank && last ? `${rank}\\.?\\s+${last}` : '',
        fullName,
        username,
      ]
        .filter(Boolean)
        .map((pattern) => withOptionalRecipientRoleAndInitials(pattern, recipient));

      return Array.from(new Set(patterns)).sort((a, b) => b.length - a.length);
    }

    function buildRecipientLastNamePattern(recipient) {
      const last = namePattern(recipientSurname(recipient));
      return last ? withOptionalRecipientRoleAndInitials(last, recipient) : '';
    }

    function withOptionalRecipientRoleAndInitials(pattern, recipient) {
      const rolePattern = recipientRolePattern();
      const optionalRole = rolePattern ? `(?:(?:${rolePattern})\\s+)?` : '';
      const initialsPattern = matchingRecipientInitialsPattern(
        recipientGivenNames(recipient)
      );
      const optionalInitials = initialsPattern
        ? `(?:(?:,\\s*|\\s+|\\.\\s*)(?:${initialsPattern}))?`
        : '';
      return `${optionalRole}${pattern}${optionalInitials}`;
    }

    function recipientGivenNames(recipient) {
      const fullParts = recipientFullName(recipient).split(/\s+/u).filter(Boolean);
      const surnameParts = recipientSurname(recipient).split(/\s+/u).filter(Boolean);

      if (fullParts.length > surnameParts.length && surnameParts.length) {
        const candidateSurname = fullParts.slice(-surnameParts.length).join(' ');

        if (
          normalizedLastNameKey(candidateSurname) ===
          normalizedLastNameKey(surnameParts.join(' '))
        ) {
          return fullParts.slice(0, -surnameParts.length).join(' ');
        }
      }

      return String(recipient?.firstName || '').trim();
    }

    function matchingRecipientInitialsPattern(givenNames) {
      const initials = String(givenNames || '')
        .split(/\s+/u)
        .map((part) => part.match(/[A-Za-z]/u)?.[0] || '')
        .filter(Boolean);
      const sequences = [];

      for (let count = initials.length; count >= 1; count -= 1) {
        sequences.push(
          initials
            .slice(0, count)
            .map((initial) => `${caseFlexibleNamePattern(initial)}\\.?`)
            .join('\\s*')
        );
      }

      return sequences.join('|');
    }

    function recipientRolePattern() {
      const roles = [
        'automatic rifleman',
        'anti-tank trooper',
        'assault trooper',
        'support trooper',
        'aircrew member',
        'tank commander',
        'platoon sergeant',
        'platoon leader',
        'section leader',
        'squad leader',
        'machine gunner',
        'trooper',
        'rifleman',
        'gunner',
        'medic',
        'engineer',
        'sniper',
        'spotter',
        'crewman',
        'driver',
        'tanker',
        'pilot',
      ];

      return roles.map(caseFlexibleNamePattern).filter(Boolean).join('|');
    }

    function caseFlexibleNamePattern(value) {
      return String(value || '')
        .trim()
        .split(/\s+/u)
        .filter(Boolean)
        .map((part) =>
          Array.from(part)
            .map((character) => {
              if (!/[A-Za-z]/u.test(character)) return escapeRegex(character);
              const lower = character.toLowerCase();
              const upper = character.toUpperCase();
              return lower === upper ? escapeRegex(character) : `[${lower}${upper}]`;
            })
            .join('')
        )
        .join('\\s+');
    }

    function countRecipientLastNames(recipients) {
      return Array.from(recipients || []).reduce((counts, recipient) => {
        const key = normalizedLastNameKey(recipientSurname(recipient));
        if (key) counts.set(key, (counts.get(key) || 0) + 1);
        return counts;
      }, new Map());
    }

    function normalizedLastNameKey(value) {
      return String(value || '').trim().toLowerCase().replace(/[’']/gu, "'");
    }

    function namePattern(value) {
      return String(value || '')
        .trim()
        .split(/\s+/u)
        .filter(Boolean)
        .map((part) => part.split(/['’]/u).map(escapeRegex).join("['’]"))
        .join('\\s+');
    }

    function joinPattern() {
      return Array.prototype.slice.call(arguments).filter(Boolean).join('\\s+');
    }

    function extractRosterUsername(dropdownName) {
      const text = String(dropdownName || '').trim();
      const firstSpace = text.indexOf(' ');
      return firstSpace >= 0 ? text.slice(firstSpace + 1).trim() : text;
    }

    function findRecipientMentions(narrative, recipients) {
      const text = String(narrative || '');
      if (!text) return [];

      const people = Array.from(recipients || []);
      const lastNameCounts = countRecipientLastNames(people);

      return people
        .filter((recipient) => {
          const patterns = buildRecipientMentionPatterns(recipient);
          const insensitiveExpression = patterns.length
            ? new RegExp(
                `(^|[^A-Za-z0-9])(?:${patterns.join('|')})(?=$|[^A-Za-z0-9])`,
                'i'
              )
            : null;

          if (insensitiveExpression && insensitiveExpression.test(text)) return true;

          const lastNameKey = normalizedLastNameKey(recipientSurname(recipient));
          const lastPattern =
            lastNameCounts.get(lastNameKey) === 1
              ? buildRecipientLastNamePattern(recipient)
              : '';

          if (!lastPattern) return false;

          return new RegExp(
            `(^|[^A-Za-z0-9])(?:${lastPattern})(?=$|[^A-Za-z0-9])`
          ).test(text);
        })
        .map(formalShortName);
    }

    function countApproximateSentences(value) {
      let text = String(value || '').trim();
      if (!text) return 0;

      text = protectSentencePeriods(text);
      const punctuation = text.match(/[.!?]+(?=["'’”)]*(?:\s|$))/g);
      return punctuation ? punctuation.length : 0;
    }

    function protectSentencePeriods(value) {
      const periodToken = '\uE000';
      const protect = (match) => match.replace(/\./g, periodToken);
      const ranks = [
        '1LT', '1SG', '2LT', 'BG', 'CAPT', 'COL', 'CPL', 'CPT', 'CSM',
        'CW2', 'CW3', 'CW4', 'CW5', 'GEN', 'GOA', 'LT', 'LTC', 'LTG',
        'MAJ', 'MG', 'MSG', 'PFC', 'PVT', 'RCT', 'SFC', 'SGM', 'SGT',
        'SPC', 'SSG', 'WO1',
      ];

      let text = String(value || '');
      text = text.replace(/\b(?:[A-Za-z]\.){2,}/gu, protect);
      text = text.replace(/\b(?:e\.g|i\.e)\./giu, protect);
      text = text.replace(
        new RegExp(`\\b(?:${ranks.map(escapeRegex).join('|')})\\.`, 'gi'),
        protect
      );
      text = text.replace(/\b(?:Dept|No|Mr|Mrs|Ms|Dr|Jr|Sr|St)\./giu, protect);
      text = text.replace(/\b([A-Z])\.(?=\s+[A-Z][A-Za-z'’.-]+)/gu, (_match, initial) => {
        return `${initial}${periodToken}`;
      });
      text = text.replace(/(\d)\.(\d)/g, `$1${periodToken}$2`);
      return text;
    }

    function countWords(value) {
      const text = String(value || '').trim();
      return text ? text.split(/\s+/).filter(Boolean).length : 0;
    }

    function formatIsoDateLong(isoDate) {
      const parts = String(isoDate || '')
        .split('-')
        .map(Number);
      if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return '';
      const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      return `${parts[2]} ${months[parts[1] - 1]} ${parts[0]}`;
    }

    function escapeRegex(value) {
      return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
export {
  generateIndividual,
  generateUnit,
  countApproximateSentences,
  countWords,
};
