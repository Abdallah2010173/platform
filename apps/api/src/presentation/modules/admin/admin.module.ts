import { Module } from '@nestjs/common';
import { AdminMeetingController } from './admin-meeting.controller';
import { AdminMeetingService } from './admin-meeting.service';

@Module({ controllers: [AdminMeetingController], providers: [AdminMeetingService] })
export class AdminModule {}
