import { Controller, Get, Post, Body, Param, Query, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('articles')
  async findAll() {
    return this.prisma.knowledgeArticle.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('search')
  async search(@Query('query') query: string) {
    if (!query) {
      return this.prisma.knowledgeArticle.findMany();
    }
    // Match in title or content (case-insensitive for SQLite)
    return this.prisma.knowledgeArticle.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { content: { contains: query } },
          { category: { contains: query } },
        ],
      },
    });
  }

  @Get('articles/:id')
  async findOne(@Param('id') id: string) {
    const article = await this.prisma.knowledgeArticle.findUnique({
      where: { id },
    });
    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found.`);
    }

    // Increment view count
    return this.prisma.knowledgeArticle.update({
      where: { id },
      data: { views: { increment: 1 } },
    });
  }

  @Post('articles')
  async create(
    @Body('title') title: string,
    @Body('content') content: string,
    @Body('category') category: string,
  ) {
    return this.prisma.knowledgeArticle.create({
      data: {
        title,
        content,
        category,
      },
    });
  }
}
