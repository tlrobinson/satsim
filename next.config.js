// next.config.js
const withWorkers = require("@zeit/next-workers");
module.exports = withWorkers({
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
});
