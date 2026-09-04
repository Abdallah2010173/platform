import {
  Prisma,
  PrismaClient,
  Role,
  PermissionAction,
  AccountProvider,
  BookingStatusName,
  NotificationType,
  StorageProvider,
  LessonType,
  VideoSource,
  ChapterStatus,
  ChapterVisibility,
  LessonStatus,
  LessonVisibility,
  EnrollmentStatus,
  ProgressStatus,
  ResourceCategoryType,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { loadEnv, getDatabaseUrl } from '../src/load-env';

// Load `.env` from the monorepo root and validate DATABASE_URL before seeding.
loadEnv();

const adapter = new PrismaPg({ connectionString: getDatabaseUrl() });
const prisma = new PrismaClient({ adapter });

// ─── Seed data definitions ───────────────────────────────────────────────────

const PERMISSIONS = [
  { resource: 'users', action: PermissionAction.MANAGE, description: 'Full user management' },
  { resource: 'users', action: PermissionAction.READ, description: 'View users' },
  { resource: 'users', action: PermissionAction.CREATE, description: 'Create users' },
  { resource: 'users', action: PermissionAction.UPDATE, description: 'Update users' },
  { resource: 'users', action: PermissionAction.DELETE, description: 'Delete users' },
  {
    resource: 'roles',
    action: PermissionAction.MANAGE,
    description: 'Manage roles and permissions',
  },
  { resource: 'courses', action: PermissionAction.MANAGE, description: 'Full course management' },
  { resource: 'courses', action: PermissionAction.READ, description: 'View courses' },
  { resource: 'courses', action: PermissionAction.CREATE, description: 'Create courses' },
  { resource: 'courses', action: PermissionAction.UPDATE, description: 'Update courses' },
  { resource: 'courses', action: PermissionAction.DELETE, description: 'Delete courses' },
  { resource: 'exams', action: PermissionAction.MANAGE, description: 'Full exam management' },
  { resource: 'exams', action: PermissionAction.READ, description: 'View exams' },
  { resource: 'bookings', action: PermissionAction.MANAGE, description: 'Manage bookings' },
  { resource: 'bookings', action: PermissionAction.READ, description: 'View bookings' },
  { resource: 'payments', action: PermissionAction.READ, description: 'View payments' },
  {
    resource: 'payments',
    action: PermissionAction.MANAGE,
    description: 'Manage payments and refunds',
  },
  {
    resource: 'notifications',
    action: PermissionAction.MANAGE,
    description: 'Manage notifications',
  },
  { resource: 'audit-logs', action: PermissionAction.READ, description: 'View audit logs' },
  { resource: 'reports', action: PermissionAction.READ, description: 'View reports' },
  {
    resource: 'system-settings',
    action: PermissionAction.MANAGE,
    description: 'Manage system settings',
  },
] as const;

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  [Role.ADMIN]: [
    'users:READ',
    'users:CREATE',
    'users:UPDATE',
    'users:DELETE',
    'users:MANAGE',
    'roles:MANAGE',
    'courses:MANAGE',
    'courses:READ',
    'courses:CREATE',
    'courses:UPDATE',
    'courses:DELETE',
    'exams:MANAGE',
    'exams:READ',
    'bookings:MANAGE',
    'bookings:READ',
    'payments:READ',
    'payments:MANAGE',
    'notifications:MANAGE',
    'audit-logs:READ',
    'reports:READ',
    'system-settings:MANAGE',
  ],
  [Role.TEACHER]: [
    'courses:READ',
    'courses:CREATE',
    'courses:UPDATE',
    'courses:DELETE',
    'exams:MANAGE',
    'exams:READ',
    'bookings:MANAGE',
    'bookings:READ',
    'users:READ',
  ],
  [Role.STUDENT]: ['courses:READ', 'exams:READ'],
};

const ROLE_CATALOG = [
  {
    name: Role.ADMIN,
    description: 'Administrator with platform-wide management access',
    isSystem: true,
  },
  {
    name: Role.TEACHER,
    description: 'Teacher / instructor who creates courses and content',
    isSystem: true,
  },
  { name: Role.STUDENT, description: 'Student who enrolls in courses', isSystem: true },
];

const BOOKING_STATUSES = [
  {
    name: BookingStatusName.PENDING,
    label: 'Pending',
    color: '#F59E0B',
    description: 'Awaiting confirmation',
    sortOrder: 1,
  },
  {
    name: BookingStatusName.CONFIRMED,
    label: 'Confirmed',
    color: '#10B981',
    description: 'Booking confirmed',
    sortOrder: 2,
  },
  {
    name: BookingStatusName.COMPLETED,
    label: 'Completed',
    color: '#3B82F6',
    description: 'Session completed',
    sortOrder: 3,
  },
  {
    name: BookingStatusName.CANCELED,
    label: 'Canceled',
    color: '#EF4444',
    description: 'Booking canceled',
    sortOrder: 4,
  },
  {
    name: BookingStatusName.NO_SHOW,
    label: 'No Show',
    color: '#8B5CF6',
    description: 'Student did not attend',
    sortOrder: 5,
  },
  {
    name: BookingStatusName.RESCHEDULED,
    label: 'Rescheduled',
    color: '#06B6D4',
    description: 'Booking rescheduled',
    sortOrder: 6,
  },
];

const NOTIFICATION_TEMPLATES = [
  {
    name: 'welcome_email',
    type: NotificationType.EMAIL,
    subject: 'Welcome to Global Math 🎓',
    body: 'Hi {{firstName}}, welcome to the platform! We are excited to have you on board.',
    variables: { firstName: 'string' },
  },
  {
    name: 'password_reset',
    type: NotificationType.EMAIL,
    subject: 'Reset your password',
    body: 'Click the link below to reset your password: {{resetLink}}',
    variables: { resetLink: 'string' },
  },
  {
    name: 'email_verification',
    type: NotificationType.EMAIL,
    subject: 'Verify your email',
    body: 'Verify your email using this link: {{verificationLink}}',
    variables: { verificationLink: 'string' },
  },
  {
    name: 'course_enrolled',
    type: NotificationType.EMAIL,
    subject: 'You have enrolled in {{courseName}}',
    body: 'You have successfully enrolled in {{courseName}}. Happy learning!',
    variables: { courseName: 'string' },
  },
  {
    name: 'booking_confirmed',
    type: NotificationType.EMAIL,
    subject: 'Booking confirmed',
    body: 'Your booking for {{title}} on {{startTime}} has been confirmed.',
    variables: { title: 'string', startTime: 'string' },
  },
  {
    name: 'exam_result',
    type: NotificationType.EMAIL,
    subject: 'Your exam result is ready',
    body: 'Your result for {{examName}} is available. Score: {{score}}%',
    variables: { examName: 'string', score: 'string' },
  },
];

const GENERAL_SETTINGS = [
  {
    key: 'platform_name',
    value: 'Global Math',
    description: 'Display name of the platform',
    isPublic: true,
  },
  {
    key: 'platform_url',
    value: 'https://platform.local',
    description: 'Public URL of the platform',
    isPublic: true,
  },
  {
    key: 'support_email',
    value: 'support@platform.local',
    description: 'Support email address',
    isPublic: true,
  },
  { key: 'default_locale', value: 'en', description: 'Default locale', isPublic: true },
  { key: 'default_timezone', value: 'UTC', description: 'Default timezone', isPublic: true },
  {
    key: 'maintenance_mode',
    value: false,
    description: 'Enable maintenance mode',
    isPublic: false,
  },
];

const SECURITY_SETTINGS = [
  { key: 'password_min_length', value: 8, description: 'Minimum password length' },
  { key: 'two_factor_required', value: false, description: 'Require 2FA for all users' },
  { key: 'session_timeout_minutes', value: 60, description: 'Session idle timeout' },
  { key: 'max_login_attempts', value: 5, description: 'Max failed login attempts before lock' },
  { key: 'jwt_access_expires_in', value: '15m', description: 'Access token lifetime' },
  { key: 'jwt_refresh_expires_in', value: '7d', description: 'Refresh token lifetime' },
];

const STORAGE_SETTINGS = [
  {
    key: 'default_provider',
    value: StorageProvider.LOCAL,
    description: 'Default storage provider',
  },
  { key: 'max_upload_size_mb', value: 1024, description: 'Max upload size in MB' },
  {
    key: 'allowed_mime_types',
    value: ['image/*', 'video/*', 'application/pdf', 'application/zip'],
    description: 'Allowed MIME types',
  },
];

const EMAIL_SETTINGS = [
  { key: 'smtp_host', value: '', description: 'SMTP host' },
  { key: 'smtp_port', value: 587, description: 'SMTP port' },
  { key: 'smtp_secure', value: true, description: 'Use TLS for SMTP' },
  { key: 'from_address', value: 'noreply@platform.local', description: 'Default from address' },
  { key: 'from_name', value: 'Global Math', description: 'Default from name' },
];

const ZOOM_SETTINGS = [
  { key: 'api_key', value: '', description: 'Zoom API key' },
  { key: 'api_secret', value: '', description: 'Zoom API secret' },
  { key: 'account_id', value: '', description: 'Zoom Server-to-Server account ID' },
  { key: 'default_duration_minutes', value: 60, description: 'Default meeting duration' },
];

const THEME_SETTINGS = [
  { key: 'primary_color', value: '#6366F1', description: 'Primary brand color' },
  { key: 'secondary_color', value: '#10B981', description: 'Secondary brand color' },
  { key: 'accent_color', value: '#F59E0B', description: 'Accent color' },
  { key: 'logo_url', value: '', description: 'Platform logo URL' },
  { key: 'dark_mode_enabled', value: true, description: 'Enable dark mode' },
];

const CATEGORIES = [
  {
    name: 'Programming',
    slug: 'programming',
    description: 'Learn to code in popular languages',
    icon: 'code',
    color: '#3B82F6',
  },
  {
    name: 'Mathematics',
    slug: 'mathematics',
    description: 'Algebra, calculus, statistics and more',
    icon: 'calculator',
    color: '#10B981',
  },
  {
    name: 'Science',
    slug: 'science',
    description: 'Physics, chemistry, biology',
    icon: 'flask',
    color: '#8B5CF6',
  },
  {
    name: 'Languages',
    slug: 'languages',
    description: 'Learn a new language',
    icon: 'globe',
    color: '#F59E0B',
  },
  {
    name: 'Business',
    slug: 'business',
    description: 'Entrepreneurship, marketing, finance',
    icon: 'briefcase',
    color: '#EF4444',
  },
  {
    name: 'Arts & Design',
    slug: 'arts-design',
    description: 'Creative skills and design',
    icon: 'palette',
    color: '#EC4899',
  },
];

const SUB_CATEGORIES = [
  { name: 'JavaScript', slug: 'javascript', category: 'programming' },
  { name: 'Python', slug: 'python', category: 'programming' },
  { name: 'Data Structures', slug: 'data-structures', category: 'programming' },
  { name: 'Algebra', slug: 'algebra', category: 'mathematics' },
  { name: 'Calculus', slug: 'calculus', category: 'mathematics' },
  { name: 'Physics', slug: 'physics', category: 'science' },
  { name: 'English', slug: 'english', category: 'languages' },
  { name: 'Marketing', slug: 'marketing', category: 'business' },
];

const CLOUD_STORAGE = [
  { provider: StorageProvider.LOCAL, isActive: true, config: { basePath: '/uploads' } },
  { provider: StorageProvider.S3, isActive: false, config: {} },
  { provider: StorageProvider.GCS, isActive: false, config: {} },
  { provider: StorageProvider.AZURE, isActive: false, config: {} },
  { provider: StorageProvider.R2, isActive: false, config: {} },
  { provider: StorageProvider.DIGITALOCEAN, isActive: false, config: {} },
];

const CERTIFICATE_TEMPLATES = [
  {
    name: 'Course Completion',
    description: 'Standard course completion certificate',
    layout: 'A4_LANDSCAPE',
    designJson: {
      title: 'Certificate of Completion',
      fields: ['studentName', 'courseName', 'date', 'instructor'],
    },
    isActive: true,
  },
  {
    name: 'Excellence Award',
    description: 'Awarded for outstanding academic performance',
    layout: 'A4_PORTRAIT',
    designJson: {
      title: 'Certificate of Excellence',
      fields: ['studentName', 'courseName', 'score', 'date'],
    },
    isActive: true,
  },
];

// ─── Main seed ───────────────────────────────────────────────────────────────

async function seedRoles() {
  for (const role of ROLE_CATALOG) {
    await prisma.roles.upsert({
      where: { name: role.name },
      update: { description: role.description, isSystem: role.isSystem },
      create: role,
    });
  }
  console.log(`✓ Seeded ${ROLE_CATALOG.length} roles`);
}

async function seedPermissions() {
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { resource_action: { resource: perm.resource, action: perm.action } },
      update: { description: perm.description },
      create: perm,
    });
  }

  const allPermissions = await prisma.permission.findMany();

  for (const [role, permKeys] of Object.entries(ROLE_PERMISSIONS)) {
    for (const key of permKeys) {
      const [resource, action] = key.split(':') as [string, PermissionAction];
      const permission = allPermissions.find((p) => p.resource === resource && p.action === action);
      if (permission) {
        await prisma.rolePermission.upsert({
          where: { role_permissionId: { role: role as Role, permissionId: permission.id } },
          update: {},
          create: { role: role as Role, permissionId: permission.id },
        });
      }
    }
  }
  console.log(`✓ Seeded ${PERMISSIONS.length} permissions + role mappings`);
}

async function seedBookingStatuses() {
  for (const status of BOOKING_STATUSES) {
    await prisma.bookingStatus.upsert({
      where: { name: status.name },
      update: {
        label: status.label,
        color: status.color,
        description: status.description,
        sortOrder: status.sortOrder,
      },
      create: status,
    });
  }
  console.log(`✓ Seeded ${BOOKING_STATUSES.length} booking statuses`);
}

async function seedNotificationTemplates() {
  for (const template of NOTIFICATION_TEMPLATES) {
    await prisma.notificationTemplate.upsert({
      where: { name: template.name },
      update: {
        subject: template.subject,
        body: template.body,
        variables: template.variables,
        type: template.type,
      },
      create: template,
    });
  }
  console.log(`✓ Seeded ${NOTIFICATION_TEMPLATES.length} notification templates`);
}

async function seedSettings() {
  type SettingsItem = {
    key: string;
    value: Prisma.InputJsonValue;
    description?: string;
  };

  const upsertMany = async (
    model: {
      upsert: (args: {
        where: { key: string };
        update: { value: Prisma.InputJsonValue; description?: string };
        create: { key: string; value: Prisma.InputJsonValue; description?: string };
      }) => Promise<unknown>;
    },
    items: SettingsItem[],
  ) => {
    for (const item of items) {
      await model.upsert({
        where: { key: item.key },
        update: { value: item.value, description: item.description },
        create: item,
      });
    }
  };

  await upsertMany(prisma.generalSettings, GENERAL_SETTINGS);
  await upsertMany(prisma.securitySettings, SECURITY_SETTINGS);
  await upsertMany(prisma.storageSettings, STORAGE_SETTINGS);
  await upsertMany(prisma.emailSettings, EMAIL_SETTINGS);
  await upsertMany(prisma.zoomSettings, ZOOM_SETTINGS);
  await upsertMany(prisma.themeSettings, THEME_SETTINGS);
  console.log('✓ Seeded settings (general, security, storage, email, zoom, theme)');
}

async function seedCategories() {
  const created = await Promise.all(
    CATEGORIES.map((c) =>
      prisma.category.upsert({
        where: { slug: c.slug },
        update: { name: c.name, description: c.description, icon: c.icon, color: c.color },
        create: c,
      }),
    ),
  );

  const categoryBySlug = new Map(created.map((c) => [c.slug, c.id]));

  for (const sub of SUB_CATEGORIES) {
    const categoryId = categoryBySlug.get(sub.category);
    if (categoryId) {
      await prisma.subCategory.upsert({
        where: { slug: sub.slug },
        update: { name: sub.name, categoryId },
        create: { name: sub.name, slug: sub.slug, categoryId },
      });
    }
  }
  console.log(`✓ Seeded ${CATEGORIES.length} categories + ${SUB_CATEGORIES.length} subcategories`);
}

async function seedCloudStorage() {
  for (const storage of CLOUD_STORAGE) {
    await prisma.cloudStorage.upsert({
      where: { provider: storage.provider },
      update: { isActive: storage.isActive, config: storage.config },
      create: storage,
    });
  }
  console.log(`✓ Seeded ${CLOUD_STORAGE.length} cloud storage configs`);
}

async function seedCertificateTemplates() {
  for (const template of CERTIFICATE_TEMPLATES) {
    await prisma.certificateTemplate.upsert({
      where: { name: template.name },
      update: {
        description: template.description,
        layout: template.layout,
        designJson: template.designJson,
        isActive: template.isActive,
      },
      create: template,
    });
  }
  console.log(`✓ Seeded ${CERTIFICATE_TEMPLATES.length} certificate templates`);
}

async function seedUsers() {
  const passwordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123', 12);
  const passwordHashUser = await bcrypt.hash(
    process.env.SEED_USER_PASSWORD ?? 'Password@123',
    12,
  );

  // Development Admin (seeded for local/dev only).
  const admin = await prisma.user.upsert({
    where: { email: 'admin@platform.local' },
    update: {},
    create: {
      email: 'admin@platform.local',
      passwordHash,
      role: Role.ADMIN,
      emailVerified: new Date(),
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          firstName: 'Platform',
          lastName: 'Admin',
          displayName: 'Platform Admin',
          headline: 'Platform Administrator',
        },
      },
      admin: {
        create: { department: 'Platform Operations' },
      },
    },
  });

  // Development Teacher (seeded for local/dev only).
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@platform.local' },
    update: {},
    create: {
      email: 'teacher@platform.local',
      passwordHash: passwordHashUser,
      role: Role.TEACHER,
      emailVerified: new Date(),
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          firstName: 'Jane',
          lastName: 'Doe',
          displayName: 'Jane Doe',
          headline: 'Senior Software Engineering Instructor',
          bio: 'Passionate about teaching programming for 10+ years.',
        },
      },
      teacher: {
        create: {
          title: 'Senior Instructor',
          department: 'Computer Science',
          isVerified: true,
          rating: 4.8,
          ratingCount: 156,
          expertise: ['JavaScript', 'TypeScript', 'Node.js', 'System Design'],
        },
      },
    },
  });

  // Development Student (seeded for local/dev only).
  const student = await prisma.user.upsert({
    where: { email: 'student@platform.local' },
    update: {},
    create: {
      email: 'student@platform.local',
      passwordHash: passwordHashUser,
      role: Role.STUDENT,
      emailVerified: new Date(),
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          firstName: 'John',
          lastName: 'Smith',
          displayName: 'John Smith',
          headline: 'CS Student',
          bio: 'Learning full-stack development.',
        },
      },
      student: {
        create: {
          studentNumber: 'STU-2024-0001',
          grade: 'Undergraduate',
          school: 'Platform University',
          major: 'Computer Science',
          enrollmentDate: new Date(),
        },
      },
    },
  });

  // Create linked OAuth account sample (Google) for the admin.
  await prisma.account.upsert({
    where: {
      provider_providerAccountId: {
        provider: AccountProvider.GOOGLE,
        providerAccountId: 'google-oauth-admin',
      },
    },
    update: {},
    create: {
      userId: admin.id,
      provider: AccountProvider.GOOGLE,
      providerAccountId: 'google-oauth-admin',
      providerUserId: admin.id,
      tokenType: 'Bearer',
      scope: 'openid profile email',
    },
  });

  console.log(`✓ Seeded users: ${admin.email}, ${teacher.email}, ${student.email}`);
}

async function seedCourseContent() {
  const teacherUser = await prisma.user.findUnique({
    where: { email: 'teacher@platform.local' },
    include: { teacher: true },
  });
  const studentUser = await prisma.user.findUnique({
    where: { email: 'student@platform.local' },
    include: { student: true },
  });

  if (!teacherUser?.teacher || !studentUser?.student) {
    console.warn('⚠ Skipping course content seed — teacher/student profiles missing');
    return;
  }

  const category = await prisma.category.findUnique({ where: { slug: 'programming' } });
  const subCategory = await prisma.subCategory.findUnique({ where: { slug: 'javascript' } });

  const course = await prisma.course.upsert({
    where: { slug: 'complete-typescript-masterclass' },
    update: {},
    create: {
      title: 'Complete TypeScript Masterclass',
      slug: 'complete-typescript-masterclass',
      subtitle: 'From zero to production-ready TypeScript',
      description:
        'A comprehensive course covering TypeScript fundamentals, advanced types, and real-world patterns.',
      shortDescription: 'Master TypeScript with hands-on lessons and real-world projects.',
      categoryId: category?.id,
      subCategoryId: subCategory?.id,
      language: 'en',
      level: 'INTERMEDIATE',
      durationMinutes: 480,
      price: 49.99,
      currency: 'USD',
      status: 'PUBLISHED',
      visibility: 'PUBLIC',
      isPublished: true,
      isFeatured: true,
      publishedAt: new Date(),
      createdBy: teacherUser.id,
      tags: ['typescript', 'javascript', 'programming'],
      learningOutcomes: {
        items: ['Write type-safe code', 'Use advanced generics', 'Build production-grade apps'],
      },
      teachers: {
        create: {
          teacherId: teacherUser.teacher.id,
          role: 'OWNER',
          isPrimary: true,
        },
      },
    },
    include: { teachers: true },
  });

  // Chapters
  const chaptersData = [
    {
      title: 'Getting Started',
      slug: 'getting-started',
      description: 'Introduction to TypeScript and tooling',
      summary: 'Set up your first TypeScript project',
      icon: 'rocket',
      chapterNumber: 1,
      sortOrder: 0,
      estimatedDuration: 90,
      status: ChapterStatus.PUBLISHED,
      visibility: ChapterVisibility.PUBLIC,
      isPreview: true,
      isLocked: false,
      publishedAt: new Date(),
    },
    {
      title: 'Type System Fundamentals',
      slug: 'type-system-fundamentals',
      description: 'Core types, interfaces and utilities',
      summary: 'Understand annotations, inference and structural typing',
      icon: 'layers',
      chapterNumber: 2,
      sortOrder: 1,
      estimatedDuration: 150,
      status: ChapterStatus.PUBLISHED,
      visibility: ChapterVisibility.PUBLIC,
      isPreview: false,
      isLocked: false,
      publishedAt: new Date(),
    },
    {
      title: 'Advanced Patterns',
      slug: 'advanced-patterns',
      description: 'Generics, decorators, and domain modeling',
      summary: 'Master advanced TypeScript patterns',
      icon: 'sparkles',
      chapterNumber: 3,
      sortOrder: 2,
      estimatedDuration: 240,
      status: ChapterStatus.DRAFT,
      visibility: ChapterVisibility.PRIVATE,
      isPreview: false,
      isLocked: true,
    },
  ].map((c, i) => ({ ...c, slug: `${course.slug}-${c.slug}-${i}` }));

  const chapters: { id: string; title: string; slug: string }[] = [];
  for (const ch of chaptersData) {
    const created = await prisma.courseChapter.upsert({
      where: { courseId_slug: { courseId: course.id, slug: ch.slug } },
      update: {},
      create: { courseId: course.id, ...ch },
    });
    chapters.push(created);
  }

  // Lessons per chapter
  const lessonsData: {
    chapterIndex: number;
    title: string;
    slug: string;
    type: LessonType;
    durationMinutes: number;
    status: LessonStatus;
    visibility: LessonVisibility;
    isPreview: boolean;
    isLocked: boolean;
    content?: Prisma.InputJsonValue;
  }[] = [
    {
      chapterIndex: 0,
      title: 'What is TypeScript?',
      slug: 'what-is-typescript',
      type: LessonType.VIDEO,
      durationMinutes: 12,
      status: LessonStatus.PUBLISHED,
      visibility: LessonVisibility.PUBLIC,
      isPreview: true,
      isLocked: false,
    },
    {
      chapterIndex: 0,
      title: 'Setting up your environment',
      slug: 'setting-up-environment',
      type: LessonType.TEXT,
      durationMinutes: 20,
      status: LessonStatus.PUBLISHED,
      visibility: LessonVisibility.PUBLIC,
      isPreview: true,
      isLocked: false,
      content: {
        markdown:
          'Install Node.js, VS Code and the TypeScript compiler using `npm i -g typescript`.',
      },
    },
    {
      chapterIndex: 0,
      title: 'Course resources and files',
      slug: 'course-resources',
      type: LessonType.PDF,
      durationMinutes: 5,
      status: LessonStatus.PUBLISHED,
      visibility: LessonVisibility.PUBLIC,
      isPreview: true,
      isLocked: false,
    },
    {
      chapterIndex: 1,
      title: 'Primitives and inference',
      slug: 'primitives-inference',
      type: LessonType.VIDEO,
      durationMinutes: 18,
      status: LessonStatus.PUBLISHED,
      visibility: LessonVisibility.PUBLIC,
      isPreview: false,
      isLocked: false,
    },
    {
      chapterIndex: 1,
      title: 'Intersection & union types',
      slug: 'intersection-union-types',
      type: LessonType.VIDEO,
      durationMinutes: 22,
      status: LessonStatus.PUBLISHED,
      visibility: LessonVisibility.PUBLIC,
      isPreview: false,
      isLocked: false,
    },
    {
      chapterIndex: 1,
      title: 'TypeScript quiz: fundamentals',
      slug: 'typescript-quiz-fundamentals',
      type: LessonType.QUIZ,
      durationMinutes: 15,
      status: LessonStatus.PUBLISHED,
      visibility: LessonVisibility.PUBLIC,
      isPreview: false,
      isLocked: false,
      content: { questions: 10, passScore: 70 },
    },
    {
      chapterIndex: 1,
      title: 'Assignment: model a shopping cart',
      slug: 'assignment-shopping-cart',
      type: LessonType.ASSIGNMENT,
      durationMinutes: 45,
      status: LessonStatus.PUBLISHED,
      visibility: LessonVisibility.PUBLIC,
      isPreview: false,
      isLocked: false,
      content: { instructions: 'Create a type-safe shopping cart using interfaces and generics.' },
    },
    {
      chapterIndex: 2,
      title: 'Generic constraints',
      slug: 'generic-constraints',
      type: LessonType.VIDEO,
      durationMinutes: 25,
      status: LessonStatus.DRAFT,
      visibility: LessonVisibility.PRIVATE,
      isPreview: false,
      isLocked: true,
    },
    {
      chapterIndex: 2,
      title: 'Decorators and metadata',
      slug: 'decorators-metadata',
      type: LessonType.VIDEO,
      durationMinutes: 28,
      status: LessonStatus.DRAFT,
      visibility: LessonVisibility.PRIVATE,
      isPreview: false,
      isLocked: true,
    },
  ];

  const lessons: { id: string; chapterId: string; title: string }[] = [];
  for (const [idx, l] of lessonsData.entries()) {
    const chapter = chapters[l.chapterIndex];
    const uniqueSlug = `${chapter.slug}-${l.slug}-${idx}`;
    const created = await prisma.lesson.upsert({
      where: { chapterId_slug: { chapterId: chapter.id, slug: uniqueSlug } },
      update: {},
      create: {
        chapterId: chapter.id,
        courseId: course.id,
        title: l.title,
        slug: uniqueSlug,
        type: l.type,
        lessonNumber: idx + 1,
        orderIndex: idx,
        durationMinutes: l.durationMinutes,
        status: l.status,
        visibility: l.visibility,
        isPreview: l.isPreview,
        isLocked: l.isLocked,
        isPublished: l.status === LessonStatus.PUBLISHED,
        publishedAt: l.status === LessonStatus.PUBLISHED ? new Date() : null,
        content: l.content,
      },
    });
    lessons.push(created);
  }

  // Videos for the VIDEO lessons
  const videoLessons = lessons.filter((_, i) => lessonsData[i]?.type === LessonType.VIDEO);
  const sampleVideos = [
    {
      title: 'Intro to TypeScript',
      url: 'https://www.youtube.com/watch?v=d56mG7DezGs',
      source: VideoSource.YOUTUBE,
      durationSeconds: 720,
    },
    {
      title: 'Understanding Inference',
      url: 'https://www.youtube.com/watch?v=gp5H0Vw39yw',
      source: VideoSource.YOUTUBE,
      durationSeconds: 1080,
    },
    {
      title: 'Union & Intersection Deep Dive',
      url: 'https://www.youtube.com/watch?v=erEH4lS4yFQ',
      source: VideoSource.YOUTUBE,
      durationSeconds: 1320,
    },
    {
      title: 'Mastering Generics',
      url: 'https://www.youtube.com/watch?v=IOyW5QgJ6H8',
      source: VideoSource.YOUTUBE,
      durationSeconds: 1500,
    },
    {
      title: 'Decorators in Practice',
      url: 'https://www.youtube.com/watch?v=O6A-u_FoEX8',
      source: VideoSource.YOUTUBE,
      durationSeconds: 1680,
    },
  ];

  for (const [i, lesson] of videoLessons.entries()) {
    const video = sampleVideos[i % sampleVideos.length];
    await prisma.lessonVideo.upsert({
      where: {
        id: `seed-video-${lesson.id}`,
      },
      update: {},
      create: {
        id: `seed-video-${lesson.id}`,
        lessonId: lesson.id,
        title: video.title,
        url: video.url,
        source: video.source,
        durationSeconds: video.durationSeconds,
        resolution: '1920x1080',
        quality: 'HD',
        captions: { available: false },
        isPreview: lessonsData[i]?.isPreview ?? false,
        hasWatermark: false,
      },
    });
  }

  // PDF attachment for PDF lesson
  const pdfLesson = lessons.find((_, i) => lessonsData[i]?.type === LessonType.PDF);
  if (pdfLesson) {
    await prisma.lessonPDF.upsert({
      where: { id: `seed-pdf-${pdfLesson.id}` },
      update: {},
      create: {
        id: `seed-pdf-${pdfLesson.id}`,
        lessonId: pdfLesson.id,
        title: 'Course Syllabus PDF',
        url: 'https://example.com/syllabus.pdf',
        pageCount: 24,
        sizeBytes: BigInt(2_458_600),
        isPreview: true,
      },
    });
  }

  // Course-level resources
  const resourcesData: {
    title: string;
    type: string;
    category: ResourceCategoryType;
    url?: string;
    fileName?: string;
    mimeType?: string;
  }[] = [
    {
      title: 'TypeScript Handbook',
      type: 'LINK',
      category: ResourceCategoryType.LINK,
      url: 'https://www.typescriptlang.org/docs/handbook/intro.html',
    },
    {
      title: 'Project Starter ZIP',
      type: 'FILE',
      category: ResourceCategoryType.ARCHIVE,
      fileName: 'typescript-starter.zip',
      mimeType: 'application/zip',
    },
    {
      title: 'Cheat Sheet PDF',
      type: 'FILE',
      category: ResourceCategoryType.DOCUMENT,
      fileName: 'typescript-cheatsheet.pdf',
      mimeType: 'application/pdf',
    },
  ];

  for (const [i, r] of resourcesData.entries()) {
    await prisma.courseResource.upsert({
      where: { id: `seed-resource-${i}-${course.id}` },
      update: {},
      create: {
        id: `seed-resource-${i}-${course.id}`,
        courseId: course.id,
        title: r.title,
        type: r.type,
        category: r.category,
        url: r.url,
        fileUrl: r.fileName ? `https://example.com/uploads/${r.fileName}` : undefined,
        fileName: r.fileName,
        mimeType: r.mimeType,
        isExternal: Boolean(r.url),
        isPublished: true,
        sortOrder: i,
        createdBy: teacherUser.id,
      },
    });
  }

  // Enrollment + progress for the demo student
  const enrollment = await prisma.courseStudent.upsert({
    where: { courseId_studentId: { courseId: course.id, studentId: studentUser.student.id } },
    update: {},
    create: {
      courseId: course.id,
      studentId: studentUser.student.id,
      enrolledAt: new Date(),
      status: EnrollmentStatus.ACTIVE,
      isFavorite: true,
      progress: 33.33,
      lastAccessedAt: new Date(),
      certificateEligible: false,
    },
  });

  // Lesson progress for published video/text/pdf lessons in chapter 1
  const progressibleLessons = lessons.filter(
    (_, i) => i < 5 && lessonsData[i]?.status === LessonStatus.PUBLISHED,
  );
  for (const l of progressibleLessons.slice(0, 2)) {
    await prisma.lessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId: l.id } },
      update: {},
      create: {
        enrollmentId: enrollment.id,
        lessonId: l.id,
        studentId: studentUser.student.id,
        courseId: course.id,
        status: ProgressStatus.COMPLETED,
        isCompleted: true,
        completedAt: new Date(),
        watchedSeconds: 600,
        lastPositionMs: 0,
        attemptsCount: 1,
      },
    });
  }

  // Chapter progress for chapter 1
  if (chapters[0]) {
    await prisma.chapterProgress.upsert({
      where: { enrollmentId_chapterId: { enrollmentId: enrollment.id, chapterId: chapters[0].id } },
      update: {},
      create: {
        enrollmentId: enrollment.id,
        chapterId: chapters[0].id,
        studentId: studentUser.student.id,
        courseId: course.id,
        status: ProgressStatus.IN_PROGRESS,
        isCompleted: false,
        lessonsCompleted: 2,
        totalLessons: 3,
        percentComplete: 66.67,
      },
    });
  }

  // Enrollment activity
  await prisma.enrollmentActivity.createMany({
    data: [
      {
        enrollmentId: enrollment.id,
        studentId: studentUser.student.id,
        courseId: course.id,
        activityType: 'COURSE_STARTED',
        metadata: { at: new Date().toISOString() },
      },
      {
        enrollmentId: enrollment.id,
        studentId: studentUser.student.id,
        courseId: course.id,
        activityType: 'LESSON_COMPLETED',
        metadata: { lessonCount: 2 },
      },
    ],
    skipDuplicates: true,
  });

  console.log(
    `✓ Seeded course content: ${course.title} (${chapters.length} chapters, ${lessons.length} lessons) + enrollments/progress`,
  );
}

async function main() {
  console.log('🌱 Seeding Enterprise LMS database...');

  await seedRoles();
  await seedPermissions();
  await seedBookingStatuses();
  await seedNotificationTemplates();
  await seedSettings();
  await seedCategories();
  await seedCloudStorage();
  await seedCertificateTemplates();
  await seedUsers();
  await seedCourseContent();

  console.log('✅ Database seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
