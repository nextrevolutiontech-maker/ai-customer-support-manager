export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'PENDING' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketCategory = 'TECHNICAL' | 'BILLING' | 'GENERAL';

export class TicketEntity {
  constructor(
    public readonly id: string,
    public title: string,
    public description: string,
    public status: TicketStatus,
    public priority: TicketPriority,
    public category: TicketCategory,
    public customerId: string,
    public assigneeId: string | null,
    public slaDeadline: Date | null,
    public slaBreached: boolean,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  public assignTo(agentId: string) {
    this.assigneeId = agentId;
    this.status = 'IN_PROGRESS';
    this.updatedAt = new Date();
  }

  public resolve() {
    this.status = 'RESOLVED';
    this.updatedAt = new Date();
  }

  public close() {
    this.status = 'CLOSED';
    this.updatedAt = new Date();
  }

  public checkIfBreached(): boolean {
    if (this.slaDeadline && new Date() > this.slaDeadline && this.status !== 'RESOLVED' && this.status !== 'CLOSED') {
      this.slaBreached = true;
      return true;
    }
    return this.slaBreached;
  }
}
