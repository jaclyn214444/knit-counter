const fs = require('fs');
const compiler = require('@babel/parser');

try {
  const code = fs.readFileSync('d:/knit/程式檔/src/components/InventoryManager.jsx', 'utf8');
  compiler.parse(code, {
    sourceType: 'module',
    plugins: ['jsx']
  });
  console.log('Valid syntax!');
} catch (e) {
  console.log('Syntax error at line ' + e.loc.line + ' column ' + e.loc.column);
  console.log(e.message);
}
