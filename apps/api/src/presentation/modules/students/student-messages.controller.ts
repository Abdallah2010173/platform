import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { AuthenticatedUser } from './student.helper';
import { StudentMessageService } from './services';
import { SendMessageDto } from './dto/student.dto';

@ApiTags('Student Messages')
@ApiBearerAuth()
@Controller('student/messages')
export class StudentMessagesController {
  constructor(private readonly messageService: StudentMessageService) {}

  @Get('chats')
  @ApiOperation({ summary: 'Get my chat conversations' })
  getChats(@CurrentUser() user: AuthenticatedUser) {
    return this.messageService.getChats(user);
  }

  @Get('chats/:chatId/messages')
  @ApiOperation({ summary: 'Get messages in a chat' })
  getMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('chatId') chatId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ): Promise<Record<string, any>[]> {
    return this.messageService.getMessages(user, chatId, cursor, limit ? Number(limit) : 50);
  }

  @Post('chats/:chatId/messages')
  @ApiOperation({ summary: 'Send a message in a chat' })
  sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('chatId') chatId: string,
    @Body() dto: SendMessageDto,
  ): Promise<Record<string, any>> {
    return this.messageService.sendMessage(user, chatId, dto);
  }

  @Post('chats/:chatId/read')
  @ApiOperation({ summary: 'Mark a chat as read' })
  markRead(@CurrentUser() user: AuthenticatedUser, @Param('chatId') chatId: string) {
    return this.messageService.markRead(user, chatId);
  }

  @Post('direct/:otherUserId')
  @ApiOperation({ summary: 'Get or create a direct chat with another user' })
  getOrCreateDirectChat(
    @CurrentUser() user: AuthenticatedUser,
    @Param('otherUserId') otherUserId: string,
  ) {
    return this.messageService.getOrCreateDirectChat(user, otherUserId);
  }
}
