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

// JAG Specialist belongs to no position group upstream, so the roster API never
// returns it and the four people holding it only ever showed under their
// primary billet. Defined here until it gets a group of its own; drop this and
// add "JAG" to Support Departments once it does, or it renders twice.
const JAG = {
  groupTitle: "JAG",
  positions: [{ positionId: "584", positionDisplayOrder: 10 }],
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

  // Groups are matched on groupTitle rather than by their index in the API
  // response. Indices shift whenever a group is added upstream: E/ACD landed
  // between D/ACD and D/DEVCOM and silently pointed Development Command at an
  // empty company for months.
  const units = [
    { title: "Regimental Command", groups: ["Regimental HQ"] },
    {
      title: "First Battalion",
      groups: ["1-7 Command", "A/1-7", "B/1-7", "C/1-7", "D/1-7"],
    },
    {
      title: "Second Battalion",
      groups: ["2-7 Command", "A/2-7", "B/2-7", "C/2-7", "E/2-7"],
    },
    {
      title: "Third Battalion",
      groups: ["3-7 Command", "A/3-7", "B/3-7", "C/3-7"],
    },
    {
      title: "Auxiliary Combat Detachment",
      groups: ["ACD Command", "A/ACD", "B/ACD", "C/ACD", "D/ACD", "E/ACD"],
    },
    { title: "Development Command", groups: ["D/DEVCOM"] },
    { title: "Support Departments", groups: ["Support Attachment", JAG] },
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
            {unit.groups.map((group) => (
              <AdrListEntry
                key={`${unit.title}-${typeof group === "string" ? group : group.groupTitle}`} // Unique key for AdrListEntry
                group={group}
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
