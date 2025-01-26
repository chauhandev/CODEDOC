// generateDocument.js
const fs = require('fs');
const path = require('path');

// Function to read file contents
async function readFile(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return null;
  }
}

// Function to get all files in a directory recursively
async function getFiles(dir) {
    try {
      const dirents =  fs.readdirSync(dir, { withFileTypes: true });
      const files = await Promise.all(
        dirents.map((dirent) => {
          const res = path.resolve(dir, dirent.name);
  
          // Skip `node_modules` directory
          if (dirent.isDirectory() && dirent.name === 'node_modules') {
            return [];
          }
  
          return dirent.isDirectory() ? getFiles(res) : res;
        })
      );
      return files.flat();
    } catch (error) {
      console.error(`Error reading directory ${dir}:`, error);
      return [];
    }
  }

// Function to process files and generate the initial document content (no AI)
async function createProjectDocumentationStructure(projectPath) {
  const files = await getFiles(projectPath);
  const documentation = [];

  for (const file of files) {
    if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.tsx')) {
      const content =  fs.readFileSync(file);
      if (content) {
        const relativePath = path.relative(projectPath, file);
        documentation.push({
          filePath: file,
          relativePath: relativePath,
          content: content,
        });
      }
    }
  }

  return documentation;
}

module.exports = { createProjectDocumentationStructure };