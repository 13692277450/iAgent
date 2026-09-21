module.exports = {
  apps: [
    {
      name: "iagent",
      script: "./node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: "/var/www/html/iagent",         // 🚨 Linux 上的绝对路径
      instances: 1,                  // 先用 1 个实例测试，稳定后可改 "max"
      exec_mode: "fork",             // Next.js 的 next start 不支持 cluster，用 fork
      watch: false,
      max_memory_restart: "2G",      // 内存超过 1G 自动重启
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
