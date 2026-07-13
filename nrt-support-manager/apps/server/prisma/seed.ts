import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing support database...');

  // Delete all ticket-related records to clear dummy data
  await prisma.feedback.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.message.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.customerProfile.deleteMany();
  await prisma.user.deleteMany({ where: { role: 'CUSTOMER' } });

  console.log('Database cleared of all dummy tickets, messages, complaints, and logs.');

  // 1. Create SLA Policies (Infrastructure required for tickets to assign deadlines)
  const slaPolicies = [
    { priority: 'LOW', responseTimeHours: 24.0, resolutionTimeHours: 72.0 },
    { priority: 'MEDIUM', responseTimeHours: 8.0, resolutionTimeHours: 24.0 },
    { priority: 'HIGH', responseTimeHours: 2.0, resolutionTimeHours: 8.0 },
    { priority: 'URGENT', responseTimeHours: 0.5, resolutionTimeHours: 2.0 },
  ];

  for (const policy of slaPolicies) {
    await prisma.sLAPolicy.upsert({
      where: { priority: policy.priority },
      update: {},
      create: policy,
    });
  }
  console.log('SLA Policies verified.');

  // 2. Create Base Users (Agents/Admins)
  const agents = [
    { email: 'admin@nrt.com', name: 'NRT Admin', role: 'ADMIN' },
    { email: 'tech.agent@nrt.com', name: 'John Tech Support', role: 'AGENT' },
    { email: 'billing.agent@nrt.com', name: 'Sarah Finance Support', role: 'AGENT' },
  ];

  for (const agent of agents) {
    await prisma.user.upsert({
      where: { email: agent.email },
      update: {},
      create: agent,
    });
  }
  console.log('Support agents verified.');

  // 3. Create Base Knowledge Base Articles
  const articles = [
    {
      title: 'How to Reset Your Account Password',
      content: 'To reset your password: 1. Click on the Login button. 2. Select Forgot Password. 3. Enter your registered email address. 4. Follow the link sent to your email to configure a new password.',
      category: 'General',
    },
    {
      title: 'Understanding our Subscription Billing Cycle',
      content: 'Our subscriptions are billed monthly or annually depending on your plan. Invoices are generated at the start of your billing cycle and payments are processed automatically. Late payments will lead to service suspension after 5 grace days.',
      category: 'Billing',
    },
    {
      title: 'Connecting to WhatsApp Support',
      content: 'You can reach our automated support channel on WhatsApp by messaging our Business number at +1-555-NRT-CHAT. Simply type Help to interact with our support agent.',
      category: 'General',
    },
  ];

  // Clean old articles and replace
  await prisma.knowledgeArticle.deleteMany();
  for (const art of articles) {
    await prisma.knowledgeArticle.create({
      data: art,
    });
  }
  console.log('Knowledge Base articles loaded.');
  console.log('Clean database seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
