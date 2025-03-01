import { exec } from "child_process";
import { Storage } from "@google-cloud/storage";
import path from "path";
import fs from "fs";
import express from "express";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = new Storage({
  keyFilename: path.join(__dirname, "service-account.json"),
});

const BUCKET_NAME = process.env.GCS_BUCKET;
const bucket = storage.bucket(BUCKET_NAME); // ✅ Define the bucket globally

// Function to compile front-end code
function compileFrontend() {
  return new Promise((resolve, reject) => {
    exec("npm run build", (error, stdout, stderr) => {
      if (error) {
        console.error("Error during compilation:", stderr);
        reject(error);
      } else {
        console.log("Build Output:", stdout);
        resolve();
      }
    });
  });
}

// Function to upload files & directories to GCS
async function uploadFiles(directory, basePath = "") {
  if (!fs.existsSync(directory)) {
    console.error(`Error: Directory ${directory} does not exist.`);
    return;
  }

  const items = fs.readdirSync(directory);

  for (const item of items) {
    const fullPath = path.join(directory, item);
    const relativePath = path.join(basePath, item);

    if (fs.statSync(fullPath).isDirectory()) {
      await uploadFiles(fullPath, relativePath); // ✅ Recursive call for subdirectories
    } else {
      await bucket.upload(fullPath, {
        destination: `${relativePath}`, // ✅ Preserve folder structure
        gzip: true,
        metadata: {
          cacheControl: "public, max-age=31536000",
        },
      });

      console.log(`Uploaded: ${relativePath}`);
    }
  }
}

app.get("/deploy", async (req, res) => {
  try {
    await compileFrontend();
    console.log("Build completed");

    const publicPath = path.resolve(__dirname, "public"); // ✅ Ensure correct directory
    await uploadFiles(publicPath);

    res.send("Deployment successful!");
  } catch (error) {
    console.error("Deployment failed:", error);
    res.status(500).send("Deployment failed: " + error.message);
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
