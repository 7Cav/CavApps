"use client";

import { useState } from "react";

import {
  INDIVIDUAL_AWARDS,
  SERVICE_AWARD_DEFINITIONS,
  UNIT_AWARDS,
} from "./lib/reference-data";

export default function MedalRecommendationClient() {
  const [workflow, setWorkflow] = useState("operation");

  const serviceIndividualAwards = SERVICE_AWARD_DEFINITIONS.filter(
    (award) => award.scope === "individual",
  );

  const serviceUnitAwards = SERVICE_AWARD_DEFINITIONS.filter(
    (award) => award.scope === "unit",
  );

  return (
    <div className="mt-6">
      <div className="mb-6 flex gap-2">
        <button
          type="button"
          onClick={() => setWorkflow("operation")}
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
          onClick={() => setWorkflow("service")}
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
        <div>
          <h2 className="text-xl font-semibold">Operation Awards</h2>

          <p className="mt-2 text-[#aaa]">
            {INDIVIDUAL_AWARDS.length} Operation Medals and{" "}
            {UNIT_AWARDS.length} Operation Unit Awards loaded.
          </p>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-semibold">Service Awards</h2>

          <p className="mt-2 text-[#aaa]">
            {serviceIndividualAwards.length} Service Medals and{" "}
            {serviceUnitAwards.length} Service Unit Awards loaded.
          </p>
        </div>
      )}
    </div>
  );
}