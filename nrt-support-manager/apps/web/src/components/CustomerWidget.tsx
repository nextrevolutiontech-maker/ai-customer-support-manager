'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Sparkles, HelpCircle } from 'lucide-react';
import { getSocket, connectSocket, disconnectSocket } from '../lib/socket';
import gsap from 'gsap';

export default function CustomerWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([
    { id: 'welcome', senderRole: 'SYSTEM', body: 'Welcome to NRT Support Portal! I am your AI assistant. How can I help you today?', createdAt: new Date() }
  ]);
  const [inputText, setInputText] = useState('');
  const [ticketId, setTicketId] = useState<string | null>(null);
  
  // User registration
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);

  // Chat modes
  const [chatMode, setChatMode] = useState<'AI' | 'HUMAN'>('AI');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const widgetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen && ticketId && chatMode === 'HUMAN') {
      connectSocket();
      const socket = getSocket();
      socket.emit('joinRoom', ticketId);

      socket.on('message', (msg: any) => {
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
      });
    }

    return () => {
      const socket = getSocket();
      socket.off('message');
    };
  }, [isOpen, ticketId, chatMode]);

  useEffect(() => {
    // GSAP toggle animation
    if (isOpen && widgetRef.current) {
      gsap.fromTo(
        widgetRef.current,
        { opacity: 0, scale: 0.95, y: 15 },
        { opacity: 1, scale: 1, y: 0, duration: 0.25, ease: 'power2.out' }
      );
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleStartHumanChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name || !title) return;

    try {
      setLoading(true);
      const custRes = await fetch('http://localhost:4000/integrations/email/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromEmail: email,
          name,
          subject: title,
          body: `Live chat session initiated: "${title}"`,
        }),
      });

      const custData = await custRes.json();
      setTicketId(custData.ticketId);
      setChatMode('HUMAN');
      setIsRegistering(false);

      const tickRes = await fetch(`http://localhost:4000/tickets/${custData.ticketId}`);
      const tickData = await tickRes.json();
      setMessages(tickData.messages || []);
      scrollToBottom();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (chatMode === 'AI') {
      const customerMsg = {
        id: Math.random().toString(),
        senderRole: 'CUSTOMER',
        body: inputText,
        createdAt: new Date(),
        channel: 'LIVE_CHAT'
      };
      setMessages((prev) => [...prev, customerMsg]);
      const query = inputText;
      setInputText('');
      scrollToBottom();

      try {
        setLoading(true);
        const res = await fetch('http://localhost:4000/ai/chatbot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: query }),
        });
        const data = await res.json();

        const aiMsg = {
          id: Math.random().toString(),
          senderRole: 'AGENT',
          body: data.reply,
          createdAt: new Date(),
          channel: 'LIVE_CHAT'
        };
        setMessages((prev) => [...prev, aiMsg]);
        scrollToBottom();

        if (!data.isHandled) {
          setIsRegistering(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    } else {
      const socket = getSocket();
      socket.emit('sendMessage', {
        ticketId,
        senderId: email,
        senderRole: 'CUSTOMER',
        body: inputText,
        channel: 'LIVE_CHAT',
      });
      setInputText('');
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans">
      {/* Closed bubble state */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center transition-all hover:scale-105 border-none cursor-pointer animate-pulse"
        >
          <MessageCircle className="w-5 h-5" />
        </button>
      )}

      {/* Open widget state */}
      {isOpen && (
        <div ref={widgetRef} className="w-80 h-[440px] bg-card border-none rounded-xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-3 bg-muted flex justify-between items-center border-none">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <div>
                <h4 className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                  AI Support Portal {chatMode === 'AI' && <Sparkles className="w-3 h-3 text-muted-foreground" />}
                </h4>
                <span className="text-[8px] text-muted-foreground block font-semibold">
                  {chatMode === 'AI' ? 'Automated Assistant' : 'Human Specialist'}
                </span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer border-none bg-transparent">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Form / Chat Container */}
          {isRegistering ? (
            /* Register user details for transfer to human operator */
            <form onSubmit={handleStartHumanChat} className="flex-1 p-4 flex flex-col justify-center space-y-3 bg-card border-none">
              <div className="text-center space-y-1 mb-1">
                <HelpCircle className="w-6 h-6 text-muted-foreground mx-auto" />
                <h3 className="text-[10px] font-bold text-foreground uppercase tracking-widest">Connect to Operator</h3>
              </div>
              
              <div className="space-y-0.5">
                <label className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Name</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full shadcn-input text-xs py-1.5 px-2.5 rounded-lg"
                />
              </div>

              <div className="space-y-0.5">
                <label className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  required
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full shadcn-input text-xs py-1.5 px-2.5 rounded-lg"
                />
              </div>

              <div className="space-y-0.5">
                <label className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="Briefly describe..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full shadcn-input text-xs py-1.5 px-2.5 rounded-lg"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-primary hover:opacity-90 rounded-lg text-xs font-bold text-primary-foreground transition-colors disabled:opacity-50 cursor-pointer border-none"
              >
                {loading ? 'Routing...' : 'Start Chat'}
              </button>
            </form>
          ) : (
            /* Active Chat timeline */
            <div className="flex-1 flex flex-col overflow-hidden bg-card border-none">
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2.5 bg-muted/20">
                {messages.map((msg, index) => {
                  const isAgent = msg.senderRole === 'AGENT';
                  const isSystem = msg.senderRole === 'SYSTEM';

                  if (isSystem) {
                    return (
                      <div key={index} className="flex justify-center">
                        <span className="text-[8px] text-muted-foreground bg-secondary px-2 py-0.5 rounded text-center font-bold">
                          {msg.body}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div key={index} className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] rounded-xl p-2.5 text-[11px] shadow-sm ${
                        isAgent
                          ? 'bg-card text-foreground rounded-tl-none'
                          : 'bg-primary text-primary-foreground rounded-tr-none font-semibold'
                      }`}>
                        <p className="whitespace-pre-wrap leading-relaxed font-medium">{msg.body}</p>
                        <span className="text-[7px] opacity-60 text-right mt-1 block">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendMessage} className="p-2 bg-muted/30 flex gap-2 border-none">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 shadcn-input text-xs py-1.5 px-2.5 rounded-lg"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="p-1.5 bg-primary text-primary-foreground hover:opacity-90 rounded-lg transition-colors disabled:opacity-50 cursor-pointer border-none"
                >
                  <Send className="w-3 h-3" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
