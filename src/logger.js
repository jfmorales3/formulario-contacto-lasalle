const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 };

function createLogger(level = 'info', env = 'development') {
  const threshold = LEVELS[level] ?? LEVELS.info;

  const write = (lvl, message, meta) => {
    if (LEVELS[lvl] < threshold) return;
    const line = `[${new Date().toISOString()}] [${env}] ${lvl.toUpperCase().padEnd(5)} ${message}`;
    const extra = meta ? ` ${JSON.stringify(meta)}` : '';
    (lvl === 'error' ? console.error : console.log)(line + extra);
  };

  return {
    debug: (m, meta) => write('debug', m, meta),
    info: (m, meta) => write('info', m, meta),
    warn: (m, meta) => write('warn', m, meta),
    error: (m, meta) => write('error', m, meta),
  };
}

module.exports = { createLogger };
