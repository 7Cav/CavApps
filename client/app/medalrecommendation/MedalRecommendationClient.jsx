"use client";

import { useState } from "react";

import OperationAwardsView from "./components/OperationAwardsView";
import ServiceAwardsView from "./components/ServiceAwardsView";

export default function MedalRecommendationClient({
  rosterSummary,
  roster,
}) {
  const [activeSection, setActiveSection] =
    useState("operation");

  return (
    <div className="mt-6">
      <div className="mb-6 border border-[#444] p-4">
        <div className="font-semibold">
          Roster connected:{" "}
          {rosterSummary.totalCount} members
          available
        </div>

        <p className="mt-2 text-sm text-[#999]">
          {rosterSummary.combatCount} active /{" "}
          {rosterSummary.reserveCount} reserve /{" "}
          {rosterSummary.eloaCount} ELOA /{" "}
          {rosterSummary.retiredCount} retired
        </p>
      </div>

      <div className="mb-8 flex gap-2">
        <button
          type="button"
          onClick={() =>
            setActiveSection("operation")
          }
          className={
            activeSection === "operation"
              ? "border border-[#ebc729] px-4 py-2 font-semibold text-[#ebc729]"
              : "border border-[#444] px-4 py-2 text-[#aaa]"
          }
        >
          Operation Awards
        </button>

        <button
          type="button"
          onClick={() =>
            setActiveSection("service")
          }
          className={
            activeSection === "service"
              ? "border border-[#ebc729] px-4 py-2 font-semibold text-[#ebc729]"
              : "border border-[#444] px-4 py-2 text-[#aaa]"
          }
        >
          Service Awards
        </button>
      </div>

      {activeSection === "operation" ? (
        <OperationAwardsView
          roster={roster}
        />
      ) : (
        <ServiceAwardsView
          roster={roster}
        />
      )}
    </div>
  );
}