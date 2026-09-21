// Reports the image's release tag so the deploy workflow can tell when the
// new container is the one serving. The Dockerfile sets APP_VERSION from its
// ARG VERSION; a local build has no tag and answers "dev".
export function GET() {
  return Response.json(
    { version: process.env.APP_VERSION || "dev" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
