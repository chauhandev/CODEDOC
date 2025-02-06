import React from "react";
import FlowChart from "./FlowChart";

interface MarkdownRendererProps {
  markdownText: string;
}

// Function to convert Markdown to JSX
const parseMarkdown = (markdown: string) => {
  markdown = markdown.replace(/```text\n|\n```/g, "").replace(/text\n|\n```/g, "");
  markdown = markdown.replace(/```markdown\n|\n```/g, "").replace(/markdown\n|\n```/g, "");

  const lines = markdown.split("\n");

  const htmlElements = lines.map((line: any, index: number) => {
    // Convert Headings (#, ##, ###, etc.)
    if (/^#{1,6}\s/.test(line)) {
      const level = line.match(/^#+/)[0].length;
      const content = line.replace(/^#+\s/, "");
      return React.createElement(
        `h${level}`,
        {
          key: index,
          className: `text-${level === 1 ? "4xl" : level === 2 ? "3xl" : level === 3 ? "2xl" : "xl"
            } font-bold my-4 text-gray-100`,
        },
        content
      );
    }

    // Convert Bold (**text**)
    if (/\*\*(.*?)\*\*/.test(line)) {
      return (
        <p
          key={index}
          className="text-gray-200 my-3"
          dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }}
        />
      );
    }

    // Convert Italic (*text* or _text_)
    if (/\*(.*?)\*|_(.*?)_/.test(line)) {
      return (
        <p
          key={index}
          className="text-gray-200 my-3"
          dangerouslySetInnerHTML={{
            __html: line.replace(/\*(.*?)\*|_(.*?)_/g, "<em>$1$2</em>"),
          }}
        />
      );
    }

    // Convert Inline Code (`code`)
    if (/`([^`]+)`/.test(line)) {
      return (
        <p
          key={index}
          className="my-3"
          dangerouslySetInnerHTML={{
            __html: line.replace(
              /`([^`]+)`/g,
              '<code class="bg-gray-700 px-2 py-1 rounded text-green-400 font-mono">$1</code>'
            ),
          }}
        />
      );
    }

    // Convert Code Blocks (```language)
    if (/^```(.*?)$/.test(line)) {
      const lang = line.match(/^```(.*?)$/)?.[1] || "";
      const codeContent = [];
      let i = index + 1;
      while (i < lines.length && !/^```$/.test(lines[i])) {
        codeContent.push(lines[i]);
        i++;
      }
      return (
        <pre key={index} className="bg-gray-800 p-4 rounded-md my-4 overflow-x-auto">
          <code className={`language-${lang} text-gray-300`}>{codeContent.join("\n")}</code>
        </pre>
      );
    }

    // Convert Mermaid Charts (```mermaid)
    if (/^```mermaid$/.test(line)) {
      const chartContent = [];
      let i = index + 1;
      while (i < lines.length && !/^```$/.test(lines[i])) {
        chartContent.push(lines[i]);
        i++;
      }
      return <FlowChart key={index} chartDefinition={chartContent.join("\n")} />;
    }

    // Convert Blockquotes (> text)
    if (/^>\s/.test(line)) {
      const content = line.replace(/^>\s/, "");
      return (
        <blockquote
          key={index}
          className="border-l-4 border-gray-500 pl-4 my-4 text-gray-300 italic"
        >
          {content}
        </blockquote>
      );
    }

    // Convert Unordered Lists (- or * or +)
    if (/^[-*+]\s/.test(line)) {
      const content = line.replace(/^[-*+]\s/, "");
      return (
        <ul key={index} className="list-disc list-inside my-3 text-gray-300">
          <li>{content}</li>
        </ul>
      );
    }

    // Convert Ordered Lists (1., 2., 3., etc.)
    if (/^\d+\.\s/.test(line)) {
      const content = line.replace(/^\d+\.\s/, "");
      return (
        <ol key={index} className="list-decimal list-inside my-3 text-gray-300">
          <li>{content}</li>
        </ol>
      );
    }

    // Convert Tables
    if (/\|/.test(line)) {
      const columns = line.split("|").map((col:any) => col.trim());
      return (
        <table key={index} className="table-auto w-full my-4">
          <thead>
            <tr>
              {columns.map((col:any, i:any) => (
                <th key={i} className="border px-4 py-2 text-gray-100">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines
              .slice(index + 1)
              .filter((l) => /\|/.test(l))
              .map((row, rowIndex) => {
                const cells = row.split("|").map((cell) => cell.trim());
                return (
                  <tr key={rowIndex}>
                    {cells.map((cell, cellIndex) => (
                      <td key={cellIndex} className="border px-4 py-2 text-gray-300">
                        {cell}
                      </td>
                    ))}
                  </tr>
                );
              })}
          </tbody>
        </table>
      );
    }

    // Default paragraph styling
    return (
      <p key={index} className="text-gray-300 leading-relaxed my-3">
        {line}
      </p>
    );
  });

  return htmlElements;
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ markdownText }) => {
  return (
    <div className="bg-gray-900 p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
      {parseMarkdown(markdownText)}
    </div>
  );
};

export default MarkdownRenderer;