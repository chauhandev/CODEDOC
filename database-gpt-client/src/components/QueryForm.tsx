import React, { useState } from "react";
import axios from "axios";

interface QueryResult {
  sqlQuery: string;
  results: any[];
  simplified: string;
}

const QueryForm: React.FC = () => {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQuery = async () => {
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/query", { query });
      setResult(response.data);
    } catch (error) {
      console.error("Error querying database:", error);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 border rounded shadow mt-4">
      <h2 className="text-lg font-bold">Query the Database</h2>
      <textarea
        className="w-full p-2 border rounded"
        rows={4}
        placeholder="Enter your query in English..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      ></textarea>
      <button
        onClick={handleQuery}
        className="mt-2 bg-green-500 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? "Processing..." : "Submit Query"}
      </button>
      {result && (
        <div className="mt-4">
          <h3 className="font-bold">SQL Query:</h3>
          <pre>{result.sqlQuery}</pre>
          <h3 className="font-bold">Results:</h3>
          <pre>{JSON.stringify(result.results, null, 2)}</pre>
          <h3 className="font-bold">Simplified:</h3>
          <p>{result.simplified}</p>
        </div>
      )}
    </div>
  );
};

export default QueryForm;
