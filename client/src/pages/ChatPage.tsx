import { useState, useRef, useEffect } from 'react';
import { Bot } from 'lucide-react';
import { ChatMessage } from '../components/Chat/ChatMessages';
import { ChatInput } from '../components/Chat/ChatInput';
import { Message } from '../types/Message';
import {PulseLoader} from 'react-spinners'

function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const updatedMessages = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch('https://codedoc.onrender.com/generalquery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: updatedMessages, userPrompt: content }),
      });

      if (!response.ok) throw new Error('Network response was not ok');
      if (!response.body) throw new Error('Response body is null');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let isFirstChunk = true;
      let streamedContent = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        streamedContent += chunk;

        if (isFirstChunk) {
          // Create assistant message only when first chunk arrives
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: streamedContent,
            role: 'assistant',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
          isFirstChunk = false;
        } else {
          // Update existing message for subsequent chunks
          setMessages((prev) =>
            prev.map((msg) =>
              msg.role === 'assistant' && msg === prev[prev.length - 1]
                ? { ...msg, content: streamedContent }
                : msg
            )
          );
        }

        // Add a small delay to simulate typing effect
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    } catch (error) {
      console.error('Failed to get response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error while processing your request.',
        role: 'assistant',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Chat Container */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-4xl h-[calc(100vh-180px)] mx-auto my-4 bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
          {/* Messages Container */}
          <div className="h-full overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Bot className="h-12 w-12 text-white-900" />
                <p className="mt-2 text-lg text-gray-400 text-center">
                  How can I assist you today?
                </p>
              </div>
            ) : (
              <div>
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
              { isLoading && (
                <div className="flex justify-center items-center">
                  <PulseLoader size={10} color='#9ca3af'/>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Chat Input */}
      <div className="flex-none bg-gray-900 border-t border-gray-700 p-2">
        <div className="max-w-4xl mx-auto">
          <ChatInput onSend={handleSendMessage} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}

export default ChatPage;