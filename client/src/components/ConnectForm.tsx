import React, { useState } from "react";
import axios from "axios";

interface ConnectFormProps {
  onConnect: (connected: boolean) => void;
}

const ConnectForm: React.FC<ConnectFormProps> = ({ onConnect }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const connectToDB = async () => {
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/connect");
      setMessage(response.data.message);
      onConnect(true);
    } catch (error) {
      setMessage("Connection failed. Check the server.");
    }
    setLoading(false);
  };

  return (
    <div className="p-4 border rounded shadow">
      <h2 className="text-lg font-bold">Connect to SQL Server</h2>
      <button
        onClick={connectToDB}
        className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? "Connecting..." : "Connect"}
      </button>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </div>
  );
};

export default ConnectForm;
