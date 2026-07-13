'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  User, 
  Clock, 
  Send, 
  Check, 
  AlertCircle,
  Inbox,
  UserCheck,
  Sparkles
} from 'lucide-react';
import { fetchTickets, fetchTicket, assignTicket, updateTicketStatus } from '../lib/api';
import gsap from 'gsap';

interface TicketsTabProps {
  agents: any[];
  onRefreshStats: () => void;
}

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
}

// Custom React Dropdown Component (Fully styled, borderless, shadow-driven popover)
function CustomSelect({ value, onChange, options, placeholder }: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative w-full text-xs font-semibold">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full shadcn-input text-[10px] p-2 rounded-lg bg-muted text-foreground flex justify-between items-center cursor-pointer border-none text-left"
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <span className="text-[7px] opacity-60 ml-2">▼</span>
      </button>
      {open && (
        <div className="absolute left-0 mt-1 w-full bg-card shadow-lg rounded-lg py-1.5 z-50 border-none">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-[10px] hover:bg-secondary/40 border-none bg-transparent cursor-pointer block ${
                opt.value === value ? 'bg-secondary text-foreground font-bold' : 'text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TicketsTab({ agents, onRefreshStats }: TicketsTabProps) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [messageBody, setMessageBody] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  // AI states
  const [aiSummary, setAiSummary] = useState<string>('');
  const [aiSuggestedReply, setAiSuggestedReply] = useState<string>('');
  const [aiClassification, setAiClassification] = useState<any | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const threadRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    if (selectedTicketId) {
      loadTicketDetails(selectedTicketId);
    }
  }, [selectedTicketId]);

  useEffect(() => {
    // Animate thread messages on change
    if (selectedTicket && threadRef.current) {
      gsap.fromTo(
        threadRef.current.querySelectorAll('.msg-bubble'),
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.04, ease: 'power1.out' }
      );
    }
  }, [selectedTicket]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await fetchTickets();
      setTickets(data);
      if (data.length > 0 && !selectedTicketId) {
        setSelectedTicketId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadTicketDetails = async (id: string) => {
    try {
      const data = await fetchTicket(id);
      setSelectedTicket(data);
      loadAiDetails(id, data.title, data.description);
    } catch (e) {
      console.error(e);
    }
  };

  const loadAiDetails = async (id: string, title: string, description: string) => {
    try {
      setAiLoading(true);
      // Fetch AI summary
      const sumRes = await fetch(`http://localhost:4000/ai/summary/${id}`);
      const sumData = await sumRes.json();
      setAiSummary(sumData.summary);

      // Fetch AI Suggested reply
      const repRes = await fetch(`http://localhost:4000/ai/suggest-reply/${id}`);
      const repData = await repRes.json();
      setAiSuggestedReply(repData.reply);

      // Fetch AI Classification
      const classRes = await fetch(`http://localhost:4000/ai/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
      const classData = await classRes.json();
      setAiClassification(classData);
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAssign = async (agentId: string) => {
    if (!selectedTicketId) return;
    try {
      await assignTicket(selectedTicketId, agentId);
      loadTickets();
      loadTicketDetails(selectedTicketId);
      onRefreshStats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!selectedTicketId) return;
    try {
      await updateTicketStatus(selectedTicketId, status, 'admin');
      loadTickets();
      loadTicketDetails(selectedTicketId);
      onRefreshStats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageBody.trim() || !selectedTicketId) return;

    try {
      setReplyLoading(true);

      const channel = selectedTicket.channel || 'WHATSAPP';

      // POST reply to the backend message endpoint
      await fetch(`http://localhost:4000/tickets/${selectedTicketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: messageBody,
          senderId: 'admin',
          senderRole: 'AGENT',
          channel: channel
        }),
      });

      setMessageBody('');
      loadTicketDetails(selectedTicketId);
      onRefreshStats();
    } catch (err) {
      console.error(err);
    } finally {
      setReplyLoading(false);
    }
  };

  // Filter logic
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getSLAText = (deadlineStr: string | null, status: string) => {
    if (!deadlineStr || status === 'RESOLVED' || status === 'CLOSED') {
      return { text: 'SLA Met', style: 'text-muted-foreground bg-secondary font-semibold' };
    }
    const diff = new Date(deadlineStr).getTime() - Date.now();
    if (diff < 0) {
      return { text: 'SLA Breached', style: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 font-bold' };
    }
    
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
    return {
      text: `${hours}h ${mins}m left`,
      style: hours < 2 
        ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 font-bold' 
        : 'text-foreground bg-secondary font-semibold'
    };
  };

  const getSentimentText = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE':
        return <span className="text-emerald-600 dark:text-emerald-400 uppercase font-bold text-[9px]">Positive</span>;
      case 'NEGATIVE':
        return <span className="text-rose-650 dark:text-rose-400 uppercase font-bold text-[9px]">Urgent / Angry</span>;
      default:
        return <span className="text-muted-foreground uppercase font-bold text-[9px]">Neutral</span>;
    }
  };

  // Dropdown options
  const statusOptions = [
    { label: 'All Status', value: 'ALL' },
    { label: 'Open', value: 'OPEN' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Resolved', value: 'RESOLVED' },
    { label: 'Closed', value: 'CLOSED' }
  ];

  const priorityOptions = [
    { label: 'All Priority', value: 'ALL' },
    { label: 'Low', value: 'LOW' },
    { label: 'Medium', value: 'MEDIUM' },
    { label: 'High', value: 'HIGH' },
    { label: 'Urgent', value: 'URGENT' }
  ];

  const agentOptions = agents.map(a => ({ label: a.name, value: a.id }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[84vh] overflow-hidden font-sans text-foreground">
      {/* Sidebar: Filters & Ticket List */}
      <div className="lg:col-span-1 shadcn-panel flex flex-col overflow-hidden h-full bg-card shadow-sm rounded-xl">
        {/* Filters */}
        <div className="p-3 bg-muted/30 space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-3" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full shadcn-input text-xs py-2 pl-8 pr-3 rounded-lg placeholder-muted-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-1.5 z-30">
            <CustomSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
            />

            <CustomSelect
              value={priorityFilter}
              onChange={setPriorityFilter}
              options={priorityOptions}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 space-y-1.5">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-4 w-4 border-b border-primary"></div>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 text-xs font-semibold">No tickets.</div>
          ) : (
            filteredTickets.map((ticket) => {
              const sla = getSLAText(ticket.slaDeadline, ticket.status);
              const isSelected = selectedTicketId === ticket.id;
              return (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`w-full text-left p-3.5 rounded-lg transition-all duration-100 border-none ${
                    isSelected 
                      ? 'bg-secondary text-secondary-foreground shadow-sm' 
                      : 'bg-transparent hover:bg-secondary/30'
                  } cursor-pointer`}
                >
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h4 className="text-xs font-bold text-foreground line-clamp-1 flex-1">{ticket.title}</h4>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-muted-foreground">
                      {ticket.priority}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-1 mb-2">{ticket.description}</p>
                  
                  <div className="flex justify-between items-center text-[9px]">
                    <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        ticket.status === 'OPEN' ? 'bg-zinc-400' :
                        ticket.status === 'IN_PROGRESS' ? 'bg-primary' :
                        ticket.status === 'RESOLVED' ? 'bg-emerald-500' :
                        'bg-zinc-300'
                      }`} />
                      {ticket.status.replace('_', ' ').toLowerCase()}
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] ${sla.style}`}>
                      {sla.text}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main panel: Detail Panel & Chat Timeline */}
      <div className="lg:col-span-3 shadcn-panel flex flex-col overflow-hidden h-full bg-card shadow-sm rounded-xl">
        {selectedTicket ? (
          <>
            {/* Header Details */}
            <div className="p-5 bg-muted/40 flex flex-col md:flex-row justify-between gap-3 items-start md:items-center">
              <div>
                <span className="text-[9px] text-muted-foreground font-extrabold uppercase tracking-widest">{selectedTicket.category} / {selectedTicket.id.slice(0, 8)}</span>
                <h3 className="text-sm font-extrabold text-foreground mt-0.5">{selectedTicket.title}</h3>
                
                {/* AI Classification Info */}
                {aiClassification && (
                  <div className="flex items-center gap-2 mt-2 bg-muted px-2.5 py-0.5 rounded-md w-fit">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span className="text-[9px] font-bold text-foreground">AI: {aiClassification.category}</span>
                    <span className="text-[9px] text-muted-foreground/30">|</span>
                    <span className="text-[9px] font-bold text-foreground flex items-center gap-1.5">
                      Sentiment: {getSentimentText(aiClassification.sentiment)}
                    </span>
                  </div>
                )}
              </div>

              {/* Status Actions */}
              <div className="flex gap-1.5">
                {selectedTicket.status !== 'RESOLVED' && selectedTicket.status !== 'CLOSED' ? (
                  <button
                    onClick={() => handleStatusChange('RESOLVED')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-primary hover:opacity-90 rounded-lg text-xs font-bold text-primary-foreground transition-all cursor-pointer shadow-sm border-none"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Resolve
                  </button>
                ) : null}
                {selectedTicket.status !== 'CLOSED' ? (
                  <button
                    onClick={() => handleStatusChange('CLOSED')}
                    className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded-lg text-xs font-bold text-foreground transition-all border-none cursor-pointer"
                  >
                    Close
                  </button>
                ) : (
                  <span className="px-3 py-1.5 bg-secondary rounded-lg text-xs font-bold text-muted-foreground">
                    Closed
                  </span>
                )}
              </div>
            </div>

            {/* Quick Actions (Assignee selector) */}
            <div className="px-5 py-2.5 bg-muted/20 flex flex-wrap gap-4 items-center justify-between text-xs">
              <div className="flex items-center gap-2.5 z-40">
                <UserCheck className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-muted-foreground font-bold">Assignee:</span>
                <div className="w-40">
                  <CustomSelect
                    value={selectedTicket.assigneeId || ''}
                    onChange={handleAssign}
                    options={agentOptions}
                    placeholder="Select Agent"
                  />
                </div>
              </div>

              {selectedTicket.slaDeadline && (
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-muted-foreground font-bold">SLA Limit:</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${
                    getSLAText(selectedTicket.slaDeadline, selectedTicket.status).style
                  }`}>
                    {getSLAText(selectedTicket.slaDeadline, selectedTicket.status).text}
                  </span>
                </div>
              )}
            </div>

            {/* AI Summary Banner */}
            {aiSummary && (
              <div className="mx-5 mt-4 p-4 bg-muted/60 rounded-xl flex gap-2.5 items-start gsap-fade-in">
                <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">AI Summary</h5>
                  <p className="text-[11px] text-foreground font-medium mt-1 leading-relaxed">{aiSummary}</p>
                </div>
              </div>
            )}

            {/* Conversation Thread */}
            <div ref={threadRef} className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-3 bg-muted/5">
              <div className="p-4 bg-card shadow-sm rounded-xl msg-bubble">
                <h5 className="text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">Description</h5>
                <p className="text-xs text-foreground leading-relaxed font-medium">{selectedTicket.description}</p>
              </div>

              {selectedTicket.messages?.map((msg: any) => {
                const isSystem = msg.senderRole === 'SYSTEM';
                const isCustomer = msg.senderRole === 'CUSTOMER';
                
                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center msg-bubble">
                      <div className="bg-secondary px-3 py-1 rounded-full text-[9px] text-muted-foreground font-semibold flex items-center gap-1.5">
                        <AlertCircle className="w-3 h-3 text-muted-foreground" />
                        {msg.body}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={`flex msg-bubble ${isCustomer ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[75%] rounded-xl p-3.5 text-xs shadow-sm ${
                      isCustomer 
                        ? 'bg-card text-foreground' 
                        : 'bg-primary text-primary-foreground font-semibold'
                    }`}>
                      <div className="flex justify-between items-center gap-5 mb-1 text-[9px] opacity-60">
                        <span className="font-bold">{isCustomer ? (selectedTicket.customer?.user?.name || 'Customer') : 'Support Agent'}</span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap font-medium">{msg.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AI Suggested Reply & Response Form */}
            {selectedTicket.status !== 'CLOSED' && (
              <div className="p-3 bg-muted/30 space-y-2">
                {/* Suggested reply option */}
                {aiSuggestedReply && (
                  <div className="flex justify-between items-center bg-card shadow-sm p-3 rounded-lg gap-3">
                    <div className="flex gap-2 items-start">
                      <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[9px] font-bold uppercase text-muted-foreground">AI Suggested Response</span>
                        <p className="text-[11px] text-foreground font-medium mt-0.5 line-clamp-1">{aiSuggestedReply}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMessageBody(aiSuggestedReply)}
                      className="px-2.5 py-1.5 bg-secondary hover:bg-secondary/80 text-[9px] font-bold text-foreground rounded transition-all flex-shrink-0 cursor-pointer border-none"
                    >
                      Insert
                    </button>
                  </div>
                )}

                {/* Reply Form */}
                <form onSubmit={handleSendReply} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type a response..."
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    className="flex-1 shadcn-input text-xs py-2 px-3 rounded-lg"
                  />
                  <button
                    type="submit"
                    disabled={replyLoading}
                    className="px-4 bg-primary text-primary-foreground hover:opacity-90 rounded-lg flex items-center justify-center font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer border-none"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <Inbox className="w-6 h-6 text-muted-foreground" />
            <span className="text-xs font-semibold">Select a ticket from the queue to view details.</span>
          </div>
        )}
      </div>
    </div>
  );
}
