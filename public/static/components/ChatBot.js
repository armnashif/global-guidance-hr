import React, { useState } from 'react'

export default function ChatBot({ supabase, currentUser, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m your HR assistant. How can I help you today?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage = { role: 'user', content: input }
    setMessages([...messages, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Simulate AI response (in production, call your LLM API)
      setTimeout(() => {
        const botMessage = {
          role: 'assistant',
          content: 'I can help you with HR policies, leave balances, training opportunities, and more. What would you like to know?'
        }
        setMessages(prev => [...prev, botMessage])
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error:', error)
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-24 right-6 w-96 bg-white rounded-lg shadow-2xl z-50">
      <div className="bg-primary-600 text-white p-4 rounded-t-lg flex justify-between items-center">
        <div className="flex items-center">
          <i className="fas fa-robot text-2xl mr-3"></i>
          <div>
            <h3 className="font-bold">HR Assistant</h3>
            <p className="text-xs text-primary-100">Ask me anything</p>
          </div>
        </div>
        <button onClick={onClose} className="text-white hover:text-gray-200">
          <i className="fas fa-times"></i>
        </button>
      </div>

      <div className="h-96 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs px-4 py-2 rounded-lg ${
              msg.role === 'user' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-2 rounded-lg">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your question..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            onClick={handleSend}
            disabled={loading}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  )
}
