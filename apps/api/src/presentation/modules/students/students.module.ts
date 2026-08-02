import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { StudentProfileController } from './student-profile.controller';
import { StudentCoursesController } from './student-courses.controller';
import { StudentMeetingsController } from './student-meetings.controller';
import { StudentBookingsController } from './student-bookings.controller';
import { StudentHomeworkController } from './student-homework.controller';
import { StudentExamsController } from './student-exams.controller';
import { StudentCertificatesController } from './student-certificates.controller';
import { StudentCalendarController } from './student-calendar.controller';
import { StudentMessagesController } from './student-messages.controller';
import { StudentNotificationsController } from './student-notifications.controller';
import { StudentFeedbackController } from './student-feedback.controller';
import { StudentSearchController } from './student-search.controller';
import { StudentFilesController } from './student-files.controller';
import { StudentSettingsController } from './student-settings.controller';
import {
  StudentStatsService,
  StudentProfileService,
  StudentCourseService,
  StudentMeetingService,
  StudentBookingService,
  StudentHomeworkService,
  StudentExamService,
  StudentCertificateService,
  StudentCalendarService,
  StudentMessageService,
  StudentNotificationService,
  StudentFeedbackService,
  StudentSearchService,
  StudentFileService,
  StudentSettingsService,
} from './services';
import { StudentHelper } from './student.helper';

@Module({
  controllers: [
    StudentsController,
    StudentProfileController,
    StudentCoursesController,
    StudentMeetingsController,
    StudentBookingsController,
    StudentHomeworkController,
    StudentExamsController,
    StudentCertificatesController,
    StudentCalendarController,
    StudentMessagesController,
    StudentNotificationsController,
    StudentFeedbackController,
    StudentSearchController,
    StudentFilesController,
    StudentSettingsController,
  ],
  providers: [
    StudentHelper,
    StudentStatsService,
    StudentProfileService,
    StudentCourseService,
    StudentMeetingService,
    StudentBookingService,
    StudentHomeworkService,
    StudentExamService,
    StudentCertificateService,
    StudentCalendarService,
    StudentMessageService,
    StudentNotificationService,
    StudentFeedbackService,
    StudentSearchService,
    StudentFileService,
    StudentSettingsService,
  ],
  exports: [StudentHelper],
})
export class StudentsModule {}
