import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sql from 'mssql'
import { GoogleGenerativeAI } from '@google/generative-ai';
import createProjectDocumentationStructure from './generateDocument.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const app = express();
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.join(__dirname, "public");

app.use(express.static(clientDistPath));


const port = process.env.PORT || 5000;
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

const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

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
app.get("*", (req, res) => {
    res.sendFile(path.join(clientDistPath, "index.html"));
});

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
    const { messages, userPrompt } = req.body;
    if (!userPrompt) {
        return res.status(400).send("Bad request: no prompt was provided.");
    }

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');

    try {
        const prompt = `This is the previous conversation between user and assistant (You are the assistant)
             ${JSON.stringify(messages)} 
            1) Provide a response to the user's query analyzing the previous conversation between the user and assistant (YOU).
            2) The user's new query is: ${userPrompt}
            3) The response should be based on the previous conversation but should not explicitly mention it.
            4) Provide the response as if it was asked to you directly in markdown format.`;

        const result = await model.generateContentStream(prompt);

        // Stream the response in smaller chunks
        for await (const chunk of result.stream) {
            const text = chunk.text();
            // Split the text into smaller chunks (e.g., word by word or sentence by sentence)
            const words = text.split(' ');
            for (const word of words) {
                res.write(word + ' '); // Send each word with a space
                await new Promise(resolve => setTimeout(resolve, 50)); // Add a small delay for effect
            }
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

app.post('/generateDocument', async (req, res) => {
    try {
        const { fileContent, userPrompt } = req.body;

        // Validate file content
        if (!fileContent) {
            return res.status(400).send("Bad request: no content provided");
        }

        // Determine file extension based on user prompt (default to .md)
        let extension = ".md";
        if (userPrompt) {
            extension = await getExtensionAsPerUserPrompt(userPrompt);
            extension = extension.trim();
        }

        // Prepare file data for documentation
        const fileData = {
            filePath: "UserInput" + extension,
            relativePath: "UserInput",
            content: fileContent,
        };

        // Generate documentation
        const fileDoc = await generateFileDocumentation(fileData.filePath, fileData.content, null, userPrompt, true);
        const fileDocUpdated = fileDoc.replace(/```json|```/g, '').trim();

        // Send the response
        return res.send(fileDocUpdated);
    } catch (error) {
        console.error("Error generating document: ", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

app.post('/convert', async (req, res) => {
    try {
      if (!req.files || !req.files.pdf) {
        return res.status(400).send('No PDF file uploaded.');
      }
  
      // Get the uploaded PDF file
      const pdfFile = req.files.pdf;
  
      // Convert PDF to DOCX (example using pdf2docx)
    //   const docxBuffer = await convert(pdfFile.data);
  
    //   // Send the DOCX file back to the client
    //   res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    //   res.setHeader('Content-Disposition', 'attachment; filename=converted.docx');
    //   res.send(docxBuffer);
    } catch (error) {
      console.error('Error during conversion:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  
/**
 * Determines the file extension based on the user prompt.
 */
async function getExtensionAsPerUserPrompt(userPrompt) {
    const defaultSystemMessage = `Identify the file extension of the given content.`;
    const prompt = `
    ${defaultSystemMessage}
    
    Please analyze the following content and provide ONLY the file extension (e.g., .md, .txt, .js, .docx, .ppt, etc.).
    
    ${userPrompt}
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        return text;
    } catch (error) {
        console.error(`Error fetching file extension:`, error);
        return `.md`; // Default to .md if there's an error
    }
}

/**
 * Generates documentation for a file using AI.
 */
async function generateFileDocumentation(filePath, fileContent, customSystemMessage = null, userPrompt, singleFile = false) {
    const systemInstruction = "You are a helpful assistant specialized in analyzing source code and generating detailed technical documentation.";
    const defaultSystemMessage = `You are a helpful assistant specialized in analyzing source code and generating documentation in the format requested by the user.`;
    const systemMessage = customSystemMessage || defaultSystemMessage;

    // Define the documentation format prompt
    let documentFormatPrompt = `
        Include the following in your documentation:
        1. A brief description of what the code does.
        2. Any important functions or classes and their purposes.
        3. Any important queries and their purposes including queries used if present.
        4. Any notable dependencies or imports.
        5. Any potential improvements or best practices that could be applied.
        6. A flowchart to represent the functionality (Mermaid flow chart, without parentheses) ONLY if applicable.
        7. An ER diagram to represent the database schema (Mermaid ER Diagram, without parentheses) ONLY if applicable.
        8. The document should be well-structured and easy to understand.
        9. No irrelevant information should be included in the documentation.
        10. Copying and pasting the response should be sufficient to get the documentation.
    `;

    // Add JSON format instructions for single-file documentation
    if (singleFile) {
        documentFormatPrompt += `
        11. Provide the documentation strictly in JSON format with the following structure:
        
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
            Flowchart?: Array<{
                Heading: string;
                Chart: string;
            }>;
            "ER Diagram"?: Array<{
                Heading: string;
                Chart: string;
            }>;
        }
        `;
    }

    // Construct the final prompt for the AI
    const prompt = `
    ${systemInstruction}
    Please analyze the following ${path.extname(filePath)} code and provide a detailed documentation:
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


// main();

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
    // if (!fs.existsSync(documentPath)) {
    //     fs.mkdirSync(documentPath, { recursive: true }); 
    // }

    // // sql.connect(dbConfig).then(() => {  
    //     console.log("Connected to database");
    // }).catch(error => { 
    //     console.error("Error connecting to database:", error);
    // });
});
