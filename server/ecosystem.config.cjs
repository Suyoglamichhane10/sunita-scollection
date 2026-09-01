module.exports = {
  apps: [
    {
      name: 'sunitas-collection-api',
      script: 'server/src/server.js',
      cwd: process.cwd(),
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: process.env.PORT || 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 5000,
      },
      max_memory_restart: '350M',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: 'server/logs/err.log',
      out_file: 'server/logs/out.log',
      merge_logs: true,
      max_restarts: 10,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};
