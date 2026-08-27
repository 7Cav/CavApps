// Lets plain Node run the client's tests. The app is built for Next.js, which
// resolves `.jsx` files and extensionless/directory imports for us; Node does
// neither. These hooks add both so a test can import the real modules rather
// than a copy of them.
//
// The `.jsx` files under app/uniformbuilder/modules contain no JSX syntax, so
// they need no transform — only permission to be treated as ES modules.
import { registerHooks } from "node:module";
import { readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

const CANDIDATE_SUFFIXES = ["", ".jsx", ".js", "/index.js"];

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith(".") || specifier.startsWith("/")) {
      for (const suffix of CANDIDATE_SUFFIXES) {
        try {
          const resolved = nextResolve(specifier + suffix, context);
          if (statSync(fileURLToPath(resolved.url)).isFile()) return resolved;
        } catch {
          // Try the next suffix. If none resolve, the unsuffixed call below
          // reports the failure with Node's own message.
        }
      }
    }
    return nextResolve(specifier, context);
  },

  load(url, context, nextLoad) {
    if (url.endsWith(".jsx")) {
      return {
        format: "module",
        source: readFileSync(fileURLToPath(url), "utf8"),
        shortCircuit: true,
      };
    }
    return nextLoad(url, context);
  },
});
