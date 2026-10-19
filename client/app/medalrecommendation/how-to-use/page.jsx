import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { oswald } from "../lib/fonts";
import { FEATURE_HOME_LINK_CLASS_NAME } from "../lib/navigation-styles";

export const metadata = {
  title: "How to Use This Tool — Medal Recommendation Aid",
};

const steps = [
  {
    title: "Select a Medal",
    user: (
      <p>
        Choose either Operation Medals or Service Medals from the landing page.
        Once inside the worksheet, select the medal you wish to recommend.
      </p>
    ),
    tool: (
      <p>
        The Aid loads the appropriate worksheet for your selected medal,
        including its required fields, criteria, and available guidance.
        Different medals may have different requirements, so the worksheet will
        adapt to your selection.
      </p>
    ),
  },
  {
    title: "Review the Medal Requirements",
    user: (
      <>
        <p>
          Review the medal's criteria, narrative guidance, and any eligibility
          guidance before proceeding.
        </p>
        <p>
          Recommenders generally must outrank the recipient by Regiment billet
          and have witnessed the action. Temporary operation billets do not
          override Regiment billets. Lower- or equal-billet members may
          recommend superiors for combat medals only with three independent
          eyewitness statements and the operation's OIC approval.
        </p>
        <p>
          <strong>Submission Deadlines:</strong> Combat Medal recommendations
          must be prepared within one week of the After Action Report (AAR)
          posting. For Service Medals, the recognized action must have occurred
          within the last 30 days unless waived by the Chief of Staff (COS) or
          their designate.
        </p>
      </>
    ),
    tool: (
      <>
        <p>
          The Aid displays award-specific information to help you prepare the
          recommendation. Some requirements can be checked automatically, while
          others require your judgment and knowledge of the recipient's service.
        </p>
        <p>
          The tool cannot independently determine whether someone deserves an
          award or whether every eligibility requirement has been satisfied.
        </p>
      </>
    ),
  },
  {
    title: "Select Your Recipients",
    user: (
      <>
        <p>
          Search for and select the trooper receiving the recommendation. If the
          award permits multiple recipients, you may add additional troopers or
          use the bulk-recipient tools when appropriate.
        </p>
        <p>
          Ensure that every selected recipient belongs in the recommendation and
          that a shared citation is appropriate under the SOP.
        </p>
      </>
    ),
    tool: (
      <p>
        The Aid retrieves recipient information from the CavApps roster,
        including names and ranks. It uses this information to construct the
        recommendation's recipient identities and format the citation according
        to the supported recipient rules.
      </p>
    ),
  },
  {
    title: "Complete the Worksheet",
    user: (
      <>
        <p>
          Fill out the requested information for your selected medal. Depending
          on the award, this may include an operation, service period, billet,
          department, organizational element, or other relevant details.
        </p>
        <p>
          Some entries become part of a generated sentence and may require you
          to include the appropriate article, such as "a" or "an." Pay close
          attention to each field's placeholder text and ensure your entries
          make grammatical sense.
        </p>
      </>
    ),
    tool: (
      <p>
        The worksheet presents the fields required for your selected medal and
        checks supported requirements as you complete them. It incorporates your
        entries into the appropriate portions of the recommendation.
      </p>
    ),
  },
  {
    title: "Write Your Narrative",
    user: (
      <>
        <p>
          Describe the actions, achievements, or service supporting the
          recommendation. Be specific, factual, and relevant to the selected
          medal's criteria.
        </p>
        <p>
          For Service Medals that provide a required sentence starter, continue
          directly from the displayed text. Do not repeat the starter or begin
          an unrelated sentence. Your narrative should complete the opening
          naturally.
        </p>
      </>
    ),
    tool: (
      <>
        <p>
          Where required, the Aid provides the SOP-prescribed narrative opening
          and protects it from accidental modification. It combines the opening
          with your written continuation and provides relevant narrative
          guidance and validation feedback.
        </p>
        <p>
          You remain responsible for the accuracy and substance of the
          narrative.
        </p>
      </>
    ),
  },
  {
    title: "Generate and Review Your Recommendation",
    user: (
      <>
        <p>
          Once your worksheet is complete, select{" "}
          <strong>Generate Recommendation</strong>. Review the resulting
          citation carefully for accuracy, clarity, recipient information, and
          compliance with the SOP.
        </p>
        <p>
          If you identify a mistake, return to the worksheet, make the necessary
          corrections, and generate the recommendation again.
        </p>
        <p>
          Review all validation warnings, even when they do not prevent the
          recommendation from being generated.
        </p>
        <p>
          Do not copy text directly from Recommendation Preview. Use the
          provided Recommendation Title and Recommendation Body copy controls.
        </p>
      </>
    ),
    tool: (
      <>
        <p>
          The Aid validates supported worksheet requirements and assembles the
          recommendation using the selected medal's formatting rules. It then
          displays the generated recommendation, along with its Recommendation
          Title and Recommendation Body for submission.
        </p>
        <p className="font-semibold text-foreground">
          Generating a recommendation does not submit it or indicate approval.
        </p>
      </>
    ),
  },
  {
    title: "Submit Your Recommendation",
    user: (
      <>
        <p>
          Copy the generated <strong>Recommendation Title</strong>, then select{" "}
          <strong>Open Medal Recommendation Ticket</strong>. Paste the title
          into the appropriate ticket field.
        </p>
        <p>
          Return to the Aid, copy the <strong>Recommendation Body</strong>, and
          paste it into the ticket's message field. Review the completed ticket
          before submitting it through the forums.
        </p>
        <p>
          When submitting your recommendation, include the names of any
          witnesses to the incident or action being recognized, along with any
          supporting witness statements required by the SOP. The Medal
          Recommendation Aid does not collect this information automatically.
        </p>
        <p>
          If S1 returns your recommendation for egregious errors, you have up to
          <strong> three days</strong> to correct them before the ticket is
          closed. Monitor your submitted ticket for requests or required
          corrections.
        </p>
      </>
    ),
    tool: (
      <>
        <p>
          The Aid prepares the Recommendation Title and BBCode-formatted Body
          for you to copy. It also provides a direct link to the Medal
          Recommendation ticket.
        </p>
        <p>
          The Aid does not automatically create, send, or submit the ticket. You
          must complete the final submission yourself.
        </p>
      </>
    ),
  },
];

export default function MedalHowToUsePage() {
  return (
    <main className="mx-auto max-w-[90rem] px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/medalrecommendation"
        className={FEATURE_HOME_LINK_CLASS_NAME}
      >
        <span aria-hidden="true">←</span>
        Medal Recommendation Aid
      </Link>

      <header className="mt-6 text-center">
        <h1
          className={`${oswald.className} text-3xl font-semibold tracking-tight text-primary sm:text-4xl`}
        >
          How to Use This Tool
        </h1>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          A step-by-step guide to preparing and submitting a medal
          recommendation.
        </p>
      </header>

      <section aria-labelledby="before-you-begin" className="mt-8">
        <Card className="border-border/70 border-l-4 border-l-primary bg-card/70 shadow-none">
          <CardHeader className="p-5 sm:p-6">
            <h2 id="before-you-begin" className="text-xl font-semibold">
              Before You Begin
            </h2>
          </CardHeader>
          <CardContent className="space-y-4 px-5 pb-5 text-base leading-relaxed text-muted-foreground sm:px-6 sm:pb-6">
            <p>
              The Medal Recommendation Aid is designed to help you prepare a
              properly formatted medal recommendation, but successfully
              generating one does not establish eligibility or guarantee
              approval. All recommendations must comply with the Regiment's
              Awards &amp; Decorations SOP and remain subject to review and
              approval. After submitting your recommendation, be sure to monitor
              your ticket and respond promptly to any requests for additional
              information, supporting evidence, or corrections.
            </p>
            <p>
              Before starting, familiarize yourself with the current{" "}
              <a
                href="https://wiki.7cav.us/wiki/Awards_and_Decorations"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sm font-semibold underline underline-offset-4 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Awards &amp; Decorations SOP
              </a>{" "}
              on the 7th Cavalry Wiki. If you have questions about eligibility,
              award selection, or submission procedures, consult your chain of
              command.
            </p>
          </CardContent>
        </Card>
      </section>

      <ol
        aria-label="Recommendation steps"
        role="list"
        className="mt-6 space-y-6"
      >
        {steps.map(({ title, user, tool }, index) => {
          const stepId = `step-${index + 1}`;
          return (
            <li key={title}>
              <section aria-labelledby={stepId}>
                <Card className="overflow-hidden border-border/70 bg-card/70 shadow-none">
                  <CardHeader className="border-b border-border/70 p-5 sm:p-6">
                    <h2
                      id={stepId}
                      className="flex items-center gap-3 text-xl font-semibold"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
                        <span className="sr-only">Step </span>
                        {index + 1}
                      </span>
                      <span>{title}</span>
                    </h2>
                  </CardHeader>
                  <CardContent className="grid p-0 md:grid-cols-2">
                    <section
                      aria-labelledby={`${stepId}-user`}
                      className="min-w-0 p-5 sm:p-6"
                    >
                      <h3
                        id={`${stepId}-user`}
                        className="text-base font-semibold"
                      >
                        What You Do
                      </h3>
                      <div className="mt-3 space-y-3 text-base leading-relaxed text-muted-foreground">
                        {user}
                      </div>
                    </section>
                    <section
                      aria-labelledby={`${stepId}-tool`}
                      className="min-w-0 border-t border-border/70 p-5 sm:p-6 md:border-t-0 md:border-l"
                    >
                      <h3
                        id={`${stepId}-tool`}
                        className="text-base font-semibold"
                      >
                        What the Tool Does
                      </h3>
                      <div className="mt-3 space-y-3 text-base leading-relaxed text-muted-foreground">
                        {tool}
                      </div>
                    </section>
                  </CardContent>
                </Card>
              </section>
            </li>
          );
        })}
      </ol>

      <div className="mt-8 flex justify-center">
        <Button asChild variant="secondary" className="border border-border/70">
          <Link
            href="/medalrecommendation"
            className="!text-secondary-foreground hover:!text-secondary-foreground hover:!no-underline"
          >
            Return to Home
          </Link>
        </Button>
      </div>
    </main>
  );
}
