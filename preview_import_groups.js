const fs = require('fs');
const path = require('path');
const root = path.join(process.cwd(), 'src');
const isBare = (s) => !s.startsWith('.') && !s.startsWith('/') && !s.startsWith('@/');
const classify = (line, source) => {
  if (line.startsWith('import type')) return 'Types';
  if (source.match(/\.(css|png|svg|jpg|jpeg|gif|json)$/)) return 'Styles';
  if (isBare(source)) return 'Modules';
  if (source.startsWith('@/')) {
    if (source.includes('/types')) return 'Types';
    if (source.includes('/hooks/')) return 'Hooks';
    if (source.includes('/store/')) return 'Store';
    if (source.includes('/pages/')) return 'Pages';
    if (source.includes('/components/')) return source.includes('@/components/') ? 'Global components' : 'Feature components';
    if (source.includes('/utils/')) return 'Utils';
    return 'Local components';
  }
  if (source.startsWith('./') || source.startsWith('../')) {
    if (source.includes('/types') || source.includes('./types') || source.includes('../types')) return 'Types';
    if (source.includes('/hooks/') || source.includes('./hooks') || source.includes('../hooks')) return 'Hooks';
    if (source.includes('/store/') || source.includes('./store') || source.includes('../store')) return 'Store';
    if (source.includes('/pages/') || source.includes('./pages') || source.includes('../pages')) return 'Pages';
    if (source.includes('/components/') || source.includes('./components') || source.includes('../components')) return 'Local components';
    if (source.includes('/utils/') || source.includes('./utils') || source.includes('../utils')) return 'Utils';
    return 'Local components';
  }
  return 'Other';
};

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.tsx?$/.test(entry.name)) {
      const lines = fs.readFileSync(full, 'utf8').split(/\r?\n/);
      let start = -1;
      let end = -1;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (start === -1) {
          if (line.trim().startsWith('import')) start = i;
          else if (line.trim() === '') continue;
          else break;
        } else {
          if (line.trim() === '' || line.trim().startsWith('import') || line.trim().startsWith('//')) end = i;
          else break;
        }
      }
      if (start !== -1) {
        const imports = [];
        for (let i = start; i <= end; i++) {
          const line = lines[i].trim();
          if (line.startsWith('import')) imports.push(line);
        }
        if (imports.length) {
          console.log(full.replace(process.cwd()+path.sep, ''));
          for (const line of imports) {
            const source = line.replace(/.*from\s+['\"]([^'\"]+)['\"].*/, '$1');
            console.log('  ', classify(line, source), line);
          }
          console.log('');
        }
      }
    }
  }
}

walk(root);
