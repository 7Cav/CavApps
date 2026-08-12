"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ARCOM_RIBBON_URL = "https://wiki.7cav.us/images/d/dc/ARCOM.jpg";

function formatOperationDate(value) {
  const [year, month, day] = value.split("-").map(Number);

  const date = new Date(Date.UTC(year, month - 1, day));

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeFirstRecipientMention(narrative, recipient) {
  const text = narrative.trim();

  const rankFull = recipient?.rank?.rankFull?.trim() ?? "";

  const rankShort = recipient?.rank?.rankShort?.trim() ?? "";

  const fullName = recipient?.realName?.trim() ?? "";

  if (!rankFull || !fullName) {
    return text;
  }

  const nameParts = fullName.split(/\s+/);
  const lastName = nameParts[nameParts.length - 1];

  if (!lastName) {
    return text;
  }

  const fullIdentity = `${rankFull} ${fullName}`;

  const possibleMentions = [
    `${escapeRegExp(rankFull)}\\s+${escapeRegExp(fullName)}`,
    `${escapeRegExp(rankFull)}\\s+${escapeRegExp(lastName)}`,
    rankShort
      ? `${escapeRegExp(rankShort)}\\.?\\s+${escapeRegExp(lastName)}`
      : "",
    escapeRegExp(fullName),
    escapeRegExp(lastName),
  ].filter(Boolean);

  const firstMentionPattern = new RegExp(
    `\\b(?:${possibleMentions.join("|")})\\b`,
    "i",
  );

  return text.replace(firstMentionPattern, fullIdentity);
}

export default function MedalRecommendationClient({ combatRoster = [] }) {
  const [recipientQuery, setRecipientQuery] = useState("");

  const [selectedRecipient, setSelectedRecipient] = useState(null);

  const [actionCharacter, setActionCharacter] = useState("");

  const [combatElement, setCombatElement] = useState("");

  const [operationTitle, setOperationTitle] = useState("");

  const [location, setLocation] = useState("");

  const [operationDate, setOperationDate] = useState("");

  const [narrative, setNarrative] = useState("");

  const [error, setError] = useState("");

  const [recommendation, setRecommendation] = useState(null);

  const rosterMembers = useMemo(() => combatRoster ?? [], [combatRoster]);

  const suggestions = useMemo(() => {
    const query = recipientQuery.trim().toLowerCase();

    if (
      query.length < 3 ||
      selectedRecipient?.user?.username === recipientQuery
    ) {
      return [];
    }

    return rosterMembers
      .filter((member) => member?.user?.username?.toLowerCase().includes(query))
      .slice(0, 10);
  }, [recipientQuery, rosterMembers, selectedRecipient]);

  function selectRecipient(member) {
    setSelectedRecipient(member);
    setRecipientQuery(member.user.username);
    setRecommendation(null);
    setError("");
  }

  function handleRecipientQueryChange(event) {
    setRecipientQuery(event.target.value);
    setSelectedRecipient(null);
    setRecommendation(null);
    setError("");
  }

  function handleGenerate() {
    const recipientRank = selectedRecipient?.rank?.rankFull?.trim() ?? "";

    const recipientFullName = selectedRecipient?.realName?.trim() ?? "";

    const isComplete =
      selectedRecipient &&
      recipientRank &&
      recipientFullName &&
      actionCharacter &&
      combatElement.trim() &&
      operationTitle.trim() &&
      location.trim() &&
      operationDate &&
      narrative.trim();

    if (!isComplete) {
      setError(
        "Complete all required fields before generating a recommendation.",
      );

      return;
    }

    setError("");

    const formattedDate = formatOperationDate(operationDate);

    const normalizedNarrative = normalizeFirstRecipientMention(
      narrative,
      selectedRecipient,
    );

    const openingSentence =
      `For ${actionCharacter} actions over an entire operation while serving as ` +
      `${combatElement.trim()} in the 7th Cavalry Regiment during combat in ` +
      `Operation ${operationTitle.trim()} near ${location.trim()} on ${formattedDate}.`;

    const closingSentence =
      `${recipientRank} ${recipientFullName}'s ${actionCharacter} actions ` +
      "reflect great credit upon themselves and the 7th Cavalry Gaming Regiment.";

    const citationNarrative = [
      openingSentence,
      normalizedNarrative,
      closingSentence,
    ].join(" ");

    setRecommendation({
      recipient: `${recipientRank} ${recipientFullName}`,
      citationNarrative,
    });
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-6 text-3xl font-bold">Medal Recommendation Aid</h1>

      <Card>
        <CardHeader>
          <h2 className="text-2xl font-semibold">Army Commendation Medal</h2>
        </CardHeader>

        <CardContent className="space-y-6">
          <p>Create an Army Commendation Medal recommendation.</p>

          <div className="space-y-2">
            <label htmlFor="recipient" className="text-sm font-medium">
              Recipient
            </label>

            <Input
              id="recipient"
              type="text"
              value={recipientQuery}
              autoComplete="off"
              placeholder="Enter a 7Cav username"
              onChange={handleRecipientQueryChange}
            />

            {suggestions.length > 0 && (
              <div className="flex flex-col gap-2">
                {suggestions.map((member) => (
                  <Button
                    key={member.user.userId}
                    type="button"
                    variant="outline"
                    onClick={() => selectRecipient(member)}
                  >
                    {member.user.username}
                  </Button>
                ))}
              </div>
            )}

            {selectedRecipient && (
              <div className="space-y-1">
                <p>Selected recipient: {selectedRecipient.user.username}</p>

                <p className="font-medium">
                  {selectedRecipient.rank?.rankFull}{" "}
                  {selectedRecipient.realName}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="action-character" className="text-sm font-medium">
              Action Character
            </label>

            <Select value={actionCharacter} onValueChange={setActionCharacter}>
              <SelectTrigger id="action-character">
                <SelectValue placeholder="Select action character" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="skillful">Skillful</SelectItem>

                <SelectItem value="heroic">Heroic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="combat-element" className="text-sm font-medium">
              Combat Element
            </label>

            <Input
              id="combat-element"
              type="text"
              value={combatElement}
              onChange={(event) => setCombatElement(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="operation-title" className="text-sm font-medium">
              Operation Title
            </label>

            <Input
              id="operation-title"
              type="text"
              value={operationTitle}
              onChange={(event) => setOperationTitle(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="location" className="text-sm font-medium">
              Location
            </label>

            <Input
              id="location"
              type="text"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="operation-date" className="text-sm font-medium">
              Operation Date
            </label>

            <Input
              id="operation-date"
              type="date"
              value={operationDate}
              onChange={(event) => setOperationDate(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="narrative" className="text-sm font-medium">
              Narrative
            </label>

            <textarea
              id="narrative"
              value={narrative}
              onChange={(event) => setNarrative(event.target.value)}
              rows={8}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          <Button type="button" onClick={handleGenerate}>
            Generate Recommendation
          </Button>

          {error && (
            <p role="alert" className="text-sm font-medium">
              {error}
            </p>
          )}

          {recommendation && (
            <section
              role="region"
              aria-label="Recommendation Preview"
              className="space-y-4 rounded-lg border p-4"
            >
              <h3 className="text-xl font-semibold">Army Commendation Medal</h3>

              <img
                src={ARCOM_RIBBON_URL}
                alt="Army Commendation Medal ribbon"
                className="h-auto w-40 max-w-full"
              />

              <p>{recommendation.recipient}</p>

              <p aria-label="Citation Narrative">
                {recommendation.citationNarrative}
              </p>
            </section>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
