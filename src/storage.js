const fs = require('node:fs');
const path = require('node:path');

function createStorage(filePath, prefix) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const readAll = () => {
    if (!fs.existsSync(filePath)) return [];
    const raw = fs.readFileSync(filePath, 'utf8');
    return raw.trim() ? JSON.parse(raw) : [];
  };

  const writeAll = (records) => {
    const tmp = `${filePath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(records, null, 2));
    fs.renameSync(tmp, filePath);
  };

  return {
    filePath,
    list: readAll,
    count: () => readAll().length,
    save(data, env) {
      const records = readAll();
      const record = {
        radicado: `${prefix}-${String(records.length + 1).padStart(4, '0')}`,
        ...data,
        ambiente: env,
        creadoEn: new Date().toISOString(),
      };
      records.push(record);
      writeAll(records);
      return record;
    },
    clear: () => writeAll([]),
  };
}

module.exports = { createStorage };
