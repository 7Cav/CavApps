// The repo runs its tests as plain node scripts rather than under a framework
// (see generateAwardSprites.test.js), so this is the shared scaffolding: run
// each case, keep going after a failure, and report them all at the end.
export function createHarness() {
  const failures = [];
  let ran = 0;

  const test = async (name, run) => {
    ran++;
    try {
      await run();
      console.log(`  ok    ${name}`);
    } catch (error) {
      failures.push({ name, error });
      console.log(`  FAIL  ${name}`);
    }
  };

  // Prints the failures and exits non-zero if there were any, so the npm script
  // fails the build.
  const report = () => {
    console.log("");
    if (failures.length > 0) {
      for (const { name, error } of failures) {
        console.error(`FAIL  ${name}\n${error.message}\n`);
      }
      console.error(`${failures.length} failing`);
      process.exit(1);
    }
    console.log(`all ${ran} passing`);
  };

  return { test, report };
}
