import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { MessagingService, MessagingUser } from './messaging.service';
import { SendMessageDto } from './messaging.dto';

@ApiTags('Messaging')
@ApiBearerAuth()
@Controller('messages')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Get('contacts')
  @ApiOperation({ summary: 'List permitted messaging contacts' })
  getContacts(@CurrentUser() user: MessagingUser, @Query('search') search?: string) {
    return this.messagingService.getContacts(user, search);
  }

  @Get('conversations')
  getConversations(@CurrentUser() user: MessagingUser) {
    return this.messagingService.getConversations(user);
  }

  @Post('conversations/direct/:otherUserId')
  getOrCreateDirectChat(@CurrentUser() user: MessagingUser, @Param('otherUserId') otherUserId: string) {
    return this.messagingService.getOrCreateDirectChat(user, otherUserId);
  }

  @Get('conversations/:chatId/messages')
  getMessages(
    @CurrentUser() user: MessagingUser,
    @Param('chatId') chatId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.messagingService.getMessages(user, chatId, cursor, limit ? Number(limit) : 50);
  }

  @Post('conversations/:chatId/messages')
  sendMessage(@CurrentUser() user: MessagingUser, @Param('chatId') chatId: string, @Body() dto: SendMessageDto) {
    return this.messagingService.sendMessage(user, chatId, dto.content.trim());
  }

  @Post('conversations/:chatId/read')
  markRead(@CurrentUser() user: MessagingUser, @Param('chatId') chatId: string) {
    return this.messagingService.markRead(user, chatId);
  }
}
