import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { StudentHelper, AuthenticatedUser } from '../student.helper';

@Injectable()
export class StudentMessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentHelper: StudentHelper,
  ) {}

  async getChats(user: AuthenticatedUser) {
    const memberships = await this.prisma.conversationMember.findMany({
      where: { userId: user.id, leftAt: null },
      include: {
        chat: {
          include: {
            members: {
              include: {
                user: { include: { profile: true } },
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return memberships.map((m) => {
      const chat = m.chat;
      const otherMembers = chat.members.filter((mm) => mm.userId !== user.id);
      const lastMessage = chat.messages[0];

      return {
        id: chat.id,
        type: chat.type,
        name:
          (chat.name ?? otherMembers[0]?.user.profile)
            ? `${otherMembers[0]?.user.profile?.firstName ?? ''} ${otherMembers[0]?.user.profile?.lastName ?? ''}`.trim()
            : 'Chat',
        avatarUrl: otherMembers[0]?.user.profile?.avatarUrl,
        lastMessage: lastMessage?.content ?? null,
        lastMessageAt: chat.lastMessageAt,
        lastReadAt: m.lastReadAt,
        unreadCount: 0,
        memberCount: chat.members.length,
      };
    });
  }

  async getOrCreateDirectChat(user: AuthenticatedUser, otherUserId: string) {
    const existing = await this.prisma.chat.findFirst({
      where: {
        type: 'DIRECT',
        members: {
          every: { userId: { in: [user.id, otherUserId] } },
        },
      },
    });

    if (existing) return existing;

    const chat = await this.prisma.chat.create({
      data: {
        type: 'DIRECT',
        createdBy: user.id,
        members: {
          create: [
            { userId: user.id, role: 'ADMIN' },
            { userId: otherUserId, role: 'MEMBER' },
          ],
        },
      },
      include: { members: true },
    });

    return chat;
  }

  async getMessages(
    user: AuthenticatedUser,
    chatId: string,
    cursor?: string,
    limit = 50,
  ): Promise<Record<string, any>[]> {
    const membership = await this.prisma.conversationMember.findUnique({
      where: { chatId_userId: { chatId, userId: user.id } },
    });
    if (!membership) {
      throw new ForbiddenException('You are not a member of this chat');
    }

    const messages = await this.prisma.message.findMany({
      where: {
        chatId,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      include: {
        sender: { include: { profile: true } },
        attachments: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return messages.reverse().map((msg) => ({
      id: msg.id,
      content: msg.content,
      type: msg.type,
      createdAt: msg.createdAt,
      editedAt: msg.editedAt,
      senderId: msg.senderId,
      senderName: msg.sender.profile
        ? `${msg.sender.profile.firstName} ${msg.sender.profile.lastName}`
        : msg.sender.email,
      senderAvatar: msg.sender.profile?.avatarUrl,
      attachments: msg.attachments.map((a) => ({
        id: a.id,
        fileName: a.fileName,
        fileUrl: a.fileUrl,
        fileSize: a.fileSize ? Number(a.fileSize) : null,
        mimeType: a.mimeType,
      })),
    }));
  }

  async sendMessage(
    user: AuthenticatedUser,
    chatId: string,
    dto: { content: string; type?: string; metadata?: any },
  ): Promise<Record<string, any>> {
    const membership = await this.prisma.conversationMember.findUnique({
      where: { chatId_userId: { chatId, userId: user.id } },
    });
    if (!membership) {
      throw new ForbiddenException('You are not a member of this chat');
    }

    const message = await this.prisma.message.create({
      data: {
        chatId,
        senderId: user.id,
        content: dto.content,
        type: (dto.type ?? 'TEXT') as never,
        metadata: dto.metadata,
      },
      include: {
        sender: { include: { profile: true } },
      },
    });

    await this.prisma.chat.update({
      where: { id: chatId },
      data: { lastMessageAt: new Date() },
    });

    return {
      id: message.id,
      content: message.content,
      type: message.type,
      createdAt: message.createdAt,
      senderId: message.senderId,
      senderName: message.sender.profile
        ? `${message.sender.profile.firstName} ${message.sender.profile.lastName}`
        : message.sender.email,
      senderAvatar: message.sender.profile?.avatarUrl,
    };
  }

  async markRead(user: AuthenticatedUser, chatId: string) {
    await this.prisma.conversationMember.update({
      where: { chatId_userId: { chatId, userId: user.id } },
      data: { lastReadAt: new Date() },
    });
    return { success: true };
  }
}
