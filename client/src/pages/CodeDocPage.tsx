import type React from "react";
import { useState, useRef } from "react";
import {
  Github,
  Upload,
  FileCode2,
  Loader2,
  Copy,
  Check,
  Download,
} from "lucide-react";
import { DocumentationResult } from "../components/DocumentationResult";
// @ts-ignores
import html2pdf from "html2pdf.js";
// import { Paragraph, HeadingLevel } from "docx";
import { saveAs } from "file-saver";


function CodeDocPage() {
  const [githubUrl, setGithubUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isDocumentGenerated, setisDocumentGenerated] = useState(false);

  const [isJSONreceived, setIsJSONreceived] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleGithubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await generateDocumentation(
      `generateDocument?gitRepo=${encodeURIComponent(
        githubUrl
      )}`
    );
  };

  const handleFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const fileContent = await file.text();
    await generateDocumentation("/generateDocument", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileContent,
        userPrompt: "",
      }),
    });
  };
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };
  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeInput.trim()) return;

    await generateDocumentation("/generateDocument", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileContent: codeInput,
        userPrompt: "",
      }),
    });
  };

  const generateDocumentation = async (url: string, options?: RequestInit) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error("Failed to generate documentation");
      }
      const data = await response.text();

      try {
        const jsonData = JSON.parse(data);
        setIsJSONreceived(true);
        setResult([jsonData]);
      } catch (err) {
        setIsJSONreceived(false);
        setResult(data);
      }
    } catch (error) {
      console.error(error);
      setError("Failed to generate documentation. Please try again.");
    } finally {
      setLoading(false);
      setisDocumentGenerated(true);
    }
  };
  const handleCopy = async () => {
    if (result) {
      try {
        await navigator.clipboard.writeText(JSON.stringify(result));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy text:", err);
      }
    }
  };

  // const handleDownload = async (format: "html" | "pdf" | "docx") => {
  //   if (!contentRef.current) return;
  
  //   if (format === "html") {
  //     const htmlContent = contentRef.current.innerHTML;
  //     const blob = new Blob([htmlContent], { type: "text/html" });
  //     const link = document.createElement("a");
  //     link.href = URL.createObjectURL(blob);
  //     link.download = "documentation.html";
  //     link.click();
  //   } else if (format === "pdf") {
  //     const element = contentRef.current;
  //     const clonedElement = element.cloneNode(true);
  
  //     // Apply styles for PDF
  //     const applyStylesRecursively = (el: Node) => {
  //       if (el instanceof HTMLElement) {
  //         el.style.backgroundColor = "#ffffff";
  //         el.style.color = "#000000";
  //         el.style.pageBreakInside = "avoid";
  //         el.style.overflow = "visible";
  //         el.style.fontFamily = "Arial, sans-serif"; // Ensure consistent font
  //         el.style.lineHeight = "1.5"; // Improve readability
  //         el.style.marginBottom = "4px"; // Add margin for better spacing
  //       }
  
  //       for (let child of (el as HTMLElement).children) {
  //         applyStylesRecursively(child);
  //       }
  //     };
  
  //     applyStylesRecursively(clonedElement);
  
  //     const options = {
  //       margin: 0,
  //       filename: "documentation.pdf",
  //       html2canvas: {
  //         backgroundColor: "#ffffff",
  //         foregroundColor: "#000000",
  //         scale: 1.5,
  //         useCORS: true,
  //       },
  //       jsPDF: {
  //         unit: "mm",
  //         format: "a4",
  //         orientation: "portrait",
  //       },
  //     };
  
  //     html2pdf().from(clonedElement).set(options).save("documentation.pdf");
  //   } else if (format === "docx") {
  //     const docxContent = generateDocxContent();
  //     const doc = new Document({
  //       sections: [{ children: docxContent }],
  //     });
  
  //     const blob = await Packer.toBlob(doc);
  //     saveAs(blob, "documentation.docx");
  //   }
  // };

  const handleDownload = async (format: "html" | "pdf" | "docx") => {
    if (!contentRef.current) return;
  
    // Common PDF generation logic
    const generatePdfBlob = async () => {
      const element = contentRef.current;
      if (!element) return;
      const clonedElement = element.cloneNode(true);
  
      // Apply PDF styles
      const applyStylesRecursively = (el: Node) => {
        if (el instanceof HTMLElement) {
          el.style.backgroundColor = "#ffffff";
          el.style.color = "#000000";
          el.style.pageBreakInside = "avoid";
          el.style.overflow = "visible";
          el.style.fontFamily = "Arial, sans-serif";
          el.style.lineHeight = "1.5";
          el.style.margin = "5px";
        }
        for (let child of (el as HTMLElement).children) {
          applyStylesRecursively(child);
        }
      };
  
      applyStylesRecursively(clonedElement);
  
      const options = {
        margin: 0,
        html2canvas: {
          backgroundColor: "#ffffff",
          foregroundColor: "#000000",
          scale: 1.5,
          useCORS: true,
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait",
        },
      };
  
      return html2pdf()
        .from(clonedElement)
        .set(options)
        .outputPdf("blob");
    };
  
    if (format === "html") {
      // HTML handling remains the same
      const htmlContent = contentRef.current.innerHTML;
      const blob = new Blob([htmlContent], { type: "text/html" });
      saveAs(blob, "documentation.html");
    } else if (format === "pdf") {
      // Direct PDF download
      const pdfBlob = await generatePdfBlob();
      saveAs(pdfBlob, "documentation.pdf");
    } else if (format === "docx") {
      const pdfBlob = await generatePdfBlob();
      const formData = new FormData();
      formData.append('pdf', pdfBlob, 'document.pdf'); 
      // Send the FormData to the server
      const response = await fetch('/convert', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload PDF');
      }

      // Handle the response (e.g., download the converted file)
      const resultBlob = await response.blob();
      saveAs(resultBlob, 'converted.docx'); // Save the converted file
    }
  };

  // const generateDocxContent = () => {
  //   const content: any[] = [];

  //   if (isJSONreceived && Array.isArray(result)) {
  //     result.forEach((doc, index) => {
  //       if (index > 0) {
  //         content.push(new Paragraph({ text: "", pageBreakBefore: false }));
  //       }

  //       if (doc.Description) {
  //         content.push(
  //           new Paragraph({
  //             text: "Description",
  //             heading: HeadingLevel.HEADING_1,
  //           }),
  //           new Paragraph({ text: doc.Description })
  //         );
  //       }

  //       if (doc.Functions && doc.Functions.length > 0) {
  //         content.push(
  //           new Paragraph({
  //             text: "Functions",
  //             heading: HeadingLevel.HEADING_1,
  //             pageBreakBefore: true,
  //           })
  //         );
  //         doc.Functions.forEach((func: { Name: string; Purpose: string }) => {
  //           content.push(
  //             new Paragraph({
  //               text: func.Name,
  //               heading: HeadingLevel.HEADING_2,
  //             }),
  //             new Paragraph({ text: func.Purpose })
  //           );
  //         });
  //       }

  //       if (doc.Queries && doc.Queries.length > 0) {
  //         content.push(
  //           new Paragraph({
  //             text: "Queries",
  //             heading: HeadingLevel.HEADING_1,
  //             pageBreakBefore: true,
  //           })
  //         );
  //         doc.Queries.forEach((query: string) => {
  //           content.push(new Paragraph({ text: `• ${query}` }));
  //         });
  //       }

  //       if (doc.Dependencies && doc.Dependencies.length > 0) {
  //         content.push(
  //           new Paragraph({
  //             text: "Dependencies",
  //             heading: HeadingLevel.HEADING_1,
  //             pageBreakBefore: true,
  //           })
  //         );
  //         doc.Dependencies.forEach((dep: { Module: string; Purpose: string }) => {
  //           content.push(
  //             new Paragraph({
  //               text: dep.Module,
  //               heading: HeadingLevel.HEADING_2,
  //             }),
  //             new Paragraph({ text: dep.Purpose })
  //           );
  //         });
  //       }

  //       if (doc.Improvements && doc.Improvements.length > 0) {
  //         content.push(
  //           new Paragraph({
  //             text: "Potential Improvements",
  //             heading: HeadingLevel.HEADING_1,
  //             pageBreakBefore: true,
  //           })
  //         );
  //         doc.Improvements.forEach((imp: { Improvement: string; Details: string }) => {
  //           content.push(
  //             new Paragraph({
  //               text: imp.Improvement,
  //               heading: HeadingLevel.HEADING_2,
  //             }),
  //             new Paragraph({ text: imp.Details })
  //           );
  //         });
  //       }

  //       if (doc.Flowchart && doc.Flowchart.length > 0) {
  //         content.push(
  //           new Paragraph({
  //             text: "Flowchart",
  //             heading: HeadingLevel.HEADING_1,
  //             pageBreakBefore: true,
  //           })
  //         );
  //         doc.Flowchart.forEach((flow: { Heading: any; Chart: any }) => {
  //           content.push(
  //             new Paragraph({
  //               text: flow.Heading,
  //               heading: HeadingLevel.HEADING_2,
  //             }),
  //             new Paragraph({ text: flow.Chart })
  //           );
  //         });
  //       }

  //       if (doc["ER Diagram"] && doc["ER Diagram"].length > 0) {
  //         content.push(
  //           new Paragraph({
  //             text: "ER Diagram",
  //             heading: HeadingLevel.HEADING_1,
  //             pageBreakBefore: true,
  //           })
  //         );
  //         doc["ER Diagram"].forEach((er: { Heading: any; Chart: any }) => {
  //           content.push(
  //             new Paragraph({
  //               text: er.Heading,
  //               heading: HeadingLevel.HEADING_2,
  //             }),
  //             new Paragraph({ text: er.Chart })
  //           );
  //         });
  //       }
  //     });
  //   } else {
  //     content.push(
  //       new Paragraph({
  //         text: "Raw Documentation",
  //         heading: HeadingLevel.HEADING_1,
  //       }),
  //       new Paragraph({ text: String(result) })
  //     );
  //   }
  //   return content;
  // };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <FileCode2 className="w-12 h-12 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold mb-4">CODEDOC</h1>
          <p className="text-xl text-gray-300">
            Generate AI-Powered Documentation for Your Code
          </p>
        </div>
        {
          !isDocumentGenerated && (<div className="max-w-6xl mx-auto grid gap-6 md:grid-cols-2">
            {/* File Upload Section */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
              <div className="flex items-center mb-6">
                <Upload className="w-6 h-6 mr-3 text-blue-400" />
                <h2 className="text-xl font-semibold">File Upload</h2>
              </div>
              <form onSubmit={handleFileSubmit}>
                <div className="mb-4">
                  <label className="w-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-blue-400 transition duration-200">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-gray-400">
                      {file ? file.name : "Upload your code files"}
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.go,.rb,.cs,.vb"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={!file || loading}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded transition duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <Upload className="w-5 h-5 mr-2" />
                  )}
                  Generate from File
                </button>
              </form>
              <form onSubmit={handleGithubSubmit} className="pt-4">
                <input
                  type="url"
                  placeholder="Enter GitHub repository URL"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  required
                  className="w-full p-3 mb-4 rounded bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded transition duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <Github className="w-5 h-5 mr-2" />
                  )}
                  Generate from GitHub
                </button>
              </form>
            </div>
  
            {/* Paste Code Section */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
              <div className="flex items-center mb-6">
                <FileCode2 className="w-6 h-6 mr-3 text-blue-400" />
                <h2 className="text-xl font-semibold">Paste Code</h2>
              </div>
              <form onSubmit={handleCodeSubmit} >
                <textarea
                  placeholder="Paste or write your code here..."
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  required
                  className="w-full p-3 mb-4 rounded bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 custom-scrollbar"
                  rows={10}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded transition duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <FileCode2 className="w-5 h-5 mr-2" />
                  )}
                  Generate from Code
                </button>
              </form>
            </div>
          </div>)
         }
        {error && (
          <div className="mt-8 max-w-4xl mx-auto bg-red-500 text-white p-4 rounded-lg">
            <p>{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-12 max-w-6xl mx-auto bg-gray-800 rounded-lg shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Generated Documentation</h3>
                <div className="flex gap-2">
                   <button
                    onClick={() => setisDocumentGenerated(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
                   >
                    <FileCode2 size={20} />
                    <span>Generate Another</span>
                  </button>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-green-400" />
                        <span className="text-sm">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span className="text-sm">Copy</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDownload("pdf")}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
                  >
                    <Download size={20} />
                    <span>Download PDF</span>
                  </button>
                  <button
                    onClick={() => handleDownload("docx")}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
                  >
                    <Download size={20} />
                    <span>Download DOCX</span>
                  </button>
                </div>
              </div>
              <div ref={contentRef}>
                <DocumentationResult
                  documentation={result}
                  isJSONreceived={isJSONreceived}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CodeDocPage;