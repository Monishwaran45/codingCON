/**
 * Cluster Configuration for Node.js
 * Enables multi-core CPU utilization for handling 500+ concurrent users
 * - Uses OS CPU count to spawn worker processes
 * - Sticky sessions for Socket.IO via ip_hash
 * - Graceful restart on worker crashes
 */

import cluster from 'cluster';
import os from 'os';
import process from 'process';

const NUM_CPUS = process.env.WORKERS ? parseInt(process.env.WORKERS, 10) : os.cpus().length;

export function initCluster(startServer: () => void): void {
  if (cluster.isPrimary) {
    console.log(`\n🎯 PRIMARY PROCESS [${process.pid}]`);
    console.log(`📊 Starting ${NUM_CPUS} worker processes...`);
    console.log(`💾 Total Memory: ${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB\n`);

    // Spawn worker processes
    for (let i = 0; i < NUM_CPUS; i++) {
      cluster.fork();
    }

    // Handle worker exits and restart
    cluster.on('exit', (worker, code, signal) => {
      if (signal) {
        console.log(`⚠️  Worker [${worker.process.pid}] killed by signal: ${signal}`);
      } else if (code !== 0) {
        console.log(`❌ Worker [${worker.process.pid}] exited with code ${code}`);
        console.log(`🔄 Restarting worker...`);
        cluster.fork();
      } else {
        console.log(`✓ Worker [${worker.process.pid}] exited gracefully`);
      }
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('\n📛 SIGTERM received - starting graceful shutdown...');
      for (const id in cluster.workers) {
        cluster.workers[id]?.kill();
      }
      process.exit(0);
    });

    process.on('SIGINT', () => {
      console.log('\n📛 SIGINT received - starting graceful shutdown...');
      for (const id in cluster.workers) {
        cluster.workers[id]?.kill();
      }
      process.exit(0);
    });
  } else {
    // Worker process
    console.log(`   🔄 Worker [${process.pid}] started`);
    startServer();
  }
}

export { NUM_CPUS };
