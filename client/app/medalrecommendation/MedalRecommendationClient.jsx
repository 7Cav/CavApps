"use client";

import { useState } from "react";

import {
  SERVICE_AWARD_DEFINITIONS,
} from "./lib/reference-data";

import OperationAwardsView from "./components/OperationAwardsView";

export default function MedalRecommendationClient({
  rosterSummary,
  roster,
}) {
  const [workflow, setWorkflow] =
    useState("operation");

  const serviceIndividualAwards =
    SERVICE_AWARD_DEFINITIONS.filter(
      (award) =>
        award.scope === "individual",
    );

  const serviceUnitAwards =
    SERVICE_AWARD_DEFINITIONS.filter(
      (award) =>
        award.scope === "unit",
    );

  return (
    <div className="mt-6">
      <div className="mb-6 border border-[#444] p-3 text-sm text-[#aaa]">
        Roster connected:{" "}
        <span className="text-white">
          {rosterSummary.totalCount}
        </span>{" "}
        members available (
        {rosterSummary.combatCount} active /{" "}
        {rosterSummary.reserveCount} reserve /{" "}
        {rosterSummary.eloaCount} ELOA /{" "}
        {rosterSummary.retiredCount} retired)
      </div>

      <div className="mb-6 flex gap-2">
        <button
          type="button"
          onClick={() =>
            setWorkflow("operation")
          }
          className={
            workflow === "operation"
              ? "border border-[#ebc729] px-4 py-2 text-[#ebc729]"
              : "border border-[#444] px-4 py-2 text-[#aaa]"
          }
        >
          Operation Awards
        </button>

        <button
          type="button"
          onClick={() =>
            setWorkflow("service")
          }
          className={
            workflow === "service"
              ? "border border-[#ebc729] px-4 py-2 text-[#ebc729]"
              : "border border-[#444] px-4 py-2 text-[#aaa]"
          }
        >
          Service Awards
        </button>
      </div>

      {workflow === "operation" ? (
        <OperationAwardsView
           roster={roster}
        />
      ) : (
        <div>
          <h2 className="text-xl font-semibold">
            Service Awards
          </h2>

          <p className="mt-2 text-[#aaa]">
            {serviceIndividualAwards.length}{" "}
            Service Medals and{" "}
            {serviceUnitAwards.length} Service
            Unit Awards loaded.
          </p>
        </div>
      )}
    </div>
  );
}