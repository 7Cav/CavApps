//Honestly, I could probably just delete this file.

import React from "react";
import MilpacParse from "./MilpacParse";

// `group` is either a groupTitle to look up in the API response, or a literal
// group object for billets the API doesn't put in a group at all.
function AdrListEntry(props) {
  const rosterGroups = props.rosterGroups.groups;
  const group =
    typeof props.group === "string"
      ? rosterGroups.find((entry) => entry.groupTitle === props.group)
      : props.group;

  // A renamed or removed group used to throw here and take the whole roster
  // down with it, since this route has no error boundary. Skip it instead and
  // leave a breadcrumb, so one bad group costs one section.
  if (!group) {
    console.error(`AdrListEntry: no roster group titled "${props.group}"`);
    return null;
  }

  return (
    <div className="ResponseContainer">
      <MilpacParse
        milpacArray={props.milpacArray}
        rosterGroups={group.positions ?? []}
        subtitle={group.groupTitle}
      />
    </div>
  );
}

export default AdrListEntry;
