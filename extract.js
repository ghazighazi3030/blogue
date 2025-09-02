const fs = require('fs');
const yauzl = require('yauzl');
const path = require('path');

// Find the zip file
const files = fs.readdirSync('.');
const zipFile = files.find(file => file.endsWith('.zip'));

if (!zipFile) {
  console.log('No zip file found');
  process.exit(1);
}

console.log(`Extracting ${zipFile}...`);

yauzl.open(zipFile, { lazyEntries: true }, (err, zipfile) => {
  if (err) {
    console.error('Error opening zip file:', err);
    process.exit(1);
  }

  zipfile.readEntry();
  
  zipfile.on('entry', (entry) => {
    if (/\/$/.test(entry.fileName)) {
      // Directory entry
      const dirPath = entry.fileName.slice(0, -1);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      zipfile.readEntry();
    } else {
      // File entry
      const filePath = entry.fileName;
      const dirPath = path.dirname(filePath);
      
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      zipfile.openReadStream(entry, (err, readStream) => {
        if (err) {
          console.error('Error reading entry:', err);
          zipfile.readEntry();
          return;
        }
        
        const writeStream = fs.createWriteStream(filePath);
        readStream.pipe(writeStream);
        
        writeStream.on('close', () => {
          console.log(`Extracted: ${filePath}`);
          zipfile.readEntry();
        });
      });
    }
  });
  
  zipfile.on('end', () => {
    console.log('Extraction complete!');
    console.log('\nExtracted contents:');
    
    // List extracted directories
    const extractedFiles = fs.readdirSync('.');
    extractedFiles.forEach(file => {
      const stats = fs.statSync(file);
      if (stats.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        console.log(`- ${file}/ (directory)`);
      }
    });
  });
});