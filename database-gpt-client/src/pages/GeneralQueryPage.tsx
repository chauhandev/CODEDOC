import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

const GeneralQueryPage: React.FC = () => {
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState<string>('');
  const [streamingResponse, setStreamingResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const responseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [streamingResponse]);

  const handleGeneralQuerySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!naturalLanguageQuery.trim()) return;

    setError(null);
    setIsLoading(true);
    setStreamingResponse('');

    try {
      const response = await fetch('http://localhost:5000/generalquery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ naturalLanguageQuery }),
      });

      if (!response.ok) throw new Error('Network response was not ok');
      if (!response.body) throw new Error('Response body is null');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const text = decoder.decode(value);
        setStreamingResponse(prev => prev + text);
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-white mb-8 text-center">AI Assistant</h1>
      
      <div className="bg-white rounded-lg shadow-2xl p-2">
        <form onSubmit={handleGeneralQuerySubmit} className="space-y-4">
          <div className="relative">
            <textarea
              className="w-full px-4 py-3 rounded-lg border border-gray-950 focus:ring-2 focus:ring-gray-950 focus:border-transparent resize-none min-h-[120px] text-gray-950"
              value={naturalLanguageQuery}
              onChange={(e) => setNaturalLanguageQuery(e.target.value)}
              placeholder="Ask me anything..."
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !naturalLanguageQuery.trim()}
              className="absolute bottom-3 right-3 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {streamingResponse && (
          <div 
            ref={responseRef}
            className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-[400px] overflow-y-auto text-gray-950"
          >
            <div className="prose prose-sm max-w-none">
              {streamingResponse.split('\n').map((line, i) => (
                <p key={i} className="mb-2">{line}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneralQueryPage;