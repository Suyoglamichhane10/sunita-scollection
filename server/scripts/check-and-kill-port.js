const { execSync } = require('child_process');
const net = require('net');
const readline = require('readline');

const port = process.env.PORT || 5000;
const host = '127.0.0.1';

function checkPort(port, cb) {
  const socket = new net.Socket();
  let called = false;
  socket.setTimeout(1000);
  socket.on('connect', () => {
    called = true;
    socket.destroy();
    cb(true);
  });
  socket.on('timeout', () => { if (!called) { called = true; socket.destroy(); cb(false); } });
  socket.on('error', () => { if (!called) { called = true; cb(false); } });
  socket.connect(port, host);
}

function getPidOnPort(port) {
  const isWin = process.platform === 'win32';
  try {
    if (isWin) {
      const out = execSync(`netstat -ano | findstr :${port}`).toString();
      const lines = out.trim().split(/\r?\n/).filter(Boolean);
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0') return pid;
      }
    } else {
      const out = execSync(`lsof -i :${port} -t 2>/dev/null`).toString();
      const pid = out.trim().split(/\r?\n/)[0];
      if (pid) return pid;
    }
  } catch (e) {
    return null;
  }
  return null;
}

function getProcessName(pid) {
  try {
    if (process.platform === 'win32') {
      const out = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`).toString();
      const cols = out.trim().split('","');
      if (cols.length) {
        return cols[0].replace(/^"/, '').replace(/"$/, '');
      }
    } else {
      const out = execSync(`ps -p ${pid} -o comm=`).toString().trim();
      return out;
    }
  } catch (e) {
    return '';
  }
}

function promptKill(pid, procName) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(`Port ${port} is in use by PID ${pid} (${procName}). Kill it? (y/N): `, (ans) => {
      rl.close();
      resolve(/^y(es)?$/i.test(ans));
    });
  });
}

function killPid(pid) {
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${pid} /F`);
    } else {
      process.kill(pid, 'SIGKILL');
    }
    return true;
  } catch (e) {
    return false;
  }
}

(async () => {
  checkPort(port, async (inUse) => {
    if (!inUse) return process.exit(0);
    const pid = getPidOnPort(port);
    const name = pid ? getProcessName(pid) : '';
    const kill = await promptKill(pid || 'unknown', name || 'unknown');
    if (!kill) {
      console.log('Aborting start; port still in use.');
      return process.exit(1);
    }
    const ok = killPid(pid);
    if (ok) {
      console.log(`Killed process ${pid}.`);
      setTimeout(() => process.exit(0), 500);
    } else {
      console.log(`Failed to kill process ${pid}.`);
      process.exit(1);
    }
  });
})();
