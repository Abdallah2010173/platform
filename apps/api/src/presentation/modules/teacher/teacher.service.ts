import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { TeacherHelper, AuthenticatedUser } from './teacher.helper';

@Injectable()
export class TeacherService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly teacherHelper: TeacherHelper,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════

  async getStats(user: AuthenticatedUser) {
    const teacherId = await this.teacherHelper.getTeacherId(user);

    const [
      myCourses,
      publishedCourses,
      totalStudents,
      totalRevenue,
      pendingHomework,
      upcomingMeetings,
      unreadNotifications,
    ] = await Promise.all([
      this.prisma.course.count({ where: { teachers: { some: { teacherId } }, deletedAt: null } }),
      this.prisma.course.count({
        where: { teachers: { some: { teacherId } }, isPublished: true, deletedAt: null },
      }),
      this.prisma.courseStudent.count({
        where: { course: { teachers: { some: { teacherId } } }, status: 'ACTIVE' },
      }),
      this.prisma.course.aggregate({
        where: { teachers: { some: { teacherId } }, deletedAt: null },
        _sum: { revenue: true },
      }),
      this.prisma.assignmentSubmission.count({
        where: {
          assignment: { teacherId },
          status: { in: ['DRAFT', 'SUBMITTED'] },
        },
      }),
      this.prisma.meetingSchedule.count({
        where: {
          teacherId,
          startTime: { gte: new Date() },
          status: 'ACTIVE',
        },
      }),
      this.prisma.notification.count({ where: { userId: user.id, isRead: false } }),
    ]);

    const avgRating = await this.prisma.teacherRating.aggregate({
      where: { teacherId },
      _avg: { rating: true },
      _count: true,
    });

    return {
      myCourses,
      publishedCourses,
      totalStudents,
      totalRevenue: Number(totalRevenue._sum.revenue ?? 0),
      pendingHomework,
      upcomingMeetings,
      unreadNotifications,
      averageRating: Number(avgRating._avg.rating ?? 0),
      ratingCount: avgRating._count,
    };
  }

  async getAnalytics(user: AuthenticatedUser) {
    const teacherId = await this.teacherHelper.getTeacherId(user);

    const courses = await this.prisma.course.findMany({
      where: { teachers: { some: { teacherId } }, deletedAt: null },
      include: {
        students: { select: { status: true, progress: true } },
        _count: { select: { reviews: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      courses: courses.map((c) => ({
        id: c.id,
        title: c.title,
        isPublished: c.isPublished,
        status: c.status,
        totalStudents: c.totalStudents,
        averageRating: Number(c.averageRating),
        ratingCount: c.ratingCount,
        revenue: Number(c.revenue),
        views: c.views,
        completionRate: c.completionRate ? Number(c.completionRate) : null,
        activeStudents: c.students.filter((s) => s.status === 'ACTIVE').length,
      })),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROFILE
  // ═══════════════════════════════════════════════════════════════════════════

  async getProfile(user: AuthenticatedUser) {
    const teacher = await this.teacherHelper.getTeacherWithUser(user);
    const profile = teacher.user.profile;

    return {
      id: teacher.id,
      userId: user.id,
      email: user.email,
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      displayName: profile?.displayName,
      avatarUrl: profile?.avatarUrl,
      phone: profile?.phone,
      bio: teacher.bio ?? profile?.bio,
      timezone: profile?.timezone ?? 'UTC',
      locale: profile?.locale ?? 'en',
      gender: profile?.gender,
      city: profile?.city,
      state: profile?.state,
      country: profile?.country,
      title: teacher.title,
      department: teacher.department,
      expertise: teacher.expertise,
      hourlyRate: teacher.hourlyRate ? Number(teacher.hourlyRate) : null,
      isVerified: teacher.isVerified,
      rating: Number(teacher.rating),
      ratingCount: teacher.ratingCount,
      totalStudents: teacher.totalStudents,
      totalCourses: teacher.totalCourses,
    };
  }

  async updateProfile(
    user: AuthenticatedUser,
    dto: {
      firstName?: string;
      lastName?: string;
      displayName?: string;
      avatarUrl?: string;
      phone?: string;
      bio?: string;
      timezone?: string;
      locale?: string;
      gender?: string;
      city?: string;
      state?: string;
      country?: string;
      title?: string;
      department?: string;
      expertise?: string[];
      hourlyRate?: number;
    },
  ) {
    const teacher = await this.teacherHelper.getTeacherWithUser(user);

    if (
      dto.firstName ||
      dto.lastName ||
      dto.displayName ||
      dto.avatarUrl ||
      dto.phone ||
      dto.timezone ||
      dto.locale ||
      dto.gender ||
      dto.city ||
      dto.state ||
      dto.country
    ) {
      await this.prisma.userProfile.update({
        where: { userId: user.id },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          displayName: dto.displayName,
          avatarUrl: dto.avatarUrl,
          phone: dto.phone,
          timezone: dto.timezone,
          locale: dto.locale,
          gender: dto.gender,
          city: dto.city,
          state: dto.state,
          country: dto.country,
        },
      });
    }

    await this.prisma.teacher.update({
      where: { id: teacher.id },
      data: {
        title: dto.title,
        department: dto.department,
        bio: dto.bio,
        expertise: dto.expertise,
        hourlyRate: dto.hourlyRate,
      },
    });

    return this.getProfile(user);
  }

  async changePassword(
    user: AuthenticatedUser,
    dto: { currentPassword: string; newPassword: string },
  ) {
    const dbUser = await this.prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) throw new NotFoundException('User not found');
    if (!dbUser.passwordHash)
      throw new ConflictException('Password login is not enabled for this account');

    const valid = await bcrypt.compare(dto.currentPassword, dbUser.passwordHash);
    if (!valid) throw new ConflictException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STUDENTS
  // ═══════════════════════════════════════════════════════════════════════════

  async getStudents(user: AuthenticatedUser, courseId?: string, search?: string) {
    const teacherId = await this.teacherHelper.getTeacherId(user);

    const where: Prisma.CourseStudentWhereInput = {
      course: { teachers: { some: { teacherId } } },
      ...(courseId && courseId !== 'ALL' ? { courseId } : {}),
      ...(search
        ? {
            student: {
              user: {
                OR: [
                  { profile: { firstName: { contains: search, mode: 'insensitive' } } },
                  { profile: { lastName: { contains: search, mode: 'insensitive' } } },
                  { email: { contains: search, mode: 'insensitive' } },
                ],
              },
            },
          }
        : {}),
    };

    const enrollments = await this.prisma.courseStudent.findMany({
      where,
      include: {
        student: { include: { user: { include: { profile: true } } } },
        course: { select: { id: true, title: true } },
      },
      orderBy: { enrolledAt: 'desc' },
      take: 100,
    });

    return enrollments.map((e) => ({
      enrollmentId: e.id,
      studentId: e.studentId,
      name: e.student.user.profile
        ? `${e.student.user.profile.firstName} ${e.student.user.profile.lastName}`
        : e.student.user.email,
      email: e.student.user.email,
      avatarUrl: e.student.user.profile?.avatarUrl,
      courseId: e.courseId,
      courseTitle: e.course.title,
      progress: Number(e.progress),
      status: e.status,
      enrolledAt: e.enrolledAt,
      completedAt: e.completedAt,
    }));
  }

  async getAllStudents(user: AuthenticatedUser, search?: string) {
    await this.teacherHelper.getTeacherId(user);
    const students = await this.prisma.student.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        ...(search
          ? {
              user: {
                OR: [
                  { email: { contains: search, mode: 'insensitive' } },
                  { profile: { firstName: { contains: search, mode: 'insensitive' } } },
                  { profile: { lastName: { contains: search, mode: 'insensitive' } } },
                ],
              },
            }
          : {}),
      },
      include: { user: { include: { profile: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return students.map((student) => ({
      id: student.id,
      userId: student.userId,
      name: student.user.profile
        ? `${student.user.profile.firstName} ${student.user.profile.lastName}`.trim()
        : student.user.email,
      email: student.user.email,
      avatarUrl: student.user.profile?.avatarUrl,
    }));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ASSIGNMENTS / HOMEWORK
  // ═══════════════════════════════════════════════════════════════════════════

  async getAssignments(user: AuthenticatedUser, courseId?: string) {
    const teacherId = await this.teacherHelper.getTeacherId(user);

    const assignments = await this.prisma.assignment.findMany({
      where: {
        teacherId,
        ...(courseId && courseId !== 'ALL' ? { courseId } : {}),
        deletedAt: null,
      },
      include: {
        course: { select: { id: true, title: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return assignments.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      type: a.type,
      dueDate: a.dueDate,
      totalMarks: a.totalMarks,
      isPublished: a.isPublished,
      courseId: a.courseId,
      courseTitle: a.course.title,
      submissionCount: a._count.submissions,
    }));
  }

  async createAssignment(user: AuthenticatedUser, courseId: string, dto: any) {
    const teacherId = await this.teacherHelper.getTeacherId(user);
    await this.assertCourseAccess(courseId, teacherId);

    const assignment = await this.prisma.assignment.create({
      data: {
        courseId,
        teacherId,
        title: dto.title,
        description: dto.description,
        type: dto.type ?? 'HOMEWORK',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        totalMarks: dto.totalMarks,
        isPublished: dto.isPublished ?? true,
        instructions: dto.instructions,
        attachmentsJson: dto.attachmentsJson as Prisma.InputJsonValue | undefined,
      },
    });
    return assignment;
  }

  async updateAssignment(user: AuthenticatedUser, assignmentId: string, dto: any) {
    const teacherId = await this.teacherHelper.getTeacherId(user);
    const assignment = await this.prisma.assignment.findFirst({
      where: { id: assignmentId, teacherId, deletedAt: null },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');

    const updated = await this.prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        totalMarks: dto.totalMarks,
        isPublished: dto.isPublished,
        instructions: dto.instructions,
        attachmentsJson: dto.attachmentsJson as Prisma.InputJsonValue | undefined,
      },
    });
    return updated;
  }

  async deleteAssignment(user: AuthenticatedUser, assignmentId: string) {
    const teacherId = await this.teacherHelper.getTeacherId(user);
    const assignment = await this.prisma.assignment.findFirst({
      where: { id: assignmentId, teacherId, deletedAt: null },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    await this.prisma.assignment.update({
      where: { id: assignmentId },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }

  async getSubmissions(user: AuthenticatedUser, assignmentId: string) {
    const teacherId = await this.teacherHelper.getTeacherId(user);
    const assignment = await this.prisma.assignment.findFirst({
      where: { id: assignmentId, teacherId, deletedAt: null },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');

    const submissions = await this.prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      include: {
        student: { include: { user: { include: { profile: true } } } },
        grade: true,
      },
      orderBy: { submittedAt: 'desc' },
    });

    return submissions.map((s) => ({
      id: s.id,
      studentId: s.studentId,
      name: s.student.user.profile
        ? `${s.student.user.profile.firstName} ${s.student.user.profile.lastName}`
        : s.student.user.email,
      content: s.content,
      submissionFiles: s.submissionFiles,
      submittedAt: s.submittedAt,
      status: s.status,
      isLate: s.isLate,
      grade: s.grade
        ? {
            marksObtained: s.grade.marksObtained ? Number(s.grade.marksObtained) : null,
            totalMarks: s.grade.totalMarks ? Number(s.grade.totalMarks) : null,
            percentage: s.grade.percentage ? Number(s.grade.percentage) : null,
            letterGrade: s.grade.letterGrade,
            feedback: s.grade.feedback,
            gradedAt: s.grade.gradedAt,
          }
        : null,
    }));
  }

  async gradeSubmission(user: AuthenticatedUser, submissionId: string, dto: any) {
    const teacherId = await this.teacherHelper.getTeacherId(user);
    const submission = await this.prisma.assignmentSubmission.findFirst({
      where: {
        id: submissionId,
        assignment: { teacherId },
      },
      include: { assignment: true },
    });
    if (!submission) throw new NotFoundException('Submission not found');

    const totalMarks = dto.totalMarks ?? submission.assignment?.totalMarks ?? 0;
    const percentage =
      totalMarks > 0 ? Math.round(((dto.marksObtained ?? 0) / totalMarks) * 10000) / 100 : 0;

    await this.prisma.submissionGrade.upsert({
      where: { submissionId },
      create: {
        submissionId,
        marksObtained: dto.marksObtained,
        totalMarks,
        percentage,
        letterGrade: dto.letterGrade,
        feedback: dto.feedback,
        gradedBy: user.id,
        gradedAt: new Date(),
      },
      update: {
        marksObtained: dto.marksObtained,
        totalMarks,
        percentage,
        letterGrade: dto.letterGrade,
        feedback: dto.feedback,
        gradedBy: user.id,
        gradedAt: new Date(),
      },
    });

    await this.prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: { status: 'GRADED' },
    });

    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXAMS
  // ═══════════════════════════════════════════════════════════════════════════

  async getExams(user: AuthenticatedUser, courseId?: string) {
    const teacherId = await this.teacherHelper.getTeacherId(user);

    const exams = await this.prisma.exam.findMany({
      where: {
        course: { teachers: { some: { teacherId } } },
        ...(courseId && courseId !== 'ALL' ? { courseId } : {}),
        deletedAt: null,
      },
      include: {
        course: { select: { id: true, title: true } },
        _count: { select: { sections: true, attempts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return exams.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      type: e.type,
      durationMinutes: e.durationMinutes,
      totalMarks: e.totalMarks,
      passMarks: e.passMarks,
      startTime: e.startTime,
      endTime: e.endTime,
      isPublished: e.isPublished,
      maxAttempts: e.maxAttempts,
      courseId: e.courseId,
      courseTitle: e.course.title,
      sectionCount: e._count.sections,
      attemptCount: e._count.attempts,
    }));
  }

  async createExam(user: AuthenticatedUser, courseId: string, dto: any) {
    const teacherId = await this.teacherHelper.getTeacherId(user);
    await this.assertCourseAccess(courseId, teacherId);

    const exam = await this.prisma.exam.create({
      data: {
        courseId,
        title: dto.title,
        description: dto.description,
        type: dto.type ?? 'MIXED',
        durationMinutes: dto.durationMinutes,
        totalMarks: dto.totalMarks,
        passMarks: dto.passMarks,
        startTime: dto.startTime ? new Date(dto.startTime) : null,
        endTime: dto.endTime ? new Date(dto.endTime) : null,
        isPublished: dto.isPublished ?? false,
        instructions: dto.instructions,
        shuffleQuestions: dto.shuffleQuestions ?? false,
        maxAttempts: dto.maxAttempts ?? 1,
      },
    });
    return exam;
  }

  async updateExam(user: AuthenticatedUser, examId: string, dto: any) {
    const teacherId = await this.teacherHelper.getTeacherId(user);
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, course: { teachers: { some: { teacherId } } }, deletedAt: null },
    });
    if (!exam) throw new NotFoundException('Exam not found');

    const updated = await this.prisma.exam.update({
      where: { id: examId },
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type,
        durationMinutes: dto.durationMinutes,
        totalMarks: dto.totalMarks,
        passMarks: dto.passMarks,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        endTime: dto.endTime ? new Date(dto.endTime) : undefined,
        isPublished: dto.isPublished,
        instructions: dto.instructions,
        shuffleQuestions: dto.shuffleQuestions,
        maxAttempts: dto.maxAttempts,
      },
    });
    return updated;
  }

  async deleteExam(user: AuthenticatedUser, examId: string) {
    const teacherId = await this.teacherHelper.getTeacherId(user);
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, course: { teachers: { some: { teacherId } } }, deletedAt: null },
    });
    if (!exam) throw new NotFoundException('Exam not found');
    await this.prisma.exam.update({ where: { id: examId }, data: { deletedAt: new Date() } });
    return { success: true };
  }

  async getExamResults(user: AuthenticatedUser, examId: string) {
    const teacherId = await this.teacherHelper.getTeacherId(user);
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, course: { teachers: { some: { teacherId } } }, deletedAt: null },
    });
    if (!exam) throw new NotFoundException('Exam not found');

    const results = await this.prisma.examResult.findMany({
      where: { examId },
      include: {
        student: { include: { user: { include: { profile: true } } } },
        attempt: true,
      },
      orderBy: { percentage: 'desc' },
    });

    return results.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      name: r.student.user.profile
        ? `${r.student.user.profile.firstName} ${r.student.user.profile.lastName}`
        : r.student.user.email,
      totalMarks: r.totalMarks ? Number(r.totalMarks) : null,
      obtainedMarks: r.obtainedMarks ? Number(r.obtainedMarks) : null,
      percentage: r.percentage ? Number(r.percentage) : null,
      grade: r.grade,
      rank: r.rank,
      passed: r.passed,
      submittedAt: r.attempt.submittedAt,
      publishedAt: r.publishedAt,
    }));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // QUESTION BANK
  // ═══════════════════════════════════════════════════════════════════════════

  async getQuestionBanks(user: AuthenticatedUser, courseId?: string) {
    const teacherId = await this.teacherHelper.getTeacherId(user);

    const banks = await this.prisma.questionBank.findMany({
      where: {
        teacherId,
        ...(courseId && courseId !== 'ALL' ? { courseId } : {}),
        deletedAt: null,
      },
      include: {
        course: { select: { id: true, title: true } },
        _count: { select: { questions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return banks.map((b) => ({
      id: b.id,
      title: b.title,
      description: b.description,
      subject: b.subject,
      isPublic: b.isPublic,
      totalQuestions: b._count.questions,
      courseId: b.courseId,
      courseTitle: b.course?.title,
    }));
  }

  async createQuestionBank(user: AuthenticatedUser, dto: any) {
    const teacherId = await this.teacherHelper.getTeacherId(user);

    const bank = await this.prisma.questionBank.create({
      data: {
        courseId: dto.courseId,
        teacherId,
        title: dto.title,
        description: dto.description,
        subject: dto.subject,
        isPublic: dto.isPublic ?? false,
      },
    });
    return bank;
  }

  async addQuestions(user: AuthenticatedUser, bankId: string, dto: any) {
    const teacherId = await this.teacherHelper.getTeacherId(user);
    const bank = await this.prisma.questionBank.findFirst({
      where: { id: bankId, teacherId, deletedAt: null },
    });
    if (!bank) throw new NotFoundException('Question bank not found');

    const questions = dto.questions as any[];
    for (const q of questions) {
      await this.prisma.question.create({
        data: {
          questionBankId: bankId,
          text: q.text,
          type: q.type ?? 'MULTIPLE_CHOICE',
          marks: q.marks ?? 1,
          difficulty: q.difficulty ?? 'MEDIUM',
          explanation: q.explanation,
          options: q.options as Prisma.InputJsonValue | undefined,
          correctAnswer: q.correctAnswer as Prisma.InputJsonValue | undefined,
          createdBy: user.id,
          choices: q.choices
            ? {
                create: q.choices.map((c: any, idx: number) => ({
                  text: c.text,
                  isCorrect: c.isCorrect ?? false,
                  orderIndex: idx,
                })),
              }
            : undefined,
        },
      });
    }

    await this.prisma.questionBank.update({
      where: { id: bankId },
      data: { totalQuestions: { increment: questions.length } },
    });

    return { success: true, count: questions.length };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MEETINGS
  // ═══════════════════════════════════════════════════════════════════════════

  async getMeetings(user: AuthenticatedUser) {
    const teacherId = await this.teacherHelper.getTeacherId(user);

    const meetings = await this.prisma.zoomMeeting.findMany({
      where: { teacherId, deletedAt: null },
      include: {
        course: { select: { id: true, title: true } },
        _count: { select: { attendance: true } },
      },
      orderBy: { startTime: 'desc' },
    });

    return meetings.map((m) => ({
      id: m.id,
      topic: m.topic,
      description: m.description,
      agenda: m.agenda,
      zoomMeetingId: m.zoomMeetingId,
      startTime: m.startTime,
      durationMinutes: m.durationMinutes,
      timezone: m.timezone,
      joinUrl: m.joinUrl,
      startUrl: m.startUrl,
      password: m.password,
      status: m.status,
      courseId: m.courseId,
      courseTitle: m.course?.title,
      attendanceCount: m._count.attendance,
    }));
  }

  async createMeeting(user: AuthenticatedUser, dto: any) {
    const teacherId = await this.teacherHelper.getTeacherId(user);

    if (dto.courseId) {
      const courseAssignment = await this.prisma.courseTeacher.findFirst({
        where: { courseId: dto.courseId, teacherId, deletedAt: null },
      });
      if (!courseAssignment) {
        throw new ForbiddenException('You can only create meetings for your courses');
      }
    }

    const meeting = await this.prisma.zoomMeeting.create({
      data: {
        courseId: dto.courseId,
        teacherId,
        topic: dto.topic,
        description: dto.description,
        agenda: dto.agenda,
        startTime: new Date(dto.startTime),
        durationMinutes: dto.durationMinutes ?? 60,
        timezone: dto.timezone ?? 'UTC',
        joinUrl: dto.joinUrl,
        startUrl: dto.startUrl,
        password: dto.password,
        status: dto.status ?? 'SCHEDULED',
        settings: dto.settings as Prisma.InputJsonValue | undefined,
      },
    });

    // Create a schedule record
    const endTime = new Date(meeting.startTime);
    endTime.setMinutes(endTime.getMinutes() + meeting.durationMinutes);
    await this.prisma.meetingSchedule.create({
      data: {
        zoomMeetingId: meeting.id,
        courseId: dto.courseId,
        teacherId,
        title: dto.topic,
        startTime: meeting.startTime,
        endTime,
        status: 'ACTIVE',
      },
    });

    return meeting;
  }

  async updateMeeting(user: AuthenticatedUser, meetingId: string, dto: any) {
    const teacherId = await this.teacherHelper.getTeacherId(user);
    const meeting = await this.prisma.zoomMeeting.findFirst({
      where: { id: meetingId, teacherId, deletedAt: null },
    });
    if (!meeting) throw new NotFoundException('Meeting not found');

    const updated = await this.prisma.zoomMeeting.update({
      where: { id: meetingId },
      data: {
        topic: dto.topic,
        description: dto.description,
        agenda: dto.agenda,
        startTime: dto.startTime ? new Date(dto.startTime) : undefined,
        durationMinutes: dto.durationMinutes,
        timezone: dto.timezone,
        joinUrl: dto.joinUrl,
        startUrl: dto.startUrl,
        password: dto.password,
        status: dto.status,
        settings: dto.settings as Prisma.InputJsonValue | undefined,
      },
    });
    return updated;
  }

  async deleteMeeting(user: AuthenticatedUser, meetingId: string) {
    const teacherId = await this.teacherHelper.getTeacherId(user);
    const meeting = await this.prisma.zoomMeeting.findFirst({
      where: { id: meetingId, teacherId, deletedAt: null },
    });
    if (!meeting) throw new NotFoundException('Meeting not found');
    await this.prisma.zoomMeeting.update({
      where: { id: meetingId },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AVAILABILITY
  // ═══════════════════════════════════════════════════════════════════════════

  async getAvailability(user: AuthenticatedUser) {
    const teacherId = await this.teacherHelper.getTeacherId(user);
    return this.prisma.teacherAvailability.findMany({
      where: { teacherId, deletedAt: null },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async setAvailability(user: AuthenticatedUser, dto: any) {
    const teacherId = await this.teacherHelper.getTeacherId(user);

    const availability = await this.prisma.teacherAvailability.create({
      data: {
        teacherId,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        isAvailable: dto.isAvailable ?? true,
        recurrence: dto.recurrence ?? 'WEEKLY',
        validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
        validTo: dto.validTo ? new Date(dto.validTo) : null,
      },
    });
    return availability;
  }

  async updateAvailability(user: AuthenticatedUser, availabilityId: string, dto: any) {
    const teacherId = await this.teacherHelper.getTeacherId(user);
    const availability = await this.prisma.teacherAvailability.findFirst({
      where: { id: availabilityId, teacherId, deletedAt: null },
    });
    if (!availability) throw new NotFoundException('Availability not found');

    const updated = await this.prisma.teacherAvailability.update({
      where: { id: availabilityId },
      data: {
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        isAvailable: dto.isAvailable,
        recurrence: dto.recurrence,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
      },
    });
    return updated;
  }

  async deleteAvailability(user: AuthenticatedUser, availabilityId: string) {
    const teacherId = await this.teacherHelper.getTeacherId(user);
    const availability = await this.prisma.teacherAvailability.findFirst({
      where: { id: availabilityId, teacherId, deletedAt: null },
    });
    if (!availability) throw new NotFoundException('Availability not found');
    await this.prisma.teacherAvailability.update({
      where: { id: availabilityId },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CALENDAR
  // ═══════════════════════════════════════════════════════════════════════════

  async getCalendar(user: AuthenticatedUser, start?: string, end?: string) {
    const teacherId = await this.teacherHelper.getTeacherId(user);
    const startDate = start ? new Date(start) : new Date(new Date().setHours(0, 0, 0, 0));
    const endDate = end ? new Date(end) : new Date(new Date().setDate(startDate.getDate() + 30));

    const [meetings, assignments, exams, bookings] = await Promise.all([
      this.prisma.meetingSchedule.findMany({
        where: { teacherId, startTime: { gte: startDate, lte: endDate } },
        include: { zoomMeeting: { select: { id: true, topic: true, joinUrl: true } } },
      }),
      this.prisma.assignment.findMany({
        where: { teacherId, dueDate: { gte: startDate, lte: endDate } },
        select: { id: true, title: true, dueDate: true, course: { select: { title: true } } },
      }),
      this.prisma.exam.findMany({
        where: {
          course: { teachers: { some: { teacherId } } },
          OR: [
            { startTime: { gte: startDate, lte: endDate } },
            { endTime: { gte: startDate, lte: endDate } },
          ],
        },
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          course: { select: { title: true } },
        },
      }),
      this.prisma.booking.findMany({
        where: { teacherId, startTime: { gte: startDate, lte: endDate }, deletedAt: null },
        include: { status: { select: { name: true, label: true } } },
      }),
    ]);

    return {
      meetings: meetings.map((m) => ({
        id: m.id,
        type: 'MEETING',
        title: m.title,
        start: m.startTime,
        end: m.endTime,
        meetingId: m.zoomMeetingId,
        joinUrl: m.zoomMeeting.joinUrl,
      })),
      assignments: assignments.map((a) => ({
        id: a.id,
        type: 'ASSIGNMENT',
        title: a.title,
        courseTitle: a.course.title,
        dueDate: a.dueDate,
      })),
      exams: exams.map((e) => ({
        id: e.id,
        type: 'EXAM',
        title: e.title,
        courseTitle: e.course.title,
        startTime: e.startTime,
        endTime: e.endTime,
      })),
      bookings: bookings.map((b) => ({
        id: b.id,
        type: 'BOOKING',
        title: b.bookingNumber,
        start: b.startTime,
        end: b.endTime,
        status: b.status.label,
      })),
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ATTENDANCE
  // ═══════════════════════════════════════════════════════════════════════════

  async getAttendance(user: AuthenticatedUser, meetingId: string) {
    const teacherId = await this.teacherHelper.getTeacherId(user);
    const meeting = await this.prisma.zoomMeeting.findFirst({
      where: { id: meetingId, teacherId, deletedAt: null },
    });
    if (!meeting) throw new NotFoundException('Meeting not found');

    const records = await this.prisma.meetingAttendance.findMany({
      where: { meetingId },
      include: {
        student: { include: { user: { include: { profile: true } } } },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return records.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      name: r.student.user.profile
        ? `${r.student.user.profile.firstName} ${r.student.user.profile.lastName}`
        : r.student.user.email,
      joinedAt: r.joinedAt,
      leftAt: r.leftAt,
      durationSeconds: r.durationSeconds,
      status: r.status,
    }));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  async getNotifications(user: AuthenticatedUser, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId: user.id, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId: user.id, deletedAt: null } }),
    ]);

    return {
      items: notifications.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        type: n.type,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async markNotificationRead(user: AuthenticatedUser, notificationId: string) {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId: user.id },
      data: { isRead: true, readAt: new Date() },
    });
    return { success: true };
  }

  async markAllNotificationsRead(user: AuthenticatedUser) {
    await this.prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  private async assertCourseAccess(courseId: string, teacherId: string) {
    const rel = await this.prisma.courseTeacher.findFirst({
      where: { courseId, teacherId },
    });
    if (!rel) {
      const course = await this.prisma.course.findUnique({ where: { id: courseId } });
      if (!course) throw new NotFoundException('Course not found');
      throw new ConflictException('You do not have access to this course');
    }
  }
}
