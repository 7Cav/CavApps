import Link from "next/link";
import GetCombatRoster from "../reusableModules/getCombatRoster";
import GetReserveRoster from "../reusableModules/getReserveRoster";
import GetApiTimestamp from "../reusableModules/getApiTimestamp";
import GetRosterGroups from "../reusableModules/getGroups";
import AdrListEntry from "./modules/AdrListEntry";
import Logo from "../theme/adrLogo";
import "./page.css";
import "../globals.css";

// This route reads the live roster on every request and must never be
// prerendered. Since Next 15, no-store fetches no longer mark a route dynamic
// on their own, so opt in explicitly. Without this the build prerenders against
// the live API and fails.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Active Duty Roster",
};

export default async function ActiveDutyRoster() {
  const [combat, reserve, timestamp, groups] = await Promise.all([
    GetCombatRoster(),
    GetReserveRoster(),
    GetApiTimestamp(),
    GetRosterGroups(),
  ]);

  const milpacArray = [{ combat, reserve }];
  const rosterGroups = groups;

  const units = [
    { title: "Regimental Command", selectors: [0] },
    { title: "First Battalion", selectors: [2, 3, 4, 5, 6] },
    { title: "Second Battalion", selectors: [7, 8, 9, 10, 11] },
    { title: "Third Battalion", selectors: [12, 13, 14, 16] },
    { title: "Auxiliary Combat Division", selectors: [15, 17, 18, 19, 20, 21] },
    { title: "Development Command", selectors: [22] },
    { title: "Support Departments", selectors: [1] },
  ];
  return (
    <div className="MasterContainer">
      <div className="p-nav-primary">
        <div className="p-nav-wrapper">
          <nav className="p-nav">
            <div className="p-nav-inner">
              <div className="p-nav-scroller">
                <div className="p-nav-logo">
                  <Link href={"/"}>
                    <Logo
                      alt="ADR Logo"
                      title="Return to CavApps"
                      width="17em"
                      height="3em"
                    />
                  </Link>
                </div>
                <div className="p-nav-info">
                  {timestamp && timestamp[0]?.combat !== null && (
                    <div className="cache-time">
                      Database is {timestamp[0].combat} minutes old
                    </div>
                  )}
                </div>
              </div>
            </div>
          </nav>
        </div>
      </div>
      <div className="ListContainer">
        {units.map((unit) => (
          <div className="DepartmentContainer" key={unit.title}>
            <div className="Title">{unit.title}</div>
            {unit.selectors.map((selector) => (
              <AdrListEntry
                key={`${unit.title}-${selector}`} // Unique key for AdrListEntry
                rGSelector={selector}
                milpacArray={milpacArray}
                rosterGroups={rosterGroups}
              />
            ))}
          </div>
        ))}
        {/*<AdrListEntry bBGroup="twoSeven" milpacArray={milpacArray} />
        <AdrListEntry bBGroup="threeSeven" milpacArray={milpacArray} />
        <AdrListEntry bBGroup="acd" milpacArray={milpacArray} />
        <AdrListEntry bBGroup="secOps" milpacArray={milpacArray} />
        <AdrListEntry bBGroup="roo" milpacArray={milpacArray} />
        <AdrListEntry bBGroup="support" milpacArray={milpacArray} /> */}
      </div>
    </div>
  );
}
