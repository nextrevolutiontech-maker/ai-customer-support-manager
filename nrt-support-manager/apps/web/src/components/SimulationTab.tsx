'use client';

import React, { useState } from 'react';
import { Mail, MessageSquare, Send, Check, AlertCircle } from 'lucide-react';
import { simulateEmailMessage, simulateWhatsAppMessage } from '../lib/api';

interface SimulationTabProps {
  onRefreshStats: () => void;
}

export default function SimulationTab({ onRefreshStats }: SimulationTabProps) {
  // WhatsApp States
  const [waFrom, setWaFrom] = useState('+14155552671');
  const [waName, setWaName] = useState('Alice Customer');
  const [waBody, setWaBody] = useState('My billing statement shows a double charge of $29. Please verify this.');
  const [waLoading, setWaLoading] = useState(false);
  const [waSuccess, setWaSuccess] = useState(false);

  // Email States
  const [emailFrom, setEmailFrom] = useState('bob.smith@globaltech.com');
  const [emailName, setEmailName] = useState('Bob Smith');
  const [emailSubject, setEmailSubject] = useState('API token return 401 on staging server');
  const [emailBody, setEmailBody] = useState('Hi NRT Support,\n\nWe are getting 401 Unauthorized errors when integrating your api on our staging server. We used the dev token from our dashboard. Please help.\n\nBest,\nBob');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  // Alert Popups state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const handleWhatsAppSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waFrom.trim()) {
      showToast('Please enter a WhatsApp phone number.', 'error');
      return;
    }
    try {
      setWaLoading(true);
      setWaSuccess(false);
      await simulateWhatsAppMessage(waFrom, waName, waBody);
      setWaSuccess(true);
      onRefreshStats();
      showToast('WhatsApp message simulated successfully! Ticket created.', 'success');
      setTimeout(() => setWaSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      showToast('Simulation failed: Check if backend server is running.', 'error');
    } finally {
      setWaLoading(false);
    }
  };

  const handleEmailSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailFrom.trim()) {
      showToast('Please enter a sender email address.', 'error');
      return;
    }
    try {
      setEmailLoading(true);
      setEmailSuccess(false);
      await simulateEmailMessage(emailFrom, emailName, emailSubject, emailBody);
      setEmailSuccess(true);
      onRefreshStats();
      showToast('Email message simulated successfully! Ticket created.', 'success');
      setTimeout(() => setEmailSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      showToast('Simulation failed: Check if backend server is running.', 'error');
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-foreground">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Channel Simulation</h2>
          <p className="text-muted-foreground text-xs mt-0.5">Simulate incoming customer requests from email and WhatsApp gateways</p>
        </div>
      </div>

      {/* Floating Status Toast Alert */}
      {toast && (
        <div className={`p-4 rounded-xl text-xs font-bold transition-all duration-300 flex justify-between items-center gap-4 ${
          toast.type === 'success' 
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
        }`}>
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{toast.message}</span>
          </div>
          <button 
            onClick={() => setToast(null)} 
            className="font-extrabold cursor-pointer border-none bg-transparent opacity-60 hover:opacity-100 text-current text-xs"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WhatsApp simulation form */}
        <div className="shadcn-panel p-5 bg-card shadow-sm rounded-xl space-y-3.5 border-none">
          <div className="flex items-center gap-1.5 mb-1">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">WhatsApp Inbound Gateway</h3>
          </div>
          
          <form onSubmit={handleWhatsAppSimulate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Phone</label>
                <input
                  type="text"
                  required
                  placeholder="+14155552671"
                  value={waFrom}
                  onChange={(e) => setWaFrom(e.target.value)}
                  className="w-full shadcn-input text-xs py-2 px-3 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Customer Name</label>
                <input
                  type="text"
                  required
                  value={waName}
                  onChange={(e) => setWaName(e.target.value)}
                  className="w-full shadcn-input text-xs py-2 px-3 rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Message</label>
              <textarea
                required
                rows={4}
                value={waBody}
                onChange={(e) => setWaBody(e.target.value)}
                className="w-full shadcn-input text-xs p-2 rounded-lg resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={waLoading}
              className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-sm ${
                waSuccess 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-primary text-primary-foreground hover:opacity-90'
              }`}
            >
              {waLoading ? (
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-current"></div>
              ) : waSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Dispatched
                </>
              ) : (
                <>
                  <Send className="w-3 h-3" /> Simulate WhatsApp message
                </>
              )}
            </button>
          </form>
        </div>

        {/* Email simulation form */}
        <div className="shadcn-panel p-5 bg-card shadow-sm rounded-xl space-y-3.5 border-none">
          <div className="flex items-center gap-1.5 mb-1">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Mail Exchange (SMTP/IMAP)</h3>
          </div>

          <form onSubmit={handleEmailSimulate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  required
                  value={emailFrom}
                  onChange={(e) => setEmailFrom(e.target.value)}
                  className="w-full shadcn-input text-xs py-2 px-3 rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Customer Name</label>
                <input
                  type="text"
                  required
                  value={emailName}
                  onChange={(e) => setEmailName(e.target.value)}
                  className="w-full shadcn-input text-xs py-2 px-3 rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Subject</label>
              <input
                type="text"
                required
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full shadcn-input text-xs py-2 px-3 rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Body</label>
              <textarea
                required
                rows={3}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="w-full shadcn-input text-xs p-2 rounded-lg resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={emailLoading}
              className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none shadow-sm ${
                emailSuccess 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-primary text-primary-foreground hover:opacity-90'
              }`}
            >
              {emailLoading ? (
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-current"></div>
              ) : emailSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Dispatched
                </>
              ) : (
                <>
                  <Send className="w-3 h-3" /> Simulate incoming Email
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
