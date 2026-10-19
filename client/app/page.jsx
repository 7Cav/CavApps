import Link from "next/link";
import Logo from "./theme/appsLogo";
import "./page.css";

export default function Home() {
  return (
    <div className="masterbox">
      <div className="logobox">
        <Link href="https://7cav.us/forums/">
          <Logo width="50em" height="15em" />
        </Link>
      </div>
      <div className="buttonbox">
        <Link href="/adr">
          <button className="button">Active Duty Roster</button>
        </Link>
        <Link href="/rosterstatistics">
          <button className="button">Roster Statistics</button>
        </Link>
        <Link href="/uniformbuilder">
          <button className="button">Uniform Builder</button>
        </Link>
        <Link href="/rosterhistory">
          <button className="button">Roster History</button>
        </Link>
        <Link
          href="/medalrecommendation"
          className="button hover:!text-black hover:!no-underline"
        >
          Medal Recommendation
        </Link>
      </div>
    </div>
  );
}
