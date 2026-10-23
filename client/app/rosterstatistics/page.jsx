import GetCombatRoster from "../reusableModules/getCombatRoster";
import GetReserveRoster from "../reusableModules/getReserveRoster";
import GetApiTimestamp from "../reusableModules/getApiTimestamp";
import lists from "../reusableModules/BilletBank";
import Statistics from "./modules/StatisticsClient";
import "./page.css";

// This route reads the live roster on every request and must never be
// prerendered. Since Next 15, no-store fetches no longer mark a route dynamic
// on their own, so opt in explicitly. Without this the build prerenders against
// the live API and fails.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Roster Statistics",
};

export default async function RosterStatistics() {
  const [combat, reserve, timestamp] = await Promise.all([
    GetCombatRoster(),
    GetReserveRoster(),
    GetApiTimestamp(),
  ]);

  const milpacArray = [{ combat, reserve }];

  return (
    <div className="MasterContainer">
      <div className="DepartmentContainer">
        <h4>
          Please note, the Statistics app is currently pending rewrite by S6.
          The values, while accurate, only apply to active duty personnel
        </h4>
      </div>
      {timestamp && timestamp[0]?.combat !== null && (
        <div className="DepartmentContainer">
          Database is {timestamp[0].combat} minutes old
        </div>
      )}
      <div className="DepartmentContainer">
        <div className="RegimentBreakdown">
          <div className="Subtitle">
            7th Cavalry Regiment (Active Duty and Line Billets only)
          </div>
          <Statistics
            billetIDs={[
              lists.regiCommand,
              lists.oneSevenCommand,
              lists.alpha1,
              lists.bravo1,
              lists.charlie1,
              lists.delta1,
              lists.twoSevenCommand,
              lists.alpha2,
              lists.bravo2,
              lists.charlie2,
              lists.echo2,
              lists.threeSevenCommand,
              lists.alpha3,
              lists.bravo3,
              lists.charlie3,
              lists.acdCommand,
              lists.alpha4,
              lists.bravo4,
              lists.charlie4,
              lists.delta4,
              lists.echo4,
              lists.starterPlatoonCommand,
              lists.alphaSP,
              lists.bravoSP,
              lists.charlieSP,
              lists.deltaSP,
            ]}
            labelArray={[
              "General Staff",
              "1-7 Headquarters",
              "Alpha Company 1-7",
              "Bravo Troop 1-7",
              "Charlie Company 1-7",
              "Delta Company 1-7",
              "2-7 Headquarters",
              "Alpha Company 2-7",
              "Bravo Company 2-7",
              "Charlie Company 2-7",
              "Echo Company 2-7",
              "3-7 Headquarters",
              "Alpha Company 3-7",
              "Bravo Company 3-7",
              "Charlie Company 3-7",
              "R&DC Headquarters",
              "Alpha Company ACD",
              "Bravo Company ACD",
              "Charlie Company ACD",
              "Delta Company ACD",
              "Echo Company ACD",
              "DEVCOM Headquarters",
              "Alpha Platoon DEVCOM",
              "Bravo Platoon DEVCOM",
              "Charlie Platoon DEVCOM",
              "Delta Platoon DEVCOM",
            ]}
            milpacArray={milpacArray}
            useRegiLogic
          />
        </div>

        <div className="OneSevenBreakdown">
          <div className="Subtitle">First Battalion</div>
          <Statistics
            billetIDs={[
              lists.oneSevenCommand,
              lists.alpha1,
              lists.bravo1,
              lists.charlie1,
              lists.delta1,
            ]}
            centerLabel="Total 1-7 Strength"
            labelArray={[
              "1-7 Headquarters",
              "Alpha Company",
              "Bravo Troop",
              "Charlie Company",
              "Delta Company",
            ]}
            milpacArray={milpacArray}
          />
        </div>

        <div className="TwoSevenBreakdown">
          <div className="Subtitle">Second Battalion</div>
          <Statistics
            billetIDs={[
              lists.twoSevenCommand,
              lists.alpha2,
              lists.bravo2,
              lists.charlie2,
              lists.echo2,
            ]}
            centerLabel="Total 2-7 Strength"
            labelArray={[
              "2-7 Headquarters",
              "Able Company",
              "Baker Company",
              "Charlie Company",
              "Easy Company",
            ]}
            milpacArray={milpacArray}
          />
        </div>
        <div className="threeSevenBreakdown">
          <div className="Subtitle">Third Battalion</div>
          <Statistics
            billetIDs={[
              lists.threeSevenCommand,
              lists.alpha3,
              lists.bravo3,
              lists.charlie3,
            ]}
            centerLabel="Total 3-7 Strength"
            labelArray={[
              "3-7 Headquarters",
              "Alpha Company",
              "Bravo Company",
              "Charlie Company",
            ]}
            milpacArray={milpacArray}
          />
        </div>

        <div className="ACDStrength">
          <div className="Subtitle">Reserve and Development Command</div>
          <Statistics
            billetIDs={[
              lists.acdCommand,
              lists.alpha4,
              lists.bravo4,
              lists.charlie4,
              lists.delta4,
              lists.echo4,
              lists.starterPlatoonCommand,
              lists.alphaSP,
              lists.bravoSP,
              lists.charlieSP,
              lists.deltaSP,
            ]}
            centerLabel="Total R&DC Strength"
            labelArray={[
              "R&DC Headquarters",
              "Alpha Company ACD",
              "Bravo Company ACD",
              "Charlie Company ACD",
              "Delta Company ACD",
              "Echo Company ACD",
              "DEVCOM Headquarters",
              "Alpha Platoon DEVCOM",
              "Bravo Platoon DEVCOM",
              "Charlie Platoon DEVCOM",
              "Delta Platoon DEVCOM",
            ]}
            milpacArray={milpacArray}
          />
        </div>
      </div>
    </div>
  );
}
