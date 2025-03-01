import {exec} from 'child_process';
import {Storage} from '@google-cloud/storage';
import path from 'path';
import express from 'express'
import dotenv from 'dotenv';
import { fileURLToPath } from "url";


const app = express();
dotenv.config();
const PORT = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = new Storage(
    {keyFileName : path.join(__dirname,"service-account.json")}
)

const BUCKET_NAME = process.env.GCS_BUCKET;

// Function to compile front-end code
function compileFrontend() {
    return new Promise((resolve, reject) => {
      exec("npm run build", (error, stdout, stderr) => {
        if (error) {
          console.error("Error during compilation:", error);
          reject(error);
        } else {
          console.log("Compilation Error Output:", stdout);
          resolve();
        }
      });
    });
  }

  async function uploadFiles() {
    const distPath = path.join(__dirname, "/public");
    console.log("distPath : " ,distPath)

    const [files] = await storage.bucket(BUCKET_NAME).upload(distPath, {
      destination: "public/",
      recursive: true,
    });
  
    console.log("Files uploaded successfully:", files.map(file => file.name));
  }


  app.get("/deploy", async (req, res) => {
    try {
      await compileFrontend();
      console.log("build completed")
      await uploadFiles();
      res.send("Deployment successful!");
    } catch (error) {
      res.status(500).send("Deployment failed: " + error.message);
    }
  });

  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
