const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'db.json');
let data = { teams: {}, pending: {} };

try {
  data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  data.teams ??= {};
  data.pending ??= {};
} catch {}

function save() {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

module.exports = { data, save };
