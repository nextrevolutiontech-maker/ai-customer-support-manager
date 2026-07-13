const API_BASE_URL = 'http://127.0.0.1:4000';

export async function fetchStats() {
  const res = await fetch(`${API_BASE_URL}/dashboard/stats`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch dashboard stats');
  return res.json();
}

export async function fetchTickets() {
  const res = await fetch(`${API_BASE_URL}/tickets`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch tickets');
  return res.json();
}

export async function fetchTicket(id: string) {
  const res = await fetch(`${API_BASE_URL}/tickets/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch ticket ${id}`);
  return res.json();
}

export async function assignTicket(ticketId: string, assigneeId: string) {
  const res = await fetch(`${API_BASE_URL}/tickets/${ticketId}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assigneeId }),
  });
  if (!res.ok) throw new Error('Failed to assign ticket');
  return res.json();
}

export async function updateTicketStatus(ticketId: string, status: string, userId: string) {
  const res = await fetch(`${API_BASE_URL}/tickets/${ticketId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, userId }),
  });
  if (!res.ok) throw new Error('Failed to update ticket status');
  return res.json();
}

export async function fetchKBArticles() {
  const res = await fetch(`${API_BASE_URL}/knowledge/articles`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch KB articles');
  return res.json();
}

export async function searchKBArticles(query: string) {
  const res = await fetch(`${API_BASE_URL}/knowledge/search?query=${encodeURIComponent(query)}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to search articles');
  return res.json();
}

export async function fetchComplaints() {
  const res = await fetch(`${API_BASE_URL}/complaints`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch complaints');
  return res.json();
}

export async function submitComplaint(ticketId: string, reason: string) {
  const res = await fetch(`${API_BASE_URL}/complaints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticketId, reason }),
  });
  if (!res.ok) throw new Error('Failed to submit complaint');
  return res.json();
}

export async function fetchFeedback() {
  const res = await fetch(`${API_BASE_URL}/feedback`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch feedback');
  return res.json();
}

export async function submitFeedback(ticketId: string, score: number, comment?: string) {
  const res = await fetch(`${API_BASE_URL}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticketId, score, comment }),
  });
  if (!res.ok) throw new Error('Failed to submit feedback');
  return res.json();
}

export async function simulateWhatsAppMessage(fromNumber: string, name: string, body: string) {
  const res = await fetch(`${API_BASE_URL}/integrations/whatsapp/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fromNumber, name, body }),
  });
  if (!res.ok) throw new Error('Failed to simulate WhatsApp incoming message');
  return res.json();
}

export async function simulateEmailMessage(fromEmail: string, name: string, subject: string, body: string) {
  const res = await fetch(`${API_BASE_URL}/integrations/email/receive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fromEmail, name, subject, body }),
  });
  if (!res.ok) throw new Error('Failed to simulate Email incoming message');
  return res.json();
}
