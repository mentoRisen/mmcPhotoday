// PM2 process configuration for the Next.js standalone server.
//
// After `npm run build`, the standalone server lives at
// `.next/standalone/server.js`. You must also copy the static assets next to
// it (see README "Deploy" section):
//   cp -r public .next/standalone/public
//   cp -r .next/static .next/standalone/.next/static
//
// Then start with: pm2 start ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "mmc-photoday",
      script: ".next/standalone/server.js",
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        // Bind to all interfaces so nginx on the same host can reach it.
        HOSTNAME: "0.0.0.0",
        PORT: 3002,
        // Set the real value on the server; do not commit secrets.
        // DATABASE_URL: "mysql://user:pass@127.0.0.1:3306/photoday",
      },
    },
  ],
};
