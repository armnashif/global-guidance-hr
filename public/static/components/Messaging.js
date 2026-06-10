import React, { useState, useEffect } from 'react'

export default function Messaging({ supabase, currentUser }) {
  const [messages, setMessages] = useState([])
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    loadConversations()
    subscribeToMessages()
  }, [])

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:employees!sender_id(*), recipient:employees!recipient_id(*)')
        .or(`sender_id.eq.${currentUser.id},recipient_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
        loadConversations()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUser.id,
          recipient_id: selectedConversation,
          message: newMessage,
          read: false
        })

      if (error) throw error
      setNewMessage('')
      loadConversations()
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Messaging</h1>
      <p className="text-gray-600 mb-8">Real-time communication with your team</p>
      
      <div className="grid grid-cols-4 gap-6">
        <div className="col-span-1 bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h3 className="font-bold text-gray-800">Conversations</h3>
          </div>
          <div className="divide-y">
            <ConversationItem name="Nashif A. Razzak" lastMessage="Let's discuss the Q1 report" time="2h ago" />
            <ConversationItem name="Thasbiha S." lastMessage="Approved your leave request" time="5h ago" />
            <ConversationItem name="Razan Thawus" lastMessage="New visa applications received" time="1d ago" />
          </div>
        </div>
        
        <div className="col-span-3 bg-white rounded-lg shadow flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-bold text-gray-800">Select a conversation</h3>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <p className="text-gray-500 text-center">Select a conversation to start messaging</p>
          </div>
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={sendMessage}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ConversationItem({ name, lastMessage, time }) {
  return (
    <div className="p-4 hover:bg-gray-50 cursor-pointer">
      <div className="flex items-center">
        <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
          {name.split(' ').map(n => n[0]).join('').substring(0, 2)}
        </div>
        <div className="flex-1">
          <div className="flex justify-between">
            <p className="font-medium text-gray-800">{name}</p>
            <p className="text-xs text-gray-500">{time}</p>
          </div>
          <p className="text-sm text-gray-500 truncate">{lastMessage}</p>
        </div>
      </div>
    </div>
  )
}
