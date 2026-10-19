/** @type {import('next').NextConfig} */
module.exports = {
  // Repo root also has a package-lock.json, so Turbopack's root inference is
  // ambiguous. Pin the client dir as the workspace root.
  turbopack: {
    root: __dirname,
  },
  images: {
    // Retain the default quality and allow the detailed landing medal artwork
    // to opt into higher quality without changing other images' defaults.
    qualities: [75, 90],
  },
  async headers() {
    return [
      {
        source: "/_next/static/chunks/app/skunkworks/:path*.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=600, must-revalidate",
          },
        ],
      },
    ];
  },
};
