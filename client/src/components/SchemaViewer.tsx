import React, { useEffect, useState } from "react";
import axios from "axios";

interface Schema {
  TABLE_NAME: string;
}

const SchemaViewer: React.FC = () => {
  const [schema, setSchema] = useState<Schema[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchema = async () => {
      try {
        const response = await axios.get("http://localhost:5000/schema");
        setSchema(response.data);
      } catch (error) {
        console.error("Error fetching schema:", error);
      }
      setLoading(false);
    };

    fetchSchema();
  }, []);

  if (loading) {
    return <p>Loading schema...</p>;
  }

  return (
    <div className="p-4 border rounded shadow mt-4">
      <h2 className="text-lg font-bold">Database Schema</h2>
      <ul className="list-disc ml-6">
        {schema.map((table, index) => (
          <li key={index}>{table.TABLE_NAME}</li>
        ))}
      </ul>
    </div>
  );
};

export default SchemaViewer;
