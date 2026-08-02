import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { StudentHelper, AuthenticatedUser } from '../student.helper';

@Injectable()
export class StudentHomeworkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentHelper: StudentHelper,
  ) {}

  async getAssignments(user: AuthenticatedUser, status?: string) {
    const studentId = await this.studentHelper.getStudentId(user);

    const statusFilter =
      status === 'ALL' || !status
        ? {}
        : status === 'PENDING'
          ? { submissions: { none: { studentId } } }
          : { submissions: { some: { studentId, status: status as never } } };

    const assignments = await this.prisma.assignment.findMany({
      where: {
        isPublished: true,
        course: { students: { some: { studentId } } },
        ...statusFilter,
      },
      include: {
        course: { select: { id: true, title: true } },
        submissions: {
          where: { studentId },
        },
        files: true,
      },
      orderBy: { dueDate: 'asc' },
    });

    return assignments.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      type: a.type,
      dueDate: a.dueDate,
      totalMarks: a.totalMarks,
      courseId: a.courseId,
      courseTitle: a.course.title,
      submission: a.submissions[0]
        ? {
            id: a.submissions[0].id,
            status: a.submissions[0].status,
            submittedAt: a.submissions[0].submittedAt,
            isLate: a.submissions[0].isLate,
          }
        : null,
      files: a.files.map((f) => ({
        id: f.id,
        fileName: f.fileName,
        fileUrl: f.fileUrl,
        fileSize: f.fileSize ? Number(f.fileSize) : null,
      })),
    }));
  }

  async getAssignmentDetail(
    user: AuthenticatedUser,
    assignmentId: string,
  ): Promise<Record<string, any>> {
    const studentId = await this.studentHelper.getStudentId(user);

    const assignment = await this.prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        isPublished: true,
        course: { students: { some: { studentId } } },
      },
      include: {
        course: { select: { id: true, title: true } },
        files: true,
        submissions: {
          where: { studentId },
          include: {
            grade: true,
            feedback: {
              include: {
                author: { include: { profile: true } },
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    return {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      type: assignment.type,
      dueDate: assignment.dueDate,
      totalMarks: assignment.totalMarks,
      instructions: assignment.instructions,
      courseId: assignment.courseId,
      courseTitle: assignment.course.title,
      files: assignment.files.map((f) => ({
        id: f.id,
        fileName: f.fileName,
        fileUrl: f.fileUrl,
        fileSize: f.fileSize ? Number(f.fileSize) : null,
        mimeType: f.mimeType,
      })),
      submission: assignment.submissions[0]
        ? {
            id: assignment.submissions[0].id,
            content: assignment.submissions[0].content,
            submissionFiles: assignment.submissions[0].submissionFiles,
            status: assignment.submissions[0].status,
            submittedAt: assignment.submissions[0].submittedAt,
            isLate: assignment.submissions[0].isLate,
            grade: assignment.submissions[0].grade
              ? {
                  marksObtained: assignment.submissions[0].grade!.marksObtained
                    ? Number(assignment.submissions[0].grade!.marksObtained)
                    : null,
                  totalMarks: assignment.submissions[0].grade!.totalMarks
                    ? Number(assignment.submissions[0].grade!.totalMarks)
                    : null,
                  percentage: assignment.submissions[0].grade!.percentage
                    ? Number(assignment.submissions[0].grade!.percentage)
                    : null,
                  letterGrade: assignment.submissions[0].grade!.letterGrade,
                  feedback: assignment.submissions[0].grade!.feedback,
                  gradedAt: assignment.submissions[0].grade!.gradedAt,
                }
              : null,
            feedback: assignment.submissions[0].feedback.map((fb) => ({
              id: fb.id,
              content: fb.content,
              authorName: fb.author.profile
                ? `${fb.author.profile.firstName} ${fb.author.profile.lastName}`
                : fb.author.email,
              createdAt: fb.createdAt,
            })),
          }
        : null,
    };
  }

  async submitAssignment(
    user: AuthenticatedUser,
    assignmentId: string,
    dto: { content?: string; submissionFiles?: any; replace?: boolean },
  ) {
    const studentId = await this.studentHelper.getStudentId(user);

    const assignment = await this.prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        isPublished: true,
        course: { students: { some: { studentId } } },
      },
    });
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    const existing = await this.prisma.assignmentSubmission.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId } },
    });

    const isLate = assignment.dueDate ? new Date() > assignment.dueDate : false;

    if (existing) {
      if (!dto.replace) {
        throw new ConflictException(
          'You have already submitted this assignment. Use replace=true to resubmit.',
        );
      }

      await this.prisma.assignmentSubmission.update({
        where: { id: existing.id },
        data: {
          content: dto.content,
          submissionFiles: dto.submissionFiles,
          submittedAt: new Date(),
          isLate,
          status: 'SUBMITTED',
        },
      });

      return { success: true, replaced: true, isLate };
    }

    await this.prisma.assignmentSubmission.create({
      data: {
        assignmentId,
        studentId,
        content: dto.content,
        submissionFiles: dto.submissionFiles,
        submittedAt: new Date(),
        isLate,
        status: 'SUBMITTED',
      },
    });

    return { success: true, replaced: false, isLate };
  }

  async getGrades(user: AuthenticatedUser) {
    const studentId = await this.studentHelper.getStudentId(user);

    const submissions = await this.prisma.assignmentSubmission.findMany({
      where: { studentId, grade: { isNot: null } },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            course: { select: { title: true } },
          },
        },
        grade: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return submissions.map((s) => ({
      assignmentId: s.assignmentId,
      title: s.assignment.title,
      courseTitle: s.assignment.course.title,
      marksObtained: s.grade?.marksObtained ? Number(s.grade.marksObtained) : null,
      totalMarks: s.grade?.totalMarks ? Number(s.grade.totalMarks) : null,
      percentage: s.grade?.percentage ? Number(s.grade.percentage) : null,
      letterGrade: s.grade?.letterGrade,
      feedback: s.grade?.feedback,
      gradedAt: s.grade?.gradedAt,
    }));
  }
}
