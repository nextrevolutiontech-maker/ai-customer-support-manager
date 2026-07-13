'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { getSocket, connectSocket, disconnectSocket } from '../lib/socket';
import gsap from 'gsap';

interface ChatTabProps {
  tickets: any[];
  onRefreshStats: () => void;
}

export default function ChatTab({ tickets, onRefreshStats }: ChatTabProps) {
  const chatTickets = tickets.filter(t => t.status !== 'CLOSED' && t.status !== 'RESOLVED');

  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatBodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    connectSocket();
    const socket = getSocket();

    socket.on('message', (msg: any) => {
      if (msg.ticketId === activeTicketId) {
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
      }
      onRefreshStats();
    });

    return () => {
      socket.off('message');
      disconnectSocket();
    };
  }, [activeTicketId]);

  useEffect(() => {
    if (activeTicketId) {
      const socket = getSocket();
      socket.emit('joinRoom', activeTicketId);
      loadMessages(activeTicketId);
    }
  }, [activeTicketId]);

  useEffect(() => {
    // GSAP fade in messages
    if (messages.length > 0 && chatBodyRef.current) {
      gsap.fromTo(
        chatBodyRef.current.querySelectorAll('.live-msg'),
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.25, stagger: 0.04, ease: 'power1.out' }
      );
    }
  }, [messages]);

  const loadMessages = async (ticketId: string) => {
    try {
      const res = await fetch(`http://localhost:4000/tickets/${ticketId}`);
      const data = await res.json();
      setMessages(data.messages || []);
      scrollToBottom();
    } catch (e) {
      console.error(e);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeTicketId) return;

    const socket = getSocket();
    socket.emit('sendMessage', {
      ticketId: activeTicketId,
      senderId: 'admin',
      senderRole: 'AGENT',
      body: inputText,
      channel: 'LIVE_CHAT',
    });

    setInputText('');
  };

  const activeTicket = tickets.find(t => t.id === activeTicketId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[84vh] overflow-hidden font-sans text-foreground">
      {/* Left panel: Active Chat Queues */}
      <div className="lg:col-span-1 shadcn-panel flex flex-col overflow-hidden h-full bg-card shadow-sm rounded-xl">
        <div className="p-3 bg-muted/40">
          <h3 className="text-xs font-bold text-foreground">Active Chats</h3>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 space-y-1">
          {chatTickets.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 text-xs font-semibold">No active chats.</div>
          ) : (
            chatTickets.map((ticket) => {
              const isSelected = activeTicketId === ticket.id;
              return (
                <button
                  key={ticket.id}
                  onClick={() => setActiveTicketId(ticket.id)}
                  className={`w-full text-left p-3.5 rounded-lg transition-all duration-100 border-none ${
                    isSelected 
                      ? 'bg-secondary text-secondary-foreground shadow-sm' 
                      : 'bg-transparent hover:bg-secondary/30'
                  } cursor-pointer`}
                >
                  <h4 className="text-xs font-bold text-foreground line-clamp-1">{ticket.title}</h4>
                  <span className="text-[9px] text-muted-foreground mt-0.5 block">Client: {ticket.customer?.user?.name || 'Client'}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main panel: Chat Interface */}
      <div className="lg:col-span-3 shadcn-panel flex flex-col overflow-hidden h-full bg-card shadow-sm rounded-xl">
        {activeTicket ? (
          <>
            {/* Header info */}
            <div className="p-4 bg-muted/40 flex justify-between items-center">
              <div>
                <h4 className="text-xs font-bold text-foreground">{activeTicket.title}</h4>
                <p className="text-[9px] text-muted-foreground">Live conversation with {activeTicket.customer?.user?.name}</p>
              </div>
            </div>

            {/* Messages body */}
            <div ref={chatBodyRef} className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-3 bg-muted/5">
              {messages.map((msg) => {
                const isSystem = msg.senderRole === 'SYSTEM';
                const isAgent = msg.senderRole === 'AGENT';

                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center live-msg">
                      <div className="bg-secondary px-3 py-1 rounded-full text-[9px] text-muted-foreground font-semibold">
                        {msg.body}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={`flex live-msg ${isAgent ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-xl p-3.5 text-xs shadow-sm ${
                      isAgent 
                        ? 'bg-primary text-primary-foreground font-semibold' 
                        : 'bg-card text-foreground'
                    }`}>
                      <p className="leading-relaxed whitespace-pre-wrap font-medium">{msg.body}</p>
                      <span className="text-[8px] opacity-60 text-right mt-1.5 block">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input field */}
            <form onSubmit={handleSendMessage} className="p-3 bg-muted/30 flex gap-2">
              <input
                type="text"
                placeholder="Type real-time response..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 shadcn-input text-xs py-2 px-3 rounded-lg"
              />
              <button
                type="submit"
                className="px-4 bg-primary hover:opacity-90 text-primary-foreground font-bold text-xs rounded-lg flex items-center justify-center transition-colors cursor-pointer border-none"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <MessageSquare className="w-6 h-6 text-muted-foreground" />
            <span className="text-xs font-semibold">Select an active chat session to begin.</span>
          </div>
        )}
      </div>
    </div>
  );
}
