import { Bot, User } from 'lucide-react';
import { Message } from '../../types/Message';
import MarkdownRenderer from '../MarkdownRenderer';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isBot = message.role === 'assistant';

  return (
    <div className={`flex gap-4 p-4 ${isBot ? 'bg-gray-800' : 'bg-gray-700'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isBot ? 'bg-blue-500' : 'bg-gray-500'}`}>
        {isBot ? <Bot className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-white" />}
      </div>
      <div className="flex-1 w-full">
        {/* <pre className="mt-1 text-gray-700 break-words whitespace-break-spaces">{message.content}</pre> */}
        <MarkdownRenderer markdownText={String(message.content)}></MarkdownRenderer>
      </div>
    </div>
  );
}