const fs = require('fs');
const path = require('path');

const updates = [
  {
    file: 'src/pages/SignupPage.jsx',
    importPath: '../assets/logo.png',
  },
  {
    file: 'src/pages/Login.jsx',
    importPath: '../assets/logo.png',
  },
  {
    file: 'src/pages/LandingPage.jsx',
    importPath: '../assets/logo.png',
  },
  {
    file: 'src/components/layout/Footer.jsx',
    importPath: '../../assets/logo.png',
  },
  {
    file: 'src/components/layout/NavBar.jsx',
    importPath: '../../assets/logo.png',
  },
  {
    file: 'src/components/layout/StudentLayout.jsx',
    importPath: '../../assets/logo.png',
  },
  {
    file: 'src/components/layout/AdminLayout.jsx',
    importPath: '../../assets/logo.png',
  },
];

for (const update of updates) {
  const filePath = path.join(__dirname, update.file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip if already imported
  if (!content.includes('import logoImg from')) {
    // Add import after other imports
    const lines = content.split('\n');
    const lastImportIndex = lines.findLastIndex(line => line.startsWith('import '));
    lines.splice(lastImportIndex + 1, 0, `import logoImg from '${update.importPath}';`);
    content = lines.join('\n');
  }

  // Replace src="/logo.png" with src={logoImg}
  content = content.replace(/src="\/logo\.png"/g, 'src={logoImg}');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${update.file}`);
}
