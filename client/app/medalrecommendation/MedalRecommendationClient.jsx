"use client";

import { useState } from "react";

import HowToUseView from "./components/HowToUseView";
import MedalLanding from "./components/MedalLanding";
import OperationAwardsView from "./components/OperationAwardsView";
import ServiceAwardsView from "./components/ServiceAwardsView";

export default function MedalRecommendationClient({ roster }) {
  const [activeView, setActiveView] = useState("landing");

  function navigate(nextView) {
    setActiveView(nextView);

    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }

  if (activeView === "operation") {
    return (
      <OperationAwardsView roster={roster} onBack={() => navigate("landing")} />
    );
  }

  if (activeView === "service") {
    return (
      <ServiceAwardsView roster={roster} onBack={() => navigate("landing")} />
    );
  }

  if (activeView === "guide") {
    return (
      <HowToUseView
        onBack={() => navigate("landing")}
        onOpenOperation={() => navigate("operation")}
        onOpenService={() => navigate("service")}
      />
    );
  }

  return (
    <MedalLanding
      onOpenOperation={() => navigate("operation")}
      onOpenService={() => navigate("service")}
      onOpenGuide={() => navigate("guide")}
    />
  );
}
