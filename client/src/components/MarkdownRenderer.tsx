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
    <div className="bg-gray-900 p-6 rounded-lg shadow-lg w-full mx-auto">
      {parseMarkdown(markdownText)}
    </div>
  );
};

export default MarkdownRenderer;