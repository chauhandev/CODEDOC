import type React from "react"
import { useState } from "react"

interface ChatInputProps {
  onSend: (message: string) => void
  disabled: boolean
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
  const [message, setMessage] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
      onSend(message)
      setMessage("")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full bg-[#1e2536] px-4 py-3">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        className="flex-grow bg-transparent text-gray-200 placeholder-gray-400 focus:outline-none"
        disabled={disabled}
      />
      <button
        type="submit"
        className="ml-4 px-6 py-1 bg-[#5c9eff] text-white rounded hover:bg-[#4a8eff] focus:outline-none disabled:opacity-50"
        disabled={disabled || !message.trim()}
      >
        Send
      </button>
    </form>
  )
}

