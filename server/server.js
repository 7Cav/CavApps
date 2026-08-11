const middleware = require("./routes");
const express = require("express");
const compression = require("compression");
const app = express();
const cors = require("cors");
const port = 4000;
const CLIENT_TOKEN = process.env.CLIENT_TOKEN;
const { cacheTime, initializeCache } = require("./controllers/cacheManager");
const { initDatabase } = require("./db/database");
const diffRoutes = require("./routes/diffRoutes");
const { startPoller } = require("./controllers/diffPoller");

const corsOptions = {
  origin: function (origin, callback) {
    const allowlist = [
      "http://localhost",
      "http://localhost:3000",
      "http://localhost/",
      "http://apps.7cav.us",
      "https://apps.7cav.us",
      "https://apps.7cav.us/",
      "http://appsbeta.7cav.us",
      "https://appsbeta.7cav.us",
      "https://appsbeta.7cav.us/",
    ];
    if (allowlist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

// Token Checking Middleware
const checkToken = (req, res, next) => {
  if (req.method === "OPTIONS") {
    return next();
  }

  const authToken = req.headers["authorization"];
  if (authToken === CLIENT_TOKEN) {
    next();
  } else {
    res.status(403).send("Forbidden");
  }
};

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `${new Date().toISOString()} | ${req.method} ${req.originalUrl} | ${
        res.statusCode
      } | ${duration}ms | origin=${req.headers["origin"] || "-"}`,
    );
  });
  next();
});

app.use(compression());

app.use(
  cors({
    origin: corsOptions.origin,
  }),
);
// Public, unauthenticated endpoints. These must be registered before the
// token gate below — the container healthcheck (curl http://localhost:4000)
// and the client's readiness probe (wget --spider http://server:4000) both
// hit GET / with no auth header, so it has to answer 200 without the token.
// /cache-timestamp is likewise public, as it was before the diff routes landed.
app.get("/", (req, res) => {
  res.send(
    "Server Test Page Loaded Successfully. Any issues? Submit a ticket to S6! Frontend is at https://apps.7cav.us/",
  );
});

app.get("/cache-timestamp", (req, res) => {
  res.json({ cacheTime });
});

// Apply token checking middleware only to these routes
app.use("/roster", checkToken, middleware);
// All diff routes (read views + operator /admin endpoints) sit behind the same
// token check as /roster; the client sends NEXT_PUBLIC_CLIENT_TOKEN.
app.use(checkToken, diffRoutes);

// Terminal error handler — backstop for anything a route's own try/catch misses
// (incl. sync throws and the CORS origin rejection). Without this, an uncaught
// error hangs the request with no response or log.
app.use((err, req, res, next) => {
  console.error(
    `${req.method} ${req.originalUrl} unhandled:`,
    err.stack || err.message || err,
  );
  if (res.headersSent) return next(err);
  res.status(500).json({ error: "internal error" });
});

// Async function to initialize the server
const startServer = async () => {
  try {
    console.log("Initializing cache...");
    await initializeCache(); // Ensure cache initialization completes before proceeding
    console.log("Cache initialized successfully.");

    await initDatabase();
    startPoller(process.env.DIFF_POLL_SCHEDULE || "*/15 * * * *");

    app.listen(port, () => {
      console.log(`Roster Server listening on ${port}`);
    });
  } catch (error) {
    console.error(
      "Error initializing cache:",
      error.stack || error.message || String(error),
    );
    process.exit(1); // Exit the process if initialization fails
  }
};

startServer();
