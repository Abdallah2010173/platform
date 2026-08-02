import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { StudentHelper, AuthenticatedUser } from '../student.helper';

@Injectable()
export class StudentStatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentHelper: StudentHelper,
  ) {}

  async getHomeStats(user: AuthenticatedUser) {
    const studentId = await this.studentHelper.getStudentId(user);

    const [
      myCourses,
      activeCourses,
      completedCourses,
      todayClasses,
      upcomingMeetings,
      pendingHomework,
      upcomingExams,
      certificates,
      notifications,
    ] = await Promise.all([
      this.prisma.courseStudent.count({ where: { studentId } }),
      this.prisma.courseStudent.count({
        where: { studentId, status: 'ACTIVE' },
      }),
      this.prisma.courseStudent.count({
        where: { studentId, status: 'COMPLETED' },
      }),
      this.prisma.meetingAttendance.count({
        where: { studentId, joinedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
      this.prisma.meetingSchedule.count({
        where: {
          zoomMeeting: { status: 'SCHEDULED' },
          startTime: { gte: new Date() },
        },
      }),
      this.prisma.assignmentSubmission.count({
        where: { studentId, status: { in: ['DRAFT', 'SUBMITTED'] } },
      }),
      this.prisma.examAttempt.count({
        where: {
          studentId,
          status: { in: ['IN_PROGRESS', 'SUBMITTED'] },
        },
      }),
      this.prisma.certificate.count({
        where: { studentId, status: 'ISSUED' },
      }),
      this.prisma.notification.count({
        where: { userId: user.id, isRead: false },
      }),
    ]);

    // Overall progress: average of course progress
    const courseStudents = await this.prisma.courseStudent.findMany({
      where: { studentId },
      select: { progress: true },
    });
    const avgProgress =
      courseStudents.length > 0
        ? Math.round(
            courseStudents.reduce((sum, cs) => sum + Number(cs.progress), 0) /
              courseStudents.length,
          )
        : 0;

    return {
      myCourses,
      activeCourses,
      completedCourses,
      todayClasses,
      upcomingMeetings,
      pendingHomework,
      upcomingExams,
      certificatesEarned: certificates,
      unreadNotifications: notifications,
      averageProgress: avgProgress,
    };
  }

  async getProgress(user: AuthenticatedUser) {
    const studentId = await this.studentHelper.getStudentId(user);

    const courseStudents = await this.prisma.courseStudent.findMany({
      where: { studentId },
      include: {
        course: { select: { id: true, title: true, totalLessons: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Attendance percentage
    const attendanceRecords = await this.prisma.meetingAttendance.findMany({
      where: { studentId },
      select: { status: true },
    });
    const presentCount = attendanceRecords.filter((a) => a.status === 'PRESENT').length;
    const attendanceRate =
      attendanceRecords.length > 0
        ? Math.round((presentCount / attendanceRecords.length) * 100)
        : 0;

    // Homework completion
    const submissions = await this.prisma.assignmentSubmission.findMany({
      where: { studentId },
      select: { status: true },
    });
    const gradedCount = submissions.filter((s) => s.status === 'GRADED').length;
    const homeworkCompletion =
      submissions.length > 0 ? Math.round((gradedCount / submissions.length) * 100) : 0;

    // Exam scores
    const results = await this.prisma.examResult.findMany({
      where: { studentId },
      select: { percentage: true, passed: true },
    });
    const examResults = results.map((r) => ({
      percentage: Number(r.percentage ?? 0),
      passed: r.passed,
    }));
    const examAverage =
      examResults.length > 0
        ? Math.round(examResults.reduce((sum, r) => sum + r.percentage, 0) / examResults.length)
        : 0;

    // Achievements
    const completedCourseCount = await this.prisma.courseStudent.count({
      where: { studentId, status: 'COMPLETED' },
    });
    const certificateCount = await this.prisma.certificate.count({
      where: { studentId, status: 'ISSUED' },
    });

    const achievements: { title: string; icon: string }[] = [];
    if (courseStudents.length >= 1)
      achievements.push({ title: 'First Course Enrolled', icon: '🎓' });
    if (completedCourseCount >= 1) achievements.push({ title: 'Course Completed', icon: '🏆' });
    if (attendanceRate >= 90) achievements.push({ title: '90% Attendance', icon: '📅' });
    if (certificateCount >= 1) achievements.push({ title: 'Certificate Earned', icon: '📜' });

    return {
      courses: courseStudents.map((cs) => ({
        courseId: cs.courseId,
        title: cs.course.title,
        progress: Number(cs.progress),
        status: cs.status,
        completedAt: cs.completedAt,
      })),
      attendanceRate,
      homeworkCompletion,
      examAverage,
      examResults,
      achievements,
    };
  }
}
