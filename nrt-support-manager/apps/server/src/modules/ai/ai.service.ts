import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Private helper to call Google Gemini REST API
  private async callGemini(prompt: string): Promise<string | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        }),
      });

      if (!res.ok) {
        this.logger.error(`Gemini API returned status ${res.status}`);
        return null;
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return text ? text.trim() : null;
    } catch (err) {
      this.logger.error('Error calling Gemini API:', err);
      return null;
    }
  }

  // 1. Ticket classification and sentiment analysis
  async classifyTicket(title: string, description: string): Promise<{ category: 'Technical' | 'Billing' | 'General', priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT', sentiment: string }> {
    const prompt = `You are an AI support classifier. Analyze the following ticket title and description. Classify it into one of these categories: Technical, Billing, General. Analyze its sentiment: POSITIVE, NEGATIVE, NEUTRAL. Determine its priority: LOW, MEDIUM, HIGH, URGENT. Return ONLY a JSON object in this format, with no markdown formatting and no extra text:
{"category": "Technical" | "Billing" | "General", "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT", "sentiment": "POSITIVE" | "NEGATIVE" | "NEUTRAL"}

Ticket Title: ${title}
Description: ${description}`;

    const geminiReply = await this.callGemini(prompt);
    if (geminiReply) {
      try {
        // Strip markdown backticks if any
        const cleanJson = geminiReply.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        if (parsed.category && parsed.priority && parsed.sentiment) {
          return {
            category: parsed.category,
            priority: parsed.priority,
            sentiment: parsed.sentiment,
          };
        }
      } catch (err) {
        this.logger.warn('Failed to parse Gemini classification reply, using fallback', err);
      }
    }

    // Fallback: Rule-based heuristics
    const text = (title + ' ' + description).toLowerCase();
    let category: 'Technical' | 'Billing' | 'General' = 'General';
    let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'MEDIUM';
    let sentiment = 'NEUTRAL';

    if (text.includes('billing') || text.includes('invoice') || text.includes('charge') || text.includes('payment') || text.includes('refund')) {
      category = 'Billing';
    } else if (text.includes('api') || text.includes('crash') || text.includes('unauthorized') || text.includes('error') || text.includes('integration') || text.includes('bug')) {
      category = 'Technical';
    }

    if (text.includes('angry') || text.includes('terrible') || text.includes('hate') || text.includes('worst') || text.includes('disappointed') || text.includes('immediately')) {
      sentiment = 'NEGATIVE';
      priority = 'HIGH';
    } else if (text.includes('thank') || text.includes('love') || text.includes('great') || text.includes('awesome')) {
      sentiment = 'POSITIVE';
    }

    if (text.includes('urgent') || text.includes('broken') || text.includes('critical') || text.includes('production down')) {
      priority = 'URGENT';
    }

    return { category, priority, sentiment };
  }

  // 2. Suggested replies for agents
  async getSuggestedReply(ticketId: string): Promise<string> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { messages: true },
    });

    if (!ticket) return 'Hello, how can I assist you today?';

    const history = ticket.messages.map(m => `[${m.senderRole}]: ${m.body}`).join('\n');
    const prompt = `You are a professional customer support agent. Generate a helpful, concise response to the customer based on the conversation history. Keep the tone professional, polite, and brief. Return ONLY the reply text, no other details.

Ticket Title: ${ticket.title}
Conversation History:
${history}`;

    const geminiReply = await this.callGemini(prompt);
    if (geminiReply) {
      return geminiReply;
    }

    // Fallback: Keyword rules
    const lastMessage = [...ticket.messages]
      .reverse()
      .find((m) => m.senderRole === 'CUSTOMER');

    if (!lastMessage) return `Hi, thank you for reaching out. How can I support you?`;
    const text = lastMessage.body.toLowerCase();

    if (text.includes('charge') || text.includes('double charge')) {
      return `Dear customer, we apologize for the billing issue. I have flagged this ticket for our billing team, and we will initiate a reverse audit of your last transaction right away.`;
    }
    if (text.includes('401') || text.includes('unauthorized') || text.includes('token')) {
      return `Thank you for reports. A 401 error signifies that the API credentials provided are invalid or expired. Please check if you have copied the correct authorization header format: Bearer <token>.`;
    }

    return `Hello, thank you for contacting NRT Support. I am reviewing the details of your request and will provide an update shortly.`;
  }

  // 3. Conversation summary generator
  async generateSummary(ticketId: string): Promise<string> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { messages: true },
    });

    if (!ticket || ticket.messages.length === 0) return 'No conversation history available.';

    const history = ticket.messages.map(m => `[${m.senderRole}]: ${m.body}`).join('\n');
    const prompt = `You are an AI assistant. Read this customer support conversation history and provide a concise, single-line summary of the primary concern and current status. Return ONLY the summary text, no longer than 150 characters.

Ticket Title: ${ticket.title}
Conversation History:
${history}`;

    const geminiReply = await this.callGemini(prompt);
    if (geminiReply) {
      return geminiReply;
    }

    // Fallback: Default short format
    const clientMessages = ticket.messages.filter((m) => m.senderRole === 'CUSTOMER');
    return `Summary: Customer filed issue regarding "${ticket.title}". Total exchange contains ${ticket.messages.length} interactions. Status is currently marked ${ticket.status}. Primary concern relates to: ${clientMessages[0]?.body.slice(0, 80) || 'None'}.`;
  }

  // 4. Customer-facing RAG Chatbot
  async getChatbotResponse(message: string): Promise<{ reply: string, isHandled: boolean }> {
    const articles = await this.prisma.knowledgeArticle.findMany();
    const formattedArticles = articles.map(art => `Title: ${art.title}\nContent: ${art.content}`).join('\n\n');

    const prompt = `You are a helpful AI Customer Support Bot. Below is some background documentation from our Knowledge Base. Use ONLY this documentation to answer the customer's query. If the documentation does not contain the answer, reply exactly with: 'TRANSFER_TO_AGENT'. Do not add any extra text or pleasantries if transferring.

Knowledge Base Articles:
${formattedArticles}

Customer Query: ${message}`;

    const geminiReply = await this.callGemini(prompt);
    if (geminiReply) {
      if (geminiReply.includes('TRANSFER_TO_AGENT')) {
        return {
          reply: `I am transferring you to a live support agent who can assist you with your request. One moment please...`,
          isHandled: false,
        };
      }
      return {
        reply: geminiReply,
        isHandled: true,
      };
    }

    // Fallback: Rule-based search
    const text = message.toLowerCase();
    for (const article of articles) {
      const matchKeywords = article.title.toLowerCase().split(' ');
      const matchCount = matchKeywords.filter(keyword => keyword.length > 3 && text.includes(keyword)).length;
      
      if (matchCount >= 2) {
        return {
          reply: `I found an article that might resolve your issue: **${article.title}**.\n\n${article.content}\n\nDoes this resolve your issue?`,
          isHandled: true,
        };
      }
    }

    return {
      reply: `I am transferring you to a live support agent who can assist you with your request. One moment please...`,
      isHandled: false,
    };
  }
}
