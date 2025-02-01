const simpleGit = require('simple-git');
const fs = require("fs");
async function fetchRepository(repoUrl, localPath) {
    const git = simpleGit();
    
    try {
      if (fs.existsSync(localPath)) {
        console.log('Pulling latest changes...');
        await git.cwd(localPath).pull();
      } else {
        console.log('Cloning repository...');
        await git.clone(repoUrl, localPath);
      }
      console.log('Repository is ready!');
    } catch (error) {
      console.error('Error fetching repository:', error);
    }
  }
export default fetchRepository;
