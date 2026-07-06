const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.jsx'));
files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  c = c.replace(/from '(\.\.|\.)\/(components|utils|lib|screens)\//g, "from './");
  fs.writeFileSync(f, c);
});
console.log('Fixed imports');
