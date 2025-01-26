import type React from "react"
import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import FlowChart from "./FlowChart"

interface Documentation {
  Description?: string
  Functions?: Array<{
    Name: string
    Purpose: string
  }>
  Queries?: Array<string>
  Dependencies?: Array<{
    Module: string
    Purpose: string
  }>
  Improvements?: Array<{
    Improvement: string
    Details: string
  }>
  Flowchart?: Array<{
    Heading: string
    Chart: string
  }>
  "ER Diagram"?: Array<{
    Heading: string
    Chart: string
  }>
}

interface DocumentationResultProps {
  documentation: Documentation[] | string
  isJSONreceived: boolean
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="mb-4">
      <button
        className="flex justify-between items-center w-full p-2 bg-gray-700 hover:bg-gray-600 rounded-md text-left transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <h3 className="text-lg font-semibold">{title}</h3>
        {isOpen ? <ChevronUp size={20} aria-hidden="true" /> : <ChevronDown size={20} aria-hidden="true" />}
      </button>
      {isOpen && <div className="mt-2 p-2 bg-gray-800 rounded-md">{children}</div>}
    </div>
  )
}

export const DocumentationResult: React.FC<DocumentationResultProps> = ({ documentation, isJSONreceived }) => {
  const renderContent = () => {
    if (isJSONreceived && Array.isArray(documentation)) {
      return (
        <div className="space-y-6">
          {documentation.map((doc, index) => (
            <div key={index} className="bg-gray-800 p-6 rounded-lg shadow-xl">
              {doc.Description && (
                <Section title="Description">
                  <p className="whitespace-pre-wrap">{doc.Description}</p>
                </Section>
              )}

              {doc.Functions && doc.Functions.length > 0 && (
                <Section title="Functions">
                  {doc.Functions.map((func, funcIndex) => (
                    <div key={funcIndex} className="mb-4">
                      <h5 className="font-semibold">{func.Name}</h5>
                      <p className="whitespace-pre-wrap">{func.Purpose}</p>
                    </div>
                  ))}
                </Section>
              )}

              {doc.Queries && doc.Queries.length > 0 && (
                <Section title="Queries">
                  <ul className="list-disc list-inside">
                    {doc.Queries.map((query, queryId) => (
                      <li key={queryId} className="mb-2">
                        {query}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {doc.Dependencies && doc.Dependencies.length > 0 && (
                <Section title="Dependencies">
                  {doc.Dependencies.map((dep, depIndex) => (
                    <div key={depIndex} className="mb-2">
                      <h4 className="font-semibold">{dep.Module}</h4>
                      <p>{dep.Purpose}</p>
                    </div>
                  ))}
                </Section>
              )}

              {doc.Improvements && doc.Improvements.length > 0 && (
                <Section title="Potential Improvements">
                  {doc.Improvements.map((imp, impIndex) => (
                    <div key={impIndex} className="mb-2">
                      <h4 className="font-semibold">{imp.Improvement}</h4>
                      <p className="whitespace-pre-wrap">{imp.Details}</p>
                    </div>
                  ))}
                </Section>
              )}

              {doc.Flowchart && doc.Flowchart.length > 0 && (
                <Section title="Flowchart">
                  {doc.Flowchart.map((flow, flowIndex) => (
                    <div key={flowIndex} className="mb-2">
                      <h4 className="font-semibold">{flow.Heading}</h4>
                      <FlowChart
                        chartDefinition={flow.Chart.replace(/```mermaid\n|\n```/g, "").replace(/mermaid\n|\n```/g, "")}
                      />
                    </div>
                  ))}
                </Section>
              )}

              {doc["ER Diagram"] && doc["ER Diagram"].length > 0 && (
                <Section title="ER Diagram">
                  {doc["ER Diagram"].map((er, erIndex) => (
                    <div key={erIndex} className="mb-2">
                      <h4 className="font-semibold">{er.Heading}</h4>
                      <FlowChart
                        chartDefinition={er.Chart.replace(/```mermaid\n|\n```/g, "").replace(/mermaid\n|\n```/g, "")}
                      />
                    </div>
                  ))}
                </Section>
              )}
            </div>
          ))}
        </div>
      )
    } else {
      return (
        <div className="space-y-6">
          <Section title="Raw Documentation">
            <pre className="whitespace-pre-wrap p-4 bg-gray-900 rounded-md overflow-x-auto">
              {String(documentation)}
            </pre>
          </Section>
        </div>
      )
    }
  }

  return (
    <div>
        <div>{renderContent()}</div>
    </div>
  )
}

