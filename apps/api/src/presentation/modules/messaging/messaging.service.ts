import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { Role } from '@platform/database';

export interface MessagingUser {
  id: string;
  role: Role | string;
}

@Injectable()
export class MessagingService {
  constructor(private readonly prisma: PrismaService) {}

  async getContacts(user: MessagingUser, search?: string) {
    const q = search?.trim();
    const profileFilter = q
      ? {
          OR: [
            { firstName: { contains: q, mode: 'insensitive' as const } },
            { lastName: { contains: q, mode: 'insensitive' as const } },
            { displayName: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : undefined;

    if (user.role === Role.TEACHER) {
      const teacher = await this.prisma.teacher.findUnique({ where: { userId: user.id } });
      if (!teacher) throw new NotFoundException('Teacher profile not found');
      const students = await this.prisma.student.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          user: { isActive: true, deletedAt: null, profile: profileFilter },
        },
        include: { user: { select: { id: true, email: true, profile: true } } },
        orderBy: { user: { email: 'asc' } },
      });
      return students.map(({ user: contact }) => this.mapContact(contact));
    }

    if (user.role === Role.STUDENT) {
      const student = await this.prisma.student.findUnique({ where: { userId: user.id } });
      if (!student) throw new NotFoundException('Student profile not found');
      const teachers = await this.prisma.teacher.findMany({
        where: {
          deletedAt: null,
          courses: { some: { course: { students: { some: { studentId: student.id, deletedAt: null } } }, deletedAt: null } },
          user: { profile: profileFilter },
        },
        select: { user: { select: { id: true, email: true, profile: true } } },
        orderBy: { user: { email: 'asc' } },
        take: 50,
      });
      return teachers.map(({ user: contact }) => this.mapContact(contact));
    }

    return [];
  }

  async getOrCreateDirectChat(user: MessagingUser, otherUserId: string) {
    if (user.id === otherUserId) throw new ForbiddenException('You cannot message yourself');
    const contacts = await this.getContacts(user);
    if (!contacts.some((contact) => contact.id === otherUserId)) {
      throw new ForbiddenException('You are not allowed to message this user');
    }

    const chats = await this.prisma.chat.findMany({
      where: {
        type: 'DIRECT',
        members: { some: { userId: user.id, leftAt: null } },
      },
      include: { members: { where: { leftAt: null }, select: { userId: true } } },
    });
    const existing = chats.find(
      (chat) =>
        chat.members.length === 2 &&
        chat.members.some((member) => member.userId === user.id) &&
        chat.members.some((member) => member.userId === otherUserId),
    );
    if (existing) return { id: existing.id };

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
      select: { id: true },
    });
    return chat;
  }

  async getConversations(user: MessagingUser) {
    const memberships = await this.prisma.conversationMember.findMany({
      where: { userId: user.id, leftAt: null, chat: { deletedAt: null } },
      include: {
        chat: {
          include: {
            members: { where: { leftAt: null }, include: { user: { include: { profile: true } } } },
            messages: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
      orderBy: { chat: { lastMessageAt: 'desc' } },
    });

    return Promise.all(
      memberships.map(async (membership) => {
        const unreadCount = await this.prisma.message.count({
          where: {
            chatId: membership.chatId,
            senderId: { not: user.id },
            deletedAt: null,
            ...(membership.lastReadAt ? { createdAt: { gt: membership.lastReadAt } } : {}),
          },
        });
        const other = membership.chat.members.find((member) => member.userId !== user.id)?.user;
        return {
          id: membership.chat.id,
          name: other?.profile?.displayName || `${other?.profile?.firstName ?? ''} ${other?.profile?.lastName ?? ''}`.trim() || other?.email,
          avatarUrl: other?.profile?.avatarUrl,
          lastMessage: membership.chat.messages[0]?.content ?? null,
          lastMessageAt: membership.chat.lastMessageAt,
          unreadCount,
        };
      }),
    );
  }

  async getMessages(user: MessagingUser, chatId: string, cursor?: string, limit = 50) {
    await this.requireMembership(user.id, chatId);
    const messages = await this.prisma.message.findMany({
      where: { chatId, deletedAt: null, ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}) },
      include: { sender: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 100),
    });
    return messages.reverse().map((message) => ({
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      senderId: message.senderId,
      senderName: message.sender.profile?.displayName || message.sender.email,
    }));
  }

  async sendMessage(user: MessagingUser, chatId: string, content: string) {
    await this.requireMembership(user.id, chatId);
    const message = await this.prisma.message.create({
      data: { chatId, senderId: user.id, content, type: 'TEXT' },
      include: { sender: { include: { profile: true } } },
    });
    await this.prisma.chat.update({ where: { id: chatId }, data: { lastMessageAt: message.createdAt } });
    return {
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      senderId: message.senderId,
      senderName: message.sender.profile?.displayName || message.sender.email,
    };
  }

  async markRead(user: MessagingUser, chatId: string) {
    await this.requireMembership(user.id, chatId);
    await this.prisma.conversationMember.update({
      where: { chatId_userId: { chatId, userId: user.id } },
      data: { lastReadAt: new Date() },
    });
    return { success: true };
  }

  private async requireMembership(userId: string, chatId: string) {
    const membership = await this.prisma.conversationMember.findUnique({
      where: { chatId_userId: { chatId, userId } },
      include: { chat: { select: { deletedAt: true } } },
    });
    if (!membership || membership.leftAt || membership.chat.deletedAt) {
      throw new ForbiddenException('You are not a member of this chat');
    }
    return membership;
  }

  private mapContact(contact: { id: string; email: string; profile: { firstName: string; lastName: string; displayName: string | null; avatarUrl: string | null } | null }) {
    return {
      id: contact.id,
      email: contact.email,
      name: contact.profile?.displayName || `${contact.profile?.firstName ?? ''} ${contact.profile?.lastName ?? ''}`.trim() || contact.email,
      avatarUrl: contact.profile?.avatarUrl,
    };
  }
}
