import os from 'os'

export function getMachineInfo() {
  const [avg1m, avg5m, avg10m] = os.loadavg()
  return {
    type: os.type(),
    platform: os.platform(),
    version: os.version(),
    release: os.release(),
    hostname: os.hostname(),
    arch: os.arch(),
    memory: {total: os.totalmem(), free: os.freemem()},
    uptime: os.uptime(),
    loadavg: {avg1m, avg5m, avg10m},
  }
}
