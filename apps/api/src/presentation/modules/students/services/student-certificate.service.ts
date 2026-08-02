import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { StudentHelper, AuthenticatedUser } from '../student.helper';

@Injectable()
export class StudentCertificateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentHelper: StudentHelper,
  ) {}

  async getCertificates(user: AuthenticatedUser) {
    const studentId = await this.studentHelper.getStudentId(user);

    const certificates = await this.prisma.certificate.findMany({
      where: { studentId },
      include: {
        template: true,
        course: { select: { id: true, title: true } },
        downloads: true,
      },
      orderBy: { issuedAt: 'desc' },
    });

    return certificates.map((c) => ({
      id: c.id,
      certificateNumber: c.certificateNumber,
      title: c.title,
      courseId: c.courseId,
      courseTitle: c.course?.title,
      issuedAt: c.issuedAt,
      expiresAt: c.expiresAt,
      status: c.status,
      pdfUrl: c.pdfUrl,
      templateName: c.template?.name,
      downloadCount: c.downloads.length,
    }));
  }

  async getCertificateDetail(
    user: AuthenticatedUser,
    certificateId: string,
  ): Promise<Record<string, any>> {
    const studentId = await this.studentHelper.getStudentId(user);

    const certificate = await this.prisma.certificate.findFirst({
      where: { id: certificateId, studentId },
      include: {
        template: true,
        course: { select: { id: true, title: true, slug: true } },
        downloads: { orderBy: { downloadedAt: 'desc' } },
      },
    });

    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    return {
      id: certificate.id,
      certificateNumber: certificate.certificateNumber,
      title: certificate.title,
      courseId: certificate.courseId,
      courseTitle: certificate.course?.title,
      issuedAt: certificate.issuedAt,
      expiresAt: certificate.expiresAt,
      status: certificate.status,
      pdfUrl: certificate.pdfUrl,
      metadata: certificate.metadata,
      templateName: certificate.template?.name,
      downloads: certificate.downloads.map((d) => ({
        id: d.id,
        format: d.format,
        downloadedAt: d.downloadedAt,
      })),
    };
  }

  async recordDownload(user: AuthenticatedUser, certificateId: string) {
    const studentId = await this.studentHelper.getStudentId(user);

    const certificate = await this.prisma.certificate.findFirst({
      where: { id: certificateId, studentId },
    });
    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    const download = await this.prisma.certificateDownload.create({
      data: {
        certificateId,
        userId: user.id,
        format: 'PDF',
        downloadedAt: new Date(),
      },
    });

    return {
      success: true,
      downloadId: download.id,
      pdfUrl: certificate.pdfUrl,
      certificateNumber: certificate.certificateNumber,
    };
  }

  async verifyCertificate(certificateNumber: string) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { certificateNumber },
      include: {
        student: { include: { user: { include: { profile: true } } } },
        course: { select: { id: true, title: true } },
      },
    });

    if (!certificate || certificate.status !== 'ISSUED') {
      throw new NotFoundException('Certificate not found or not valid');
    }

    const studentName = certificate.student.user.profile
      ? `${certificate.student.user.profile.firstName} ${certificate.student.user.profile.lastName}`
      : certificate.student.user.email;

    return {
      valid: true,
      certificateNumber: certificate.certificateNumber,
      title: certificate.title,
      studentName,
      courseTitle: certificate.course?.title,
      issuedAt: certificate.issuedAt,
    };
  }
}
