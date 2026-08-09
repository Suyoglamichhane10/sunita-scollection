module.exports = {
  apps: [{
    name: 'sunitas-collection-api',
    script: 'src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: { NODE_ENV: 'production', PORT: 5000 },
    max_memory_restart: '350M',
    time: true,
  }],
};
