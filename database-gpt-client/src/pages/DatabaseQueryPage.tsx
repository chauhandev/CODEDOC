import React, { useState } from 'react';
import axios from 'axios';
import ResultsDisplay from '../components/ResultsDisplay';

const DatabaseQueryPage: React.FC = () => {
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState<string>('');
  const [results, setResults] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDatabaseQuerySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setResults(null);
    try {
      const response = await axios.post('http://localhost:5000/query', { naturalLanguageQuery });
      setResults(response.data);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response ? err.response.data : err.message);
    }
  };

  return (
    <div className="flex flex-col items-center p-5 font-sans">
      <h1 className="text-3xl font-bold mb-5">Database Query</h1>
      <form onSubmit={handleDatabaseQuerySubmit} className="w-full max-w-2xl flex flex-col">
        <textarea
          className="border p-2 mb-3 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-300 h-32"
          value={naturalLanguageQuery}
          onChange={(e) => setNaturalLanguageQuery(e.target.value)}
          placeholder="Enter your database query..."
          rows={5}
        />
        <button
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          type="submit"
        >
          Run Database Query
        </button>
      </form>
      {error && <div className="text-red-500 mt-3">Error: {error}</div>}
      {results && <ResultsDisplay results={results} />}
    </div>
  );
};

export default DatabaseQueryPage;
