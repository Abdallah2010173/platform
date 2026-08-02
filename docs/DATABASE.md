# Database Documentation — Enterprise LMS Platform

> **Feature 02 · Database Architecture**
> PostgreSQL 16 · Prisma ORM 6 · UUID primary keys · Soft delete · Normalized

---

## Table of Contents

1. [Conventions & Design Rules](#1-conventions--design-rules)
2. [Domain Overview](#2-domain-overview)
3. [Models Reference](#3-models-reference)
4. [Enums Reference](#4-enums-reference)
5. [Index Strategy](#5-index-strategy)
6. [Cascade Rules](#6-cascade-rules)
7. [Migration & Workflow](#7-migration--workflow)
8. [Seed Data](#8-seed-data)
9. [Operations & Scaling](#9-operations--scaling)

---

## 1. Conventions & Design Rules

| Rule          | Convention                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------- |
| Primary key   | `id String @id @default(uuid())` on **every** table                                                                 |
| Timestamps    | `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`, `deletedAt DateTime?` on **every** table     |
| Soft delete   | `deletedAt` set on logical delete; never hard-delete business rows                                                  |
| Table naming  | `@@map("snake_case")` — plural, lowercase                                                                           |
| Enum naming   | PascalCase; stored as native PostgreSQL `ENUM` types                                                                |
| Foreign keys  | `onDelete: Cascade` for ownership chains, `SetNull` for audit/actor refs, `Restrict` for financial & system lookups |
| Money         | `Decimal @db.Decimal(12, 2)` / `(10, 2)` — never `float`                                                            |
| Flexible data | `Json` for dynamic payloads (options, metadata, report data, settings)                                              |
| Tags / labels | `String[]` PostgreSQL arrays for simple lists                                                                       |
| Lookup tables | Normalized status tables (e.g. `BookingStatus`, `Roles`) where behaviour varies                                     |
| Naming        | Model relation fields camelCase; DB columns camelCase in quoted Postgres identifiers                                |

---

## 2. Domain Overview

| #   | Domain         | Models                                                                                                                                                                                                                          | Table prefix                                                                                              |
| --- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 1   | Users & RBAC   | `User`, `Roles`, `Permission`, `RolePermission`, `UserProfile`, `Teacher`, `Student`, `Admin`, `Moderator`                                                                                                                      | `users`, `roles`, `permissions`, `user_profiles`, `teachers`, ...                                         |
| 2   | Authentication | `Account`, `Session`, `RefreshToken`, `EmailVerificationToken`, `PasswordResetToken`, `Device`, `LoginHistory`                                                                                                                  | `accounts`, `sessions`, `refresh_tokens`, `devices`, `login_history`                                      |
| 3   | Courses        | `Category`, `SubCategory`, `Subject`, `Course`, `CourseMedia`, `CourseReview`, `CourseAnalytics`, `CourseTeacher`, `CourseStudent`, `CourseChapter`, `Lesson`, `LessonVideo`, `LessonPDF`, `LessonAttachment`, `LessonResource` | `categories`, `subjects`, `courses`, `course_media`, `course_reviews`, `course_analytics`, `lessons`, ... |
| 4   | Live Classes   | `ZoomMeeting`, `MeetingSchedule`, `MeetingAttendance`, `MeetingRecording`, `MeetingFeedback`                                                                                                                                    | `zoom_meetings`, `meeting_schedules`, ...                                                                 |
| 5   | Booking        | `TeacherAvailability`, `Booking`, `BookingStatus`, `BookingHistory`, `Reschedule`                                                                                                                                               | `teacher_availability`, `bookings`, ...                                                                   |
| 6   | Calendar       | `Event`, `Schedule`, `TeacherSchedule`, `StudentSchedule`                                                                                                                                                                       | `events`, `schedules`, ...                                                                                |
| 7   | Exams          | `Exam`, `ExamSection`, `Question`, `QuestionChoice`, `StudentAnswer`, `ExamAttempt`, `ExamResult`, `QuestionBank`, `ExamStatistics`                                                                                             | `exams`, `questions`, `exam_attempts`, ...                                                                |
| 8   | Homework       | `Assignment`, `AssignmentFile`, `AssignmentSubmission`, `SubmissionGrade`, `SubmissionFeedback`                                                                                                                                 | `assignments`, `assignment_submissions`, ...                                                              |
| 9   | Files          | `Upload`, `Image`, `Video`, `Document`, `CloudStorage`                                                                                                                                                                          | `uploads`, `images`, `videos`, `documents`, `cloud_storage`                                               |
| 10  | Chat           | `Chat`, `ConversationMember`, `Message`, `MessageAttachment`                                                                                                                                                                    | `chats`, `conversation_members`, `messages`, ...                                                          |
| 11  | Notifications  | `Notification`, `NotificationTemplate`, `EmailNotification`, `PushNotification`, `SMSNotification`                                                                                                                              | `notifications`, `notification_templates`, ...                                                            |
| 12  | Certificates   | `Certificate`, `CertificateTemplate`, `CertificateDownload`                                                                                                                                                                     | `certificates`, `certificate_templates`, ...                                                              |
| 13  | Payments       | `Payment`, `Invoice`, `Subscription`, `Coupon`, `DiscountCode`                                                                                                                                                                  | `payments`, `invoices`, `subscriptions`, `coupons`, ...                                                   |
| 14  | Reports        | `StudentReport`, `TeacherReport`, `AttendanceReport`, `RevenueReport`                                                                                                                                                           | `student_reports`, `teacher_reports`, ...                                                                 |
| 15  | Feedback       | `LessonFeedback`, `TeacherRating`, `CourseRating`, `PlatformFeedback`                                                                                                                                                           | `lesson_feedback`, `teacher_ratings`, ...                                                                 |
| 16  | Audit          | `AuditLog`, `ActivityLog`, `SystemLog`, `ErrorLog`                                                                                                                                                                              | `audit_logs`, `activity_logs`, `system_logs`, `error_logs`                                                |
| 17  | Settings       | `GeneralSettings`, `SecuritySettings`, `StorageSettings`, `EmailSettings`, `ZoomSettings`, `ThemeSettings`                                                                                                                      | `general_settings`, `security_settings`, ...                                                              |

---

## 3. Models Reference

### 3.1 Users & RBAC

#### `User` → `users`

Core identity. Contains auth state; profile and role-specific data in child tables.

| Field                                   | Type              | Notes                        |
| --------------------------------------- | ----------------- | ---------------------------- |
| `id`                                    | UUID PK           |                              |
| `email`                                 | String UK         | Unique login                 |
| `passwordHash`                          | String?           | Null for OAuth-only accounts |
| `role`                                  | `Role` enum       | Default `STUDENT`            |
| `emailVerified` / `emailVerifiedAt`     | DateTime?         |                              |
| `twoFactorEnabled` / `twoFactorSecret`  | Boolean / String? |                              |
| `isActive`                              | Boolean           | Default true                 |
| `lastLoginAt`                           | DateTime?         |                              |
| `createdAt` / `updatedAt` / `deletedAt` | DateTime          | soft                         |

Relations: `profile`, `teacher`, `student`, `admin`, `moderator`, `accounts`, `sessions`, `refreshTokens`, `devices`, `loginHistory`, `auditLogs`, `activityLogs`, `uploads`, `payments`, `invoices`, `subscriptions`, `messages`, `chats`, `conversationMembers`, `notifications`, `certificateDownloads`, `errorLogs`, etc.

#### `Roles` → `roles`

Catalog/lookup table seeded from the `Role` enum. Used for role management UI and future dynamic role definitions. `name` unique.

#### `Permission` → `permissions`

RBAC definitions: unique `(resource, action)`.

#### `RolePermission` → `role_permissions`

Mapping role → permission. Unique `(role, permissionId)`. Cascade delete from permission.

#### `UserProfile` → `user_profiles`

1:1 with `User`. Extends core `Profile` with address, date of birth, headline. Relation field on `User` remains `profile` for API compatibility.

#### `Teacher` → `teachers`

1:1 with `User`. Teaching profile: `employeeId`, `department`, `expertise String[]`, `qualifications Json`, `hourlyRate`, `rating`, `totalStudents`, `isVerified`.

#### `Student` → `students`

1:1 with `User`. Academic profile: `studentNumber`, `grade`, `school`, `major`, `enrollmentDate`.

#### `Admin` → `admins`

1:1 with `User`. `department`, `permissions String[]`, `isSuper`.

#### `Moderator` → `moderators`

1:1 with `User`. `section`, `permissions String[]`.

### 3.2 Authentication

| Model                    | Table                       | Purpose                          | Key fields                                                                     |
| ------------------------ | --------------------------- | -------------------------------- | ------------------------------------------------------------------------------ |
| `Account`                | `accounts`                  | OAuth / linked provider accounts | `provider` (enum), `providerAccountId`, unique `(provider, providerAccountId)` |
| `Session`                | `sessions`                  | Login sessions with device       | `token UK`, `expiresAt`, `status`, `deviceId` FK                               |
| `RefreshToken`           | `refresh_tokens`            | JWT refresh rotation w/ family   | `token UK`, `family`, `revokedAt`, `replacedByTokenId`                         |
| `EmailVerificationToken` | `email_verification_tokens` | Verify email                     | `token UK`, `expiresAt`, `usedAt`                                              |
| `PasswordResetToken`     | `password_reset_tokens`     | Reset password                   | `token UK`, `expiresAt`, `usedAt`                                              |
| `Device`                 | `devices`                   | Registered devices               | `deviceType`, `pushToken`, `isTrusted`                                         |
| `LoginHistory`           | `login_history`             | Login audit trail                | `method`, `status`, `ipAddress`, `failureReason`                               |

### 3.3 Courses

| Model              | Table                | Purpose                         | Key relations                                                                         |
| ------------------ | -------------------- | ------------------------------- | ------------------------------------------------------------------------------------- |
| `Category`         | `categories`         | Course taxonomy root            | → `subCategories`, `subjects`, `courses`                                              |
| `SubCategory`      | `sub_categories`     | Category child                  | → `category`, `subjects`                                                              |
| `Subject`          | `subjects`           | Subject within a category       | unique `code`, `slug`; → `category`, `subCategory`, `courses`                         |
| `Course`           | `courses`            | Core course entity              | → `category`, `subCategory`, `subject`, `creator`, `chapters`, `teachers`, `students` |
| `CourseMedia`      | `course_media`       | Course media assets             | → `course`; `type` (thumbnail/cover/video/gallery)                                    |
| `CourseReview`     | `course_reviews`     | Moderated course reviews        | unique `(courseId, userId)`; `status` workflow; → `course`, `user`                    |
| `CourseAnalytics`  | `course_analytics`   | Rolled-up course metrics (1:1)  | unique `courseId`; enrollments, revenue, views, watch time                            |
| `CourseTeacher`    | `course_teachers`    | M2M course↔teacher              | unique `(courseId, teacherId)`, `isPrimary`                                           |
| `CourseStudent`    | `course_students`    | M2M course↔student (enrollment) | unique `(courseId, studentId)`, `progress`, `status`                                  |
| `CourseChapter`    | `course_chapters`    | Course chapter                  | unique `(courseId, orderIndex)`                                                       |
| `Lesson`           | `lessons`            | Chapter lesson                  | unique `(chapterId, orderIndex)`, `type`                                              |
| `LessonVideo`      | `lesson_videos`      | Video lesson media              | `source`, `transcodingStatus`                                                         |
| `LessonPDF`        | `lesson_pdfs`        | PDF lesson media                | `isPreview`                                                                           |
| `LessonAttachment` | `lesson_attachments` | Generic attachment              | `mimeType`, `sizeBytes`                                                               |
| `LessonResource`   | `lesson_resources`   | External/resource links         | `isExternal`                                                                          |

### 3.4 Live Classes

| Model               | Table                | Purpose             | Key fields                                         |
| ------------------- | -------------------- | ------------------- | -------------------------------------------------- |
| `ZoomMeeting`       | `zoom_meetings`      | Zoom session        | `zoomMeetingId`, `startTime`, `joinUrl`, `status`  |
| `MeetingSchedule`   | `meeting_schedules`  | Recurring schedule  | `recurrence`, `recurrenceRule`, `status`           |
| `MeetingAttendance` | `meeting_attendance` | Student attendance  | unique `(meetingId, studentId)`, `durationSeconds` |
| `MeetingRecording`  | `meeting_recordings` | Recorded sessions   | `storageProvider`, `filePath`                      |
| `MeetingFeedback`   | `meeting_feedback`   | Feedback on meeting | unique `(meetingId, userId)`, `rating`             |

### 3.5 Booking

| Model                 | Table                  | Purpose                   | Key fields                                                |
| --------------------- | ---------------------- | ------------------------- | --------------------------------------------------------- |
| `TeacherAvailability` | `teacher_availability` | Weekly availability slots | unique `(teacherId, dayOfWeek, startTime, endTime)`       |
| `BookingStatus`       | `booking_statuses`     | Lookup statuses (seeded)  | unique `name` (enum)                                      |
| `Booking`             | `bookings`             | 1:1 booking               | `bookingNumber UK`, `statusId` FK, `startTime`, `endTime` |
| `BookingHistory`      | `booking_history`      | Status transitions        | `fromStatusId`, `toStatusId`                              |
| `Reschedule`          | `reschedules`          | Reschedule requests       | `requestedBy`, `status`, `approvedById`                   |

### 3.6 Calendar

| Model             | Table               | Purpose                            |
| ----------------- | ------------------- | ---------------------------------- |
| `Event`           | `events`            | User calendar events (type enum)   |
| `Schedule`        | `schedules`         | Master schedule with recurrence    |
| `TeacherSchedule` | `teacher_schedules` | Schedule↔teacher M2M (unique pair) |
| `StudentSchedule` | `student_schedules` | Schedule↔student M2M (unique pair) |

### 3.7 Exams

| Model            | Table              | Purpose                                              |
| ---------------- | ------------------ | ---------------------------------------------------- |
| `Exam`           | `exams`            | Exam header (type, marks, time)                      |
| `ExamSection`    | `exam_sections`    | Exam sections (unique order)                         |
| `Question`       | `questions`        | Question with `options`/`correctAnswer` Json         |
| `QuestionChoice` | `question_choices` | MCQ choices                                          |
| `StudentAnswer`  | `student_answers`  | Per-attempt answer; unique `(attemptId, questionId)` |
| `ExamAttempt`    | `exam_attempts`    | Student attempt lifecycle                            |
| `ExamResult`     | `exam_results`     | Result (1:1 attempt)                                 |
| `QuestionBank`   | `question_banks`   | Reusable question pool                               |
| `ExamStatistics` | `exam_statistics`  | Aggregated stats (1:1 exam)                          |

### 3.8 Homework

| Model                  | Table                    | Purpose                                                |
| ---------------------- | ------------------------ | ------------------------------------------------------ |
| `Assignment`           | `assignments`            | Assignment header                                      |
| `AssignmentFile`       | `assignment_files`       | Assignment files                                       |
| `AssignmentSubmission` | `assignment_submissions` | Student submission; unique `(assignmentId, studentId)` |
| `SubmissionGrade`      | `submission_grades`      | Grade (1:1 submission)                                 |
| `SubmissionFeedback`   | `submission_feedback`    | Feedback threads                                       |

### 3.9 Files

| Model          | Table           | Purpose                                    |
| -------------- | --------------- | ------------------------------------------ |
| `Upload`       | `uploads`       | Central upload record                      |
| `Image`        | `images`        | Image metadata (1:1 upload)                |
| `Video`        | `videos`        | Video metadata (1:1 upload)                |
| `Document`     | `documents`     | Document metadata (1:1 upload)             |
| `CloudStorage` | `cloud_storage` | Storage provider configs (unique provider) |

### 3.10 Chat

| Model                | Table                  | Purpose                            |
| -------------------- | ---------------------- | ---------------------------------- |
| `Chat`               | `chats`                | Conversation (direct/group)        |
| `ConversationMember` | `conversation_members` | Member; unique `(chatId, userId)`  |
| `Message`            | `messages`             | Message with replyTo self-relation |
| `MessageAttachment`  | `message_attachments`  | Attachments                        |

### 3.11 Notifications

| Model                  | Table                    | Purpose                          |
| ---------------------- | ------------------------ | -------------------------------- |
| `Notification`         | `notifications`          | In-app/aggregated notifications  |
| `NotificationTemplate` | `notification_templates` | Reusable templates (unique name) |
| `EmailNotification`    | `email_notifications`    | Email outbox                     |
| `PushNotification`     | `push_notifications`     | Push outbox                      |
| `SMSNotification`      | `sms_notifications`      | SMS outbox                       |

### 3.12 Certificates

| Model                 | Table                   | Purpose                                      |
| --------------------- | ----------------------- | -------------------------------------------- |
| `CertificateTemplate` | `certificate_templates` | Design templates (unique name)               |
| `Certificate`         | `certificates`          | Issued certificates (`certificateNumber UK`) |
| `CertificateDownload` | `certificate_downloads` | Download audit                               |

### 3.13 Payments

| Model          | Table            | Purpose                                  |
| -------------- | ---------------- | ---------------------------------------- |
| `Payment`      | `payments`       | Payment transaction (`paymentNumber UK`) |
| `Invoice`      | `invoices`       | Invoice (`invoiceNumber UK`)             |
| `Subscription` | `subscriptions`  | Plan subscription                        |
| `Coupon`       | `coupons`        | Coupon codes (unique `code`)             |
| `DiscountCode` | `discount_codes` | Per-user discount code                   |

### 3.14 Reports

| Model              | Table                | Purpose              |
| ------------------ | -------------------- | -------------------- |
| `StudentReport`    | `student_reports`    | Per-student reports  |
| `TeacherReport`    | `teacher_reports`    | Per-teacher reports  |
| `AttendanceReport` | `attendance_reports` | Attendance summaries |
| `RevenueReport`    | `revenue_reports`    | Revenue summaries    |

### 3.15 Feedback

| Model              | Table               | Purpose                      |
| ------------------ | ------------------- | ---------------------------- |
| `LessonFeedback`   | `lesson_feedback`   | unique `(lessonId, userId)`  |
| `TeacherRating`    | `teacher_ratings`   | unique `(teacherId, userId)` |
| `CourseRating`     | `course_ratings`    | unique `(courseId, userId)`  |
| `PlatformFeedback` | `platform_feedback` | General feedback             |

### 3.16 Audit

| Model         | Table           | Purpose                              |
| ------------- | --------------- | ------------------------------------ |
| `AuditLog`    | `audit_logs`    | Compliance audit trail               |
| `ActivityLog` | `activity_logs` | User activity                        |
| `SystemLog`   | `system_logs`   | System events                        |
| `ErrorLog`    | `error_logs`    | Errors with severity/status workflow |

### 3.17 Settings

All six settings tables share the same shape: `key` (unique) + `value Json` + `description`. One row per setting key, seeded in `seed.ts`.

| Model              | Table               | Example keys                                                       |
| ------------------ | ------------------- | ------------------------------------------------------------------ |
| `GeneralSettings`  | `general_settings`  | `platform_name`, `platform_url`, `maintenance_mode`                |
| `SecuritySettings` | `security_settings` | `password_min_length`, `two_factor_required`, `max_login_attempts` |
| `StorageSettings`  | `storage_settings`  | `default_provider`, `max_upload_size_mb`                           |
| `EmailSettings`    | `email_settings`    | `smtp_host`, `from_address`, `from_name`                           |
| `ZoomSettings`     | `zoom_settings`     | `api_key`, `api_secret`, `account_id`                              |
| `ThemeSettings`    | `theme_settings`    | `primary_color`, `dark_mode_enabled`, `logo_url`                   |

---

## 4. Enums Reference

| Enum                  | Values                                                                                       |
| --------------------- | -------------------------------------------------------------------------------------------- |
| `Role`                | `SUPER_ADMIN`, `ADMIN`, `TEACHER`, `STUDENT`, `MODERATOR`                                    |
| `PermissionAction`    | `CREATE`, `READ`, `UPDATE`, `DELETE`, `MANAGE`                                               |
| `AccountProvider`     | `LOCAL`, `GOOGLE`, `FACEBOOK`, `GITHUB`, `APPLE`, `MICROSOFT`                                |
| `OAuthProvider`       | `GOOGLE`, `FACEBOOK`, `GITHUB`                                                               |
| `AuditAction`         | `CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`, `EXPORT`, `IMPORT`                          |
| `SessionStatus`       | `ACTIVE`, `EXPIRED`, `REVOKED`                                                               |
| `DeviceType`          | `MOBILE`, `TABLET`, `DESKTOP`, `SMART_TV`, `OTHER`                                           |
| `LoginMethod`         | `PASSWORD`, `OTP`, `OAUTH`, `SSO`, `MAGIC_LINK`                                              |
| `LoginStatus`         | `SUCCESS`, `FAILED`, `LOCKED`, `NOT_FOUND`                                                   |
| `CourseStatus`        | `DRAFT`, `PENDING_REVIEW`, `APPROVED`, `PUBLISHED`, `ARCHIVED`, `REJECTED`                   |
| `CourseLevel`         | `BEGINNER`, `INTERMEDIATE`, `ADVANCED`, `EXPERT`, `ALL_LEVELS`                               |
| `CourseVisibility`    | `PUBLIC`, `PRIVATE`, `UNLISTED`                                                              |
| `CourseReviewStatus`  | `PENDING`, `APPROVED`, `REJECTED`, `HIDDEN`                                                  |
| `CategoryStatus`      | `ACTIVE`, `INACTIVE`, `ARCHIVED`                                                             |
| `CategoryVisibility`  | `PUBLIC`, `PRIVATE`, `HIDDEN`                                                                |
| `SubjectStatus`       | `ACTIVE`, `INACTIVE`, `ARCHIVED`                                                             |
| `LessonType`          | `VIDEO`, `PDF`, `ATTACHMENT`, `RESOURCE`, `QUIZ`, `LIVE`, `TEXT`                             |
| `VideoSource`         | `UPLOAD`, `YOUTUBE`, `VIMEO`, `ZOOM`, `EXTERNAL`, `HLS`                                      |
| `MeetingStatus`       | `SCHEDULED`, `LIVE`, `ENDED`, `CANCELED`, `RECORDING`                                        |
| `AttendanceStatus`    | `PRESENT`, `ABSENT`, `LATE`, `EXCUSED`                                                       |
| `BookingStatusName`   | `PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELED`, `NO_SHOW`, `RESCHEDULED`                    |
| `RecurrenceType`      | `NONE`, `DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`                                               |
| `ScheduleStatus`      | `ACTIVE`, `COMPLETED`, `CANCELED`                                                            |
| `EventType`           | `LESSON`, `MEETING`, `EXAM`, `ASSIGNMENT`, `REMINDER`, `PERSONAL`, `HOLIDAY`                 |
| `ExamType`            | `MCQ`, `ESSAY`, `MIXED`, `PRACTICAL`                                                         |
| `QuestionType`        | `MULTIPLE_CHOICE`, `TRUE_FALSE`, `SHORT_ANSWER`, `ESSAY`, `MATCHING`, `FILL_BLANK`           |
| `DifficultyLevel`     | `EASY`, `MEDIUM`, `HARD`, `EXPERT`                                                           |
| `AttemptStatus`       | `IN_PROGRESS`, `SUBMITTED`, `GRADED`, `EXPIRED`                                              |
| `AssignmentType`      | `HOMEWORK`, `PROJECT`, `QUIZ`, `WORKSHEET`                                                   |
| `SubmissionStatus`    | `DRAFT`, `SUBMITTED`, `GRADED`, `RETURNED`, `LATE`                                           |
| `FileKind`            | `IMAGE`, `VIDEO`, `DOCUMENT`, `AUDIO`, `ARCHIVE`, `OTHER`                                    |
| `StorageProvider`     | `LOCAL`, `S3`, `GCS`, `AZURE`, `R2`, `DIGITALOCEAN`                                          |
| `MessageType`         | `TEXT`, `IMAGE`, `VIDEO`, `AUDIO`, `FILE`, `SYSTEM`                                          |
| `MessageStatus`       | `SENT`, `DELIVERED`, `READ`                                                                  |
| `NotificationType`    | `EMAIL`, `PUSH`, `SMS`, `IN_APP`                                                             |
| `NotificationChannel` | `EMAIL`, `PUSH`, `SMS`, `IN_APP`                                                             |
| `NotificationStatus`  | `PENDING`, `SENT`, `DELIVERED`, `FAILED`, `READ`                                             |
| `PaymentMethod`       | `CARD`, `PAYPAL`, `STRIPE`, `BANK_TRANSFER`, `MOBILE_MONEY`, `CRYPTO`                        |
| `PaymentStatus`       | `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `REFUNDED`, `PARTIALLY_REFUNDED`, `CANCELED` |
| `InvoiceStatus`       | `DRAFT`, `SENT`, `PAID`, `OVERDUE`, `VOID`, `CANCELED`                                       |
| `SubscriptionStatus`  | `ACTIVE`, `PAST_DUE`, `CANCELED`, `EXPIRED`, `TRIALING`, `UNPAID`                            |
| `CouponType`          | `PERCENTAGE`, `FIXED_AMOUNT`                                                                 |
| `DiscountType`        | `PERCENTAGE`, `FIXED`                                                                        |
| `ReportType`          | `DAILY`, `WEEKLY`, `MONTHLY`, `QUARTERLY`, `YEARLY`, `CUSTOM`                                |
| `ReportFormat`        | `PDF`, `CSV`, `EXCEL`, `JSON`                                                                |
| `ReportStatus`        | `PENDING`, `GENERATING`, `COMPLETED`, `FAILED`                                               |
| `CertificateStatus`   | `ISSUED`, `REVOKED`, `EXPIRED`                                                               |
| `SystemLogLevel`      | `INFO`, `WARN`, `ERROR`, `DEBUG`, `FATAL`                                                    |
| `ErrorSeverity`       | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`                                                          |
| `ErrorStatus`         | `OPEN`, `INVESTIGATING`, `RESOLVED`, `IGNORED`                                               |

---

## 5. Index Strategy

Every table includes an index on the primary key (implicit) and commonly on `deletedAt`-relevant composite filters. Hot-path composite indexes:

| Table             | Index                                                            | Purpose                      |
| ----------------- | ---------------------------------------------------------------- | ---------------------------- |
| `users`           | `(role, isActive)`, `(email)`, `(createdAt)`                     | Auth lookups, role filtering |
| `notifications`   | `(userId, isRead, createdAt)`                                    | Inbox paging                 |
| `messages`        | `(chatId, createdAt)`                                            | Chat history paging          |
| `courses`         | `(categoryId, isPublished)`, `(status, isPublished)`, `(title)`  | Catalog browsing             |
| `course_students` | `(studentId, status)`, unique `(courseId, studentId)`            | Enrollment lookups           |
| `bookings`        | `(studentId, startTime)`, `(teacherId, startTime)`, `(statusId)` | Scheduling queries           |
| `zoom_meetings`   | `(startTime, status)`, `(courseId)`, `(teacherId)`               | Live class scheduling        |
| `events`          | `(userId, startTime)`, `(type, startTime)`                       | Calendar views               |
| `exams`           | `(courseId, isPublished)`                                        | Course exam list             |
| `exam_attempts`   | `(examId, studentId)`, `(studentId, status)`                     | Attempt history              |
| `assignments`     | `(courseId, dueDate)`, `(teacherId)`                             | Assignment feed              |
| `payments`        | `(userId, createdAt)`, `(status)`, `(providerPaymentId)`         | Billing                      |
| `audit_logs`      | `(resource, resourceId)`, `(createdAt)`, `(actorId)`             | Audit queries                |
| `login_history`   | `(userId)`, `(email)`, `(createdAt)`                             | Security analytics           |
| `sessions`        | `(userId, status)`, `(expiresAt)`, `(token)`                     | Session validation           |
| `refresh_tokens`  | `(family)`, `(expiresAt)`, `(token)`, `(userId)`                 | Rotation                     |
| `error_logs`      | `(severity, status)`, `(createdAt)`                              | Error triage                 |
| `system_logs`     | `(level, createdAt)`, `(source, createdAt)`                      | Observability                |
| `coupons`         | `(code)`, `(isActive, expiresAt)`                                | Promo validation             |
| `certificates`    | `(studentId)`, `(courseId)`, `(status)`                          | Certificate search           |

All foreign-key columns are indexed (Prisma auto-creates indexes for FKs on PostgreSQL where not part of a composite). Additional single-column indexes exist on every FK for join performance.

---

## 6. Cascade Rules

| Scenario                                                            | Rule                             |
| ------------------------------------------------------------------- | -------------------------------- |
| User → Profile / Teacher / Student / Admin / Moderator              | `Cascade`                        |
| User → Accounts / Sessions / RefreshTokens / Devices / LoginHistory | `Cascade`                        |
| Course → Chapters → Lessons → Media                                 | `Cascade`                        |
| Exam → Sections → Questions → Choices / Answers                     | `Cascade`                        |
| Assignment → Files / Submissions → Grade / Feedback                 | `Cascade`                        |
| Upload → Image / Video / Document                                   | `Cascade`                        |
| Chat → Members / Messages → Attachments                             | `Cascade`                        |
| Certificate → Downloads                                             | `Cascade`                        |
| Coupon → DiscountCodes                                              | `Cascade`                        |
| Audit/Activity/Error logs → User (actor)                            | `SetNull` (preserve log history) |
| Booking → status lookup                                             | `Restrict` (protect statuses)    |
| Payment/Invoice/Subscription → User                                 | `Restrict` (financial integrity) |
| Payment → Invoice / Subscription                                    | `SetNull`                        |
| Course → Category / SubCategory / Creator                           | `SetNull`                        |

---

## 7. Migration & Workflow

```bash
# Regenerate the client after schema changes
pnpm --filter @platform/database generate

# Create + apply a new migration
pnpm --filter @platform/database migrate:dev

# Apply migrations in production
pnpm --filter @platform/database migrate:deploy

# Push schema directly (dev only)
pnpm --filter @platform/database db:push

# Seed the database
pnpm --filter @platform/database seed

# Open Prisma Studio
pnpm --filter @platform/database studio
```

> **Important:** The Phase-1 `20260101000000_init` migration was superseded by
> `20260201000000_feature_02_database_architecture` (fresh baseline). If you have an
> existing local DB from Phase 1, drop it and re-migrate, or reset with
> `prisma migrate reset`.

---

## 8. Seed Data

`packages/database/prisma/seed.ts` seeds:

| Data                       | Details                                                                  |
| -------------------------- | ------------------------------------------------------------------------ |
| Roles catalog              | 5 system roles                                                           |
| Permissions + RBAC         | 21 permissions, role mappings                                            |
| Booking statuses           | 6 lookup statuses                                                        |
| Notification templates     | 6 email templates                                                        |
| Settings                   | General (6), Security (6), Storage (3), Email (5), Zoom (4), Theme (5)   |
| Categories / Subcategories | 6 categories, 8 subcategories                                            |
| Cloud storage providers    | 6 provider configs                                                       |
| Certificate templates      | 2 templates                                                              |
| Users                      | Super Admin, Teacher, Student, Moderator (+ linked Google OAuth account) |

### Seed accounts

| Email                      | Role          | Password         |
| -------------------------- | ------------- | ---------------- |
| `admin@platform.local`     | `SUPER_ADMIN` | `SuperAdmin@123` |
| `teacher@platform.local`   | `TEACHER`     | `Password@123`   |
| `student@platform.local`   | `STUDENT`     | `Password@123`   |
| `moderator@platform.local` | `MODERATOR`   | `Password@123`   |

---

## 9. Operations & Scaling

### PostgreSQL for millions of users

- **Partitioning candidates** (add when tables grow): `login_history`, `audit_logs`, `system_logs`, `error_logs`, `messages`, `notifications` — by range on `createdAt`.
- **Index hygiene**: drop redundant single-column indexes once composite indexes cover them; use `pg_stat_user_indexes` to monitor.
- **Soft-delete filtering**: always filter `WHERE deletedAt IS NULL`; consider partial indexes `CREATE INDEX ... WHERE deletedAt IS NULL` on hot tables.
- **Connection pooling**: use PgBouncer in transaction mode in front of the API.
- **JSON columns**: keep small; avoid querying inside `Json` on hot paths — promote frequently-filtered fields to columns.
- **Enums**: Postgres native enums are efficient; alter only via migrations (adding values is non-destructive).
- **Decimal money**: use `Decimal` to avoid float rounding; scale with `@db.Decimal(12, 2)`.
- **Backups**: enable WAL archiving + daily snapshots (e.g. `pgBackRest` or managed service).

---

## Related

- [ER Diagram](./ER_DIAGRAM.md)
- [Architecture](./ARCHITECTURE.md)
- [Prisma Schema](../packages/database/prisma/schema.prisma)
- [Seed File](../packages/database/prisma/seed.ts)
