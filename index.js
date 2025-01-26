const express = require('express');
const sql = require('mssql');
const dotenv = require('dotenv');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const {createProjectDocumentationStructure} = require('./generateDocument.js');
const {fetchRepository} = require('./fetchFromGit.js');
dotenv.config();
const path = require('path');
const fs = require('fs');
const { pathExists } = require('fs-extra');
const app = express();
const port = process.env.PORT || 5000;
const repoUrl = 'https://github.com/your-username/your-repo.git';

app.use(cors());
app.use(express.json());

const dbConfig = {
    server: process.env.SQL_SERVER,
    database: process.env.SQL_DATABASE,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    options: {
        encrypt: false,
        trustServerCertificate: true,
    }
};
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-thinking-exp-01-21" });

async function getDatabaseSchema() {
    let pool;
    try {
        pool = await sql.connect(dbConfig);
        const result = await pool.request().query('SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS ORDER BY TABLE_NAME, ORDINAL_POSITION');
        
        // Format schema info
        const schemaInfo = {};
        result.recordset.forEach(row => {
            if (!schemaInfo[row.TABLE_NAME]) {
                schemaInfo[row.TABLE_NAME] = [];
            }
            schemaInfo[row.TABLE_NAME].push({
                column: row.COLUMN_NAME,
                dataType: row.DATA_TYPE
            });
        });
       return schemaInfo;

    } catch (error) {
        console.error("Error getting schema:", error);
        return null;
    } finally {
        if (pool) {
            sql.close();
        }
    }
}
function formatSchemaForPrompt(schemaInfo) {
    let schemaString = "Database schema:\n";
    for (const tableName in schemaInfo) {
        schemaString += `Table: ${tableName}\n`;
        schemaInfo[tableName].forEach(columnInfo => {
            schemaString += ` - Column: ${columnInfo.column} (Data Type: ${columnInfo.dataType})\n`;
        });
    }
    return schemaString;
}
async function generateSqlQuery(naturalLanguageQuery) {
    const schemaInfo = await getDatabaseSchema();
    if (!schemaInfo) {
        return null;
    }
    const formattedSchema = formatSchemaForPrompt(schemaInfo);
    const prompt =  `
    Given the following database schema:
    ${formattedSchema}
    
    Translate the following natural language query into an SQL query compatible with SQL Server:
    "${naturalLanguageQuery}"
    
    Please generate only the SQL query without any additional text or explanation.
    `;
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const sqlQueryWithFormatting = response.text();
        const sqlQuery = sqlQueryWithFormatting.replace(/```sql|```/g, '').trim();
        return sqlQuery;
    }
    catch (error) {
        console.error("Gemini API Error: ", error);
        return null;
    }
}
app.post('/query', async (req, res) => {
    const { naturalLanguageQuery } = req.body;
    if (!naturalLanguageQuery) {
        return res.status(400).send("Bad request: no query was provided.");
    }

    try {
        const sqlQuery = await generateSqlQuery(naturalLanguageQuery);
        if (!sqlQuery) {
            return res.status(500).send("Failed to generate SQL query using Gemini.")
        }
        console.log("Generated SQL: ", sqlQuery);
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query(sqlQuery);
        res.json(result.recordset);
    } catch (error) {
        console.error("Database or Gemini error:", error);
        res.status(500).send("Error executing query.");
    } finally {
        sql.close();
    }
});

app.post('/generalquery', async (req, res) => {
    const { naturalLanguageQuery } = req.body;
    if (!naturalLanguageQuery) {
        return res.status(400).send("Bad request: no query was provided.");
    }

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');

    try {
        const prompt = `${naturalLanguageQuery}`;
        const result = await model.generateContentStream(prompt);
        
        for await (const chunk of result.stream) {
            const text = chunk.text();
            res.write(text);
        }
        
        res.end();
    } catch (error) {
        console.error("Gemini API Error: ", error);
        if (!res.headersSent) {
            return res.status(500).json({ error: "Internal server error." });
        }
        res.end();
    }
});

app.get('/generateDocument', async (req, res) => {
    try {
        const gitRepo = req.query.gitRepo;
        await fetchRepository(gitRepo,projectPath);
        const fileName = outputFileName+Date.now()+".md";
        await generateProjectDocumentation(projectPath, customSystemMessage, fileName);
        const filePath = path.join(projectPath, fileName);
        return res.sendFile(filePath);     
    } catch (error) {
        console.error("Error generating document ", error);
        return res.status(500).json({ error: "Internal server error." });
    }
       
});

app.post('/generateDocument', async (req, res) => {
    try {
            const { fileContent , userPrompt} = req.body;
        if (!fileContent) {
            return res.status(400).send("Bad request: no content provided");
        }
        let extension = ".md";

        if(userPrompt){
            extension =  await getExtensionAsPerUserPrompt(userPrompt);
            extension = extension.trim();
        }
        const fileData= {
            filePath: "UserInput",
            relativePath: "UserInput",
            content: fileContent,
        }
        const fileDoc = await generateFileDocumentation(fileData.filePath, fileData.content, customSystemMessage,userPrompt,true);
        const fileDocUpdated = fileDoc.replace(/```json|```/g, '').trim();

        return res.send(fileDocUpdated);    
    } catch (error) {
        console.error("Error generating document ", error);
        return res.status(500).json({ error: "Internal server error." });
    }
    
});

async function getExtensionAsPerUserPrompt(userPrompt){
    const defaultSystemMessage = `Identify the file extension of the given content.`;
    const prompt = `
    ${defaultSystemMessage}
    
    Please analyze the following content and provide the file extension only the extension nothing else. Like .md, .txt, .js ,.docx,.ppt etc.
    
    ${userPrompt}
    `;
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return text;
      } catch (error) {
        console.error(`Error fetching file extension:`, error);
        return `Error fetching file extension.`;
      }

}
// Function to generate documentation using Gemini
async function generateFileDocumentation(filePath, fileContent, customSystemMessage = null ,userPrompt, singleFile = false) {

    const systemInstruction = "You are a helpful assistant specialized in analyzing source code and generating detailed technical documentation.";
   
    const defaultSystemMessage = `You are a helpful assistant specialized in analyzing source code and generating documentation in the format as asked by user.`;

    const systemMessage = customSystemMessage || defaultSystemMessage;

    let documentFormatPrompt  = `
     Include the following in your documentation:
    1. A brief description of what the code does
    2. Any important functions or classes and their purposes
    2. Any important queies and their purposes
    3. Any notable dependencies or imports
    4. Any potential improvements or best practices that could be applied
    5. Any flow chart to represent the functionality (Mermaid flow chart and make sure to not use parantheses).
    6. Any ER diagram to represent the database schema (Mermaid ER Diagram and make sure to not use parantheses).
    6. Document should be well structured and easy to understand.
    7. No other information should be included in the documentation.
    8. Copying pasting the response should be enough to get the documentation. 
    `
    if(singleFile)
        documentFormatPrompt += `9. Please provide the documentation in strictly in JSON format with key as the Headinng and value as the content. Provide content in following structure 
        
        interface Documentation {
        Description?: string;
        Functions?: Array<{
            Name: string;
            Purpose: string;
        }>;
        Queries?: Array<string>;
        Dependencies?: Array<{
            Module: string;
            Purpose: string;
        }>;
        Improvements?: Array<{
            Improvement: string;
            Details: string;
        }>;
        Flowchart?:  Array<{
            Heading: string;
            Chart: string;
        }>;
        "ER Diagram"?: Array<{
            Heading: string;
            Chart: string;
        }>;
        }
        If there is no Flowchart or ER Diagram then you can provide empty array for them.
        `   
    
    const prompt = `
    ${systemInstruction}
    Please analyze the following ${path.extname(filePath)} code and provide a brief documentation:
    ${fileContent}
    ${documentFormatPrompt}
    ${userPrompt}
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return text;
      } catch (error) {
        console.error(`Error generating documentation for ${filePath}:`, error);
        return `Error generating documentation.`;
      }
}


// Main function to handle full documentation generation
async function generateProjectDocumentation(projectPath, customSystemMessage = null, outputFileName = 'PROJECT_DOCUMENTATION.md') {
  const fileData = await createProjectDocumentationStructure(projectPath);
  const documentation = [];

  for (const fileInfo of fileData) {
    console.log(`Generating documentation for ${fileInfo.relativePath}...`);
    const fileDoc = await generateFileDocumentation(fileInfo.filePath, fileInfo.content, customSystemMessage);
    documentation.push(`## ${fileInfo.relativePath}\n\n${fileDoc}\n\n`);
  }
    const fullDocumentation = `# Project Documentation\n\n${documentation.join('---\n\n')}`;

  try {
    await fs.writeFileSync(path.join(projectPath, outputFileName), fullDocumentation);
    console.log('Documentation generated successfully!');
  } catch (error) {
    console.error('Error writing documentation file:', error);
  }
}


// Usage example
const projectPath = path.join(__dirname, 'Repo'); 
const documentPath = path.join(__dirname, 'DocumentationRepo'); 
const customSystemMessage = process.env.CUSTOM_SYSTEM_MESSAGE; // sOptional custom system message
const outputFileName = process.env.OUTPUT_FILE_NAME || 'PROJECT_DOCUMENTATION';

async function main() {
  console.log('Starting documentation generation...');
  await generateProjectDocumentation(projectPath, customSystemMessage, outputFileName);
  console.log('Documentation process completed.');
}

// main();

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
    if (!fs.existsSync(documentPath)) {
        fs.mkdirSync(documentPath, { recursive: true }); 
    }

    sql.connect(dbConfig).then(() => {  
        console.log("Connected to database");
    }).catch(error => { 
        console.error("Error connecting to database:", error);
    });
});
