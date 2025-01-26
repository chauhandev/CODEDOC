import React from 'react';

interface ResultsDisplayProps {
  results: any[]; // Use 'any[]' since we don't know the exact structure
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results }) => {
    if (!results || results.length === 0) {
      return <p className="text-gray-600">No results to display.</p>;
    }

   if (Array.isArray(results) && results.every(item => typeof item === 'object' && item !== null)) {
      const headers = Object.keys(results[0]);
        return (
            <div className="overflow-x-auto">
            <table className="table-auto w-full border-collapse border border-gray-300">
                <thead className="bg-gray-100">
                    <tr>
                    {headers.map((header) => (
                        <th key={header} className="border border-gray-300 px-4 py-2 text-left">
                        {header}
                        </th>
                    ))}
                    </tr>
                </thead>
                <tbody>
                    {results.map((row, index) => (
                    <tr key={index}>
                        {headers.map((header) => (
                        <td key={`${index}-${header}`} className="border border-gray-300 px-4 py-2">
                            {row[header]}
                        </td>
                        ))}
                    </tr>
                    ))}
                </tbody>
            </table>
            </div>
        );
  }


   return <p className="text-red-500">Invalid result format.</p>
};

export default ResultsDisplay;