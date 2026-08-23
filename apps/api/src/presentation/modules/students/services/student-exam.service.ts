import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { StudentHelper, AuthenticatedUser } from '../student.helper';

@Injectable()
export class StudentExamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentHelper: StudentHelper,
  ) {}

  async getAvailableExams(user: AuthenticatedUser) {
    const studentId = await this.studentHelper.getStudentId(user);

    const exams = await this.prisma.exam.findMany({
      where: {
        isPublished: true,
        course: { students: { some: { studentId } } },
      },
      include: {
        course: { select: { id: true, title: true } },
        attempts: {
          where: { studentId },
          select: { id: true, status: true, score: true, percentage: true, isPassed: true },
        },
        _count: { select: { sections: true } },
      },
      orderBy: { startTime: 'asc' },
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
      courseId: e.courseId,
      courseTitle: e.course.title,
      sectionCount: e._count.sections,
      attempts: e.attempts.map((a) => ({
        id: a.id,
        status: a.status,
        score: a.score ? Number(a.score) : null,
        percentage: a.percentage ? Number(a.percentage) : null,
        isPassed: a.isPassed,
      })),
      maxAttempts: e.maxAttempts,
      attemptCount: e.attempts.length,
      resourceType: e.resourceType,
      resourceUrl: e.resourceUrl,
    }));
  }

  async startExam(user: AuthenticatedUser, examId: string) {
    const studentId = await this.studentHelper.getStudentId(user);

    const exam = await this.prisma.exam.findFirst({
      where: {
        id: examId,
        isPublished: true,
        course: { students: { some: { studentId } } },
      },
      include: {
        sections: {
          include: {
            questions: {
              include: {
                choices: { orderBy: { orderIndex: 'asc' } },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // Check time window
    if (exam.startTime && new Date() < exam.startTime) {
      throw new ConflictException('Exam has not started yet');
    }
    if (exam.endTime && new Date() > exam.endTime) {
      throw new ConflictException('Exam has already ended');
    }

    // Check attempt limit
    const existingAttempts = await this.prisma.examAttempt.count({
      where: { examId, studentId },
    });
    if (existingAttempts >= exam.maxAttempts) {
      throw new ConflictException('Maximum attempts reached for this exam');
    }

    // Reuse in-progress attempt if exists
    const inProgress = await this.prisma.examAttempt.findFirst({
      where: { examId, studentId, status: 'IN_PROGRESS' },
      include: { answers: true },
    });

    if (inProgress) {
      return {
        attemptId: inProgress.id,
        status: inProgress.status,
        startedAt: inProgress.startedAt,
        questions: this.mapQuestions(exam),
      };
    }

    const attempt = await this.prisma.examAttempt.create({
      data: {
        examId,
        studentId,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });

    return {
      attemptId: attempt.id,
      status: attempt.status,
      startedAt: attempt.startedAt,
      questions: this.mapQuestions(exam),
    };
  }

  private mapQuestions(exam: any) {
    return exam.sections.map((section: any) => ({
      sectionId: section.id,
      sectionTitle: section.title,
      questions: section.questions.map((q: any) => ({
        id: q.id,
        text: q.text,
        type: q.type,
        marks: q.marks,
        difficulty: q.difficulty,
        choices: q.choices.map((c: any) => ({
          id: c.id,
          text: c.text,
        })),
      })),
    }));
  }

  async submitExam(
    user: AuthenticatedUser,
    attemptId: string,
    dto: {
      answers: {
        questionId: string;
        choiceId?: string;
        answer?: any;
      }[];
    },
  ) {
    const studentId = await this.studentHelper.getStudentId(user);

    const attempt = await this.prisma.examAttempt.findFirst({
      where: { id: attemptId, studentId, status: 'IN_PROGRESS' },
    });
    if (!attempt) {
      throw new NotFoundException('Active attempt not found');
    }

    // Save answers
    for (const answer of dto.answers) {
      const existing = await this.prisma.studentAnswer.findUnique({
        where: { attemptId_questionId: { attemptId, questionId: answer.questionId } },
      });

      if (existing) {
        await this.prisma.studentAnswer.update({
          where: { id: existing.id },
          data: {
            choiceId: answer.choiceId,
            answer: answer.answer,
          },
        });
      } else {
        await this.prisma.studentAnswer.create({
          data: {
            attemptId,
            questionId: answer.questionId,
            studentId,
            choiceId: answer.choiceId,
            answer: answer.answer,
          },
        });
      }
    }

    // Auto-grade MCQ / True-False
    const questions = await this.prisma.question.findMany({
      where: {
        id: { in: dto.answers.map((a) => a.questionId) },
        type: { in: ['MULTIPLE_CHOICE', 'TRUE_FALSE'] },
      },
      include: { choices: true },
    });

    let score = 0;
    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

    for (const q of questions) {
      const answer = dto.answers.find((a) => a.questionId === q.id);
      if (!answer?.choiceId) continue;

      const correctChoice = q.choices.find((c) => c.isCorrect);
      if (correctChoice && correctChoice.id === answer.choiceId) {
        score += q.marks;
      }
    }

    await this.prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        score,
        timeSpentSeconds: Math.round((new Date().getTime() - attempt.startedAt.getTime()) / 1000),
      },
    });

    return {
      success: true,
      autoGraded: questions.length > 0,
      score,
      totalMarks,
    };
  }

  async getResults(user: AuthenticatedUser) {
    const studentId = await this.studentHelper.getStudentId(user);

    const results = await this.prisma.examResult.findMany({
      where: { studentId },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            course: { select: { title: true } },
          },
        },
        attempt: true,
      },
      orderBy: { publishedAt: 'desc' },
    });

    return results.map((r) => ({
      id: r.id,
      examId: r.examId,
      title: r.exam.title,
      courseTitle: r.exam.course.title,
      totalMarks: r.totalMarks ? Number(r.totalMarks) : null,
      obtainedMarks: r.obtainedMarks ? Number(r.obtainedMarks) : null,
      percentage: r.percentage ? Number(r.percentage) : null,
      grade: r.grade,
      rank: r.rank,
      passed: r.passed,
      feedback: r.feedback,
      publishedAt: r.publishedAt,
      submittedAt: r.attempt.submittedAt,
    }));
  }

  async getExamHistory(user: AuthenticatedUser) {
    const studentId = await this.studentHelper.getStudentId(user);

    const attempts = await this.prisma.examAttempt.findMany({
      where: { studentId },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            course: { select: { title: true } },
          },
        },
        results: true,
      },
      orderBy: { startedAt: 'desc' },
    });

    return attempts.map((a) => ({
      id: a.id,
      examId: a.examId,
      title: a.exam.title,
      courseTitle: a.exam.course.title,
      status: a.status,
      startedAt: a.startedAt,
      submittedAt: a.submittedAt,
      timeSpentSeconds: a.timeSpentSeconds,
      score: a.score ? Number(a.score) : null,
      percentage: a.percentage ? Number(a.percentage) : null,
      isPassed: a.isPassed,
      result: a.results[0]
        ? {
            grade: a.results[0].grade,
            rank: a.results[0].rank,
          }
        : null,
    }));
  }

  async getLeaderboard(user: AuthenticatedUser, examId: string) {
    const studentId = await this.studentHelper.getStudentId(user);

    const exam = await this.prisma.exam.findFirst({
      where: {
        id: examId,
        course: { students: { some: { studentId } } },
      },
    });
    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    const results = await this.prisma.examResult.findMany({
      where: { examId },
      include: {
        student: { include: { user: { include: { profile: true } } } },
      },
      orderBy: { percentage: 'desc' },
      take: 50,
    });

    return {
      myRank: results.findIndex((r) => r.studentId === studentId) + 1,
      leaderboard: results.map((r, i) => ({
        rank: i + 1,
        name: r.student.user.profile
          ? `${r.student.user.profile.firstName} ${r.student.user.profile.lastName}`
          : r.student.user.email,
        percentage: r.percentage ? Number(r.percentage) : null,
        grade: r.grade,
        passed: r.passed,
        isMe: r.studentId === studentId,
      })),
    };
  }
}
