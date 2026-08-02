# ER Diagram — Enterprise LMS Platform

> **Feature 02 · Database Architecture** · PostgreSQL + Prisma ORM
> All tables use **UUID** primary keys and soft delete (`deletedAt`).
> Diagrams use Mermaid `erDiagram` syntax.

---

## Legend

| Notation | Meaning                       |
| -------- | ----------------------------- |
| `        |                               | --o{` | One-to-many (parent → child) |
| `}o--    |                               | `     | Many-to-one (child → parent) |
| `        |                               | --    |                              | `   | One-to-one |
| `}o--o{` | Many-to-many                  |
| `PK`     | Primary key (UUID)            |
| `FK`     | Foreign key                   |
| `soft`   | Has `deletedAt` (soft delete) |

---

## 1. Users & RBAC

```mermaid
erDiagram
    User ||--o| UserProfile : "profile"
    User ||--o| Teacher : "teacher"
    User ||--o| Student : "student"
    User ||--o| Admin : "admin"
    User ||--o| Moderator : "moderator"
    Permission ||--o{ RolePermission : "granted by"
    RolePermission }o--|| Role : "targets"

    User {
        uuid id PK
        string email UK
        string passwordHash
        role role
        boolean isActive
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    UserProfile {
        uuid id PK
        uuid userId FK
        string firstName
        string lastName
        string timezone
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    Teacher {
        uuid id PK
        uuid userId FK
        string employeeId UK
        decimal hourlyRate
        decimal rating
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    Student {
        uuid id PK
        uuid userId FK
        string studentNumber UK
        boolean isActive
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    Admin {
        uuid id PK
        uuid userId FK
        boolean isSuper
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    Moderator {
        uuid id PK
        uuid userId FK
        string section
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    Roles {
        uuid id PK
        string name UK
        boolean isSystem
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    Permission {
        uuid id PK
        string resource
        action action
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    RolePermission {
        uuid id PK
        role role
        uuid permissionId FK
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
```

## 2. Authentication

```mermaid
erDiagram
    User ||--o{ Account : "accounts"
    User ||--o{ Session : "sessions"
    User ||--o{ RefreshToken : "refreshTokens"
    User ||--o{ EmailVerificationToken : "emailVerification"
    User ||--o{ PasswordResetToken : "passwordReset"
    User ||--o{ Device : "devices"
    User ||--o{ LoginHistory : "loginHistory"
    Device ||--o{ Session : "deviceSessions"
    Device ||--o{ LoginHistory : "deviceLogins"

    Account {
        uuid id PK
        uuid userId FK
        provider provider
        string providerAccountId UK
        datetime expiresAt
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    Session {
        uuid id PK
        uuid userId FK
        uuid deviceId FK
        string token UK
        datetime expiresAt
        status status
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    RefreshToken {
        uuid id PK
        uuid userId FK
        string token UK
        string family
        datetime expiresAt
        datetime revokedAt
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    EmailVerificationToken {
        uuid id PK
        uuid userId FK
        string email
        string token UK
        datetime expiresAt
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    PasswordResetToken {
        uuid id PK
        uuid userId FK
        string email
        string token UK
        datetime expiresAt
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    Device {
        uuid id PK
        uuid userId FK
        string deviceName
        type deviceType
        string pushToken
        boolean isTrusted
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    LoginHistory {
        uuid id PK
        uuid userId FK
        uuid deviceId FK
        string ipAddress
        method method
        status status
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
```

## 3. Courses

```mermaid
erDiagram
    Category ||--o{ SubCategory : "has"
    Category ||--o{ Subject : "classifies"
    SubCategory ||--o{ Subject : "classifies"
    Category ||--o{ Course : "groups"
    SubCategory ||--o{ Course : "groups"
    Subject ||--o{ Course : "covers"
    Course ||--o{ CourseChapter : "has"
    CourseChapter ||--o{ Lesson : "contains"
    Lesson ||--o{ LessonVideo : "videos"
    Lesson ||--o{ LessonPDF : "pdfs"
    Lesson ||--o{ LessonAttachment : "attachments"
    Lesson ||--o{ LessonResource : "resources"
    Course ||--o{ CourseMedia : "assets"
    Course ||--o{ CourseReview : "reviews"
    User ||--o{ CourseReview : "authors"
    Course ||--o| CourseAnalytics : "analytics"
    Course ||--o{ CourseTeacher : "teachers"
    Teacher ||--o{ CourseTeacher : "teaches"
    Course ||--o{ CourseStudent : "students"
    Student ||--o{ CourseStudent : "enrolls"

    Category {
        uuid id PK
        string name
        string slug UK
        boolean isActive
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    SubCategory {
        uuid id PK
        uuid categoryId FK
        string name
        string slug UK
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    Subject {
        uuid id PK
        uuid categoryId FK
        uuid subCategoryId FK
        string name
        string code UK
        string slug UK
        status status
        boolean isActive
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    Course {
        uuid id PK
        uuid categoryId FK
        uuid subCategoryId FK
        uuid subjectId FK
        uuid createdBy FK
        string title
        string slug UK
        decimal price
        status status
        boolean isPublished
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    CourseMedia {
        uuid id PK
        uuid courseId FK
        string type
        string url
        boolean isPrimary
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    CourseReview {
        uuid id PK
        uuid courseId FK
        uuid userId FK
        int rating
        status status
        uuid moderatedBy FK
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    CourseAnalytics {
        uuid id PK
        uuid courseId FK
        int enrollmentCount
        decimal completionRate
        decimal revenue
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    CourseTeacher {
        uuid id PK
        uuid courseId FK
        uuid teacherId FK
        string role
        boolean isPrimary
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    CourseStudent {
        uuid id PK
        uuid courseId FK
        uuid studentId FK
        decimal progress
        datetime completedAt
        string status
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    CourseChapter {
        uuid id PK
        uuid courseId FK
        string title
        int orderIndex
        boolean isPublished
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    Lesson {
        uuid id PK
        uuid chapterId FK
        string title
        type type
        int orderIndex
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    LessonVideo {
        uuid id PK
        uuid lessonId FK
        string url
        source source
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    LessonPDF {
        uuid id PK
        uuid lessonId FK
        string url
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    LessonAttachment {
        uuid id PK
        uuid lessonId FK
        string fileName
        string fileUrl
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    LessonResource {
        uuid id PK
        uuid lessonId FK
        string title
        string type
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
```

## 4. Live Classes

```mermaid
erDiagram
    Course ||--o{ ZoomMeeting : "meetings"
    Teacher ||--o{ ZoomMeeting : "hosts"
    ZoomMeeting ||--o{ MeetingSchedule : "schedules"
    ZoomMeeting ||--o{ MeetingAttendance : "attendance"
    ZoomMeeting ||--o{ MeetingRecording : "recordings"
    ZoomMeeting ||--o{ MeetingFeedback : "feedback"
    Student ||--o{ MeetingAttendance : "attends"

    ZoomMeeting {
        uuid id PK
        uuid courseId FK
        uuid teacherId FK
        string topic
        datetime startTime
        int durationMinutes
        string joinUrl
        status status
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    MeetingSchedule {
        uuid id PK
        uuid zoomMeetingId FK
        uuid courseId FK
        uuid teacherId FK
        datetime startTime
        datetime endTime
        recurrence recurrence
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    MeetingAttendance {
        uuid id PK
        uuid meetingId FK
        uuid scheduleId FK
        uuid studentId FK
        datetime joinedAt
        status status
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    MeetingRecording {
        uuid id PK
        uuid meetingId FK
        string url
        string storageProvider
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    MeetingFeedback {
        uuid id PK
        uuid meetingId FK
        uuid userId FK
        int rating
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
```

## 5. Booking

```mermaid
erDiagram
    Teacher ||--o{ TeacherAvailability : "availability"
    TeacherAvailability ||--o{ Booking : "bookings"
    Student ||--o{ Booking : "books"
    BookingStatus ||--o{ Booking : "status"
    Booking ||--o{ BookingHistory : "history"
    BookingStatus ||--o{ BookingHistory : "fromStatus"
    BookingStatus ||--o{ BookingHistory : "toStatus"
    Booking ||--o{ Reschedule : "reschedules"

    TeacherAvailability {
        uuid id PK
        uuid teacherId FK
        int dayOfWeek
        string startTime
        string endTime
        recurrence recurrence
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    BookingStatus {
        uuid id PK
        name name UK
        string label
        string color
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    Booking {
        uuid id PK
        string bookingNumber UK
        uuid studentId FK
        uuid teacherId FK
        uuid availabilityId FK
        uuid statusId FK
        datetime startTime
        datetime endTime
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    BookingHistory {
        uuid id PK
        uuid bookingId FK
        uuid fromStatusId FK
        uuid toStatusId FK
        string note
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    Reschedule {
        uuid id PK
        uuid bookingId FK
        string requestedBy
        datetime fromStart
        datetime toStart
        string status
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
```

## 6. Calendar

```mermaid
erDiagram
    User ||--o{ Event : "events"
    User ||--o{ Schedule : "creates"
    Schedule ||--o{ TeacherSchedule : "teachers"
    Schedule ||--o{ StudentSchedule : "students"
    Teacher ||--o{ TeacherSchedule : "assigned"
    Student ||--o{ StudentSchedule : "assigned"

    Event {
        uuid id PK
        uuid userId FK
        uuid createdBy FK
        string title
        type type
        datetime startTime
        datetime endTime
        recurrence recurrence
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    Schedule {
        uuid id PK
        uuid createdBy FK
        string title
        datetime startTime
        datetime endTime
        recurrence recurrence
        boolean isPublished
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    TeacherSchedule {
        uuid id PK
        uuid scheduleId FK
        uuid teacherId FK
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    StudentSchedule {
        uuid id PK
        uuid scheduleId FK
        uuid studentId FK
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
```

## 7. Exams

```mermaid
erDiagram
    Course ||--o{ Exam : "has"
    Exam ||--o{ ExamSection : "sections"
    ExamSection ||--o{ Question : "questions"
    QuestionBank ||--o{ Question : "bank"
    Question ||--o{ QuestionChoice : "choices"
    Exam ||--o{ ExamAttempt : "attempts"
    Student ||--o{ ExamAttempt : "takes"
    ExamAttempt ||--o{ StudentAnswer : "answers"
    Question ||--o{ StudentAnswer : "answered by"
    ExamAttempt ||--o{ ExamResult : "result"
    Exam ||--o| ExamStatistics : "stats"

    Exam {
        uuid id PK
        uuid courseId FK
        string title
        type type
        int durationMinutes
        int totalMarks
        boolean isPublished
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    ExamSection {
        uuid id PK
        uuid examId FK
        string title
        int orderIndex
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    QuestionBank {
        uuid id PK
        uuid courseId FK
        uuid teacherId FK
        string title
        boolean isPublic
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    Question {
        uuid id PK
        uuid sectionId FK
        uuid questionBankId FK
        string text
        type type
        int marks
        difficulty difficulty
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    QuestionChoice {
        uuid id PK
        uuid questionId FK
        string text
        boolean isCorrect
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    ExamAttempt {
        uuid id PK
        uuid examId FK
        uuid studentId FK
        status status
        datetime startedAt
        decimal score
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    StudentAnswer {
        uuid id PK
        uuid attemptId FK
        uuid questionId FK
        uuid studentId FK
        uuid choiceId FK
        decimal marksObtained
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    ExamResult {
        uuid id PK
        uuid attemptId FK
        uuid examId FK
        uuid studentId FK
        decimal percentage
        string grade
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    ExamStatistics {
        uuid id PK
        uuid examId FK
        int totalAttempts
        decimal averageScore
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
```

## 8. Homework

```mermaid
erDiagram
    Course ||--o{ Assignment : "assignments"
    Teacher ||--o{ Assignment : "creates"
    Assignment ||--o{ AssignmentFile : "files"
    Assignment ||--o{ AssignmentSubmission : "submissions"
    Student ||--o{ AssignmentSubmission : "submits"
    AssignmentSubmission ||--o| SubmissionGrade : "grade"
    AssignmentSubmission ||--o{ SubmissionFeedback : "feedback"

    Assignment {
        uuid id PK
        uuid courseId FK
        uuid teacherId FK
        string title
        type type
        datetime dueDate
        int totalMarks
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    AssignmentFile {
        uuid id PK
        uuid assignmentId FK
        string fileName
        string fileUrl
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    AssignmentSubmission {
        uuid id PK
        uuid assignmentId FK
        uuid studentId FK
        datetime submittedAt
        status status
        boolean isLate
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    SubmissionGrade {
        uuid id PK
        uuid submissionId FK
        decimal marksObtained
        decimal percentage
        string letterGrade
        datetime gradedAt
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    SubmissionFeedback {
        uuid id PK
        uuid submissionId FK
        uuid authorId FK
        string content
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
```

## 9. Files

```mermaid
erDiagram
    User ||--o{ Upload : "uploads"
    Upload ||--o| Image : "image"
    Upload ||--o| Video : "video"
    Upload ||--o| Document : "document"

    Upload {
        uuid id PK
        uuid userId FK
        string fileName
        string mimeType
        bigint sizeBytes
        kind kind
        provider storageProvider
        string storageKey
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    Image {
        uuid id PK
        uuid uploadId FK
        int width
        int height
        string url
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    Video {
        uuid id PK
        uuid uploadId FK
        int durationSeconds
        string playbackUrl
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    Document {
        uuid id PK
        uuid uploadId FK
        int pageCount
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    CloudStorage {
        uuid id PK
        provider provider UK
        json credentials
        boolean isActive
        bigint totalBytesUsed
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
```

## 10. Chat

```mermaid
erDiagram
    User ||--o{ Chat : "creates"
    Chat ||--o{ ConversationMember : "members"
    User ||--o{ ConversationMember : "joins"
    Chat ||--o{ Message : "messages"
    User ||--o{ Message : "sends"
    Message ||--o{ MessageAttachment : "attachments"

    Chat {
        uuid id PK
        string type
        uuid createdBy FK
        boolean isArchived
        datetime lastMessageAt
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    ConversationMember {
        uuid id PK
        uuid chatId FK
        uuid userId FK
        string role
        boolean isMuted
        datetime lastReadAt
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    Message {
        uuid id PK
        uuid chatId FK
        uuid senderId FK
        uuid replyToId FK
        type type
        string content
        status status
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    MessageAttachment {
        uuid id PK
        uuid messageId FK
        string fileUrl
        string fileName
        kind type
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
```

## 11. Notifications

```mermaid
erDiagram
    User ||--o{ Notification : "notifications"
    NotificationTemplate ||--o{ EmailNotification : "templates"
    User ||--o{ EmailNotification : "email"
    User ||--o{ PushNotification : "push"
    Device ||--o{ PushNotification : "devicePush"
    User ||--o{ SMSNotification : "sms"

    Notification {
        uuid id PK
        uuid userId FK
        string title
        type type
        channel channel
        boolean isRead
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    NotificationTemplate {
        uuid id PK
        string name UK
        type type
        string subject
        string body
        boolean isActive
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    EmailNotification {
        uuid id PK
        uuid userId FK
        uuid templateId FK
        string to
        string subject
        status status
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    PushNotification {
        uuid id PK
        uuid userId FK
        uuid deviceId FK
        string title
        status status
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    SMSNotification {
        uuid id PK
        uuid userId FK
        string phoneNumber
        status status
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
```

## 12. Certificates

```mermaid
erDiagram
    CertificateTemplate ||--o{ Certificate : "issued"
    Student ||--o{ Certificate : "earns"
    Course ||--o{ Certificate : "course"
    Certificate ||--o{ CertificateDownload : "downloads"
    User ||--o{ CertificateDownload : "downloads"

    CertificateTemplate {
        uuid id PK
        string name UK
        string templateHtml
        boolean isActive
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    Certificate {
        uuid id PK
        string certificateNumber UK
        uuid templateId FK
        uuid studentId FK
        uuid courseId FK
        datetime issuedAt
        status status
        string pdfUrl
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    CertificateDownload {
        uuid id PK
        uuid certificateId FK
        uuid userId FK
        string format
        datetime downloadedAt
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
```

## 13. Payments

```mermaid
erDiagram
    User ||--o{ Payment : "pays"
    Invoice ||--o{ Payment : "payments"
    User ||--o{ Invoice : "invoices"
    User ||--o{ Subscription : "subscriptions"
    Subscription ||--o{ Payment : "payments"
    Subscription ||--o{ Invoice : "invoices"
    Coupon ||--o{ DiscountCode : "codes"
    User ||--o{ DiscountCode : "owned"

    Payment {
        uuid id PK
        string paymentNumber UK
        uuid userId FK
        uuid invoiceId FK
        uuid subscriptionId FK
        decimal amount
        status status
        method method
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    Invoice {
        uuid id PK
        string invoiceNumber UK
        uuid userId FK
        uuid subscriptionId FK
        decimal totalAmount
        status status
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    Subscription {
        uuid id PK
        uuid userId FK
        string planName
        decimal price
        status status
        datetime startDate
        datetime endDate
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    Coupon {
        uuid id PK
        string code UK
        type type
        decimal value
        boolean isActive
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    DiscountCode {
        uuid id PK
        uuid couponId FK
        uuid userId FK
        string code UK
        decimal discount
        boolean isUsed
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
```

## 14. Reports

```mermaid
erDiagram
    Student ||--o{ StudentReport : "reports"
    User ||--o{ StudentReport : "generates"
    Teacher ||--o{ TeacherReport : "reports"
    User ||--o{ TeacherReport : "generates"
    Course ||--o{ AttendanceReport : "attendance"
    Teacher ||--o{ AttendanceReport : "attendance"

    StudentReport {
        uuid id PK
        uuid studentId FK
        uuid generatedBy FK
        type reportType
        json data
        format format
        status status
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    TeacherReport {
        uuid id PK
        uuid teacherId FK
        uuid generatedBy FK
        type reportType
        json data
        format format
        status status
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    AttendanceReport {
        uuid id PK
        uuid courseId FK
        uuid teacherId FK
        type reportType
        json data
        format format
        status status
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    RevenueReport {
        uuid id PK
        type reportType
        decimal totalRevenue
        decimal netRevenue
        format format
        status status
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
```

## 15. Feedback

```mermaid
erDiagram
    Lesson ||--o{ LessonFeedback : "feedback"
    User ||--o{ LessonFeedback : "authors"
    Teacher ||--o{ TeacherRating : "ratings"
    User ||--o{ TeacherRating : "authors"
    Course ||--o{ CourseRating : "ratings"
    User ||--o{ CourseRating : "authors"
    User ||--o{ PlatformFeedback : "feedback"

    LessonFeedback {
        uuid id PK
        uuid lessonId FK
        uuid userId FK
        int rating
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    TeacherRating {
        uuid id PK
        uuid teacherId FK
        uuid userId FK
        int rating
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    CourseRating {
        uuid id PK
        uuid courseId FK
        uuid userId FK
        int rating
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    PlatformFeedback {
        uuid id PK
        uuid userId FK
        string category
        string title
        status status
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
```

## 16. Audit

```mermaid
erDiagram
    User ||--o{ AuditLog : "audits"
    User ||--o{ ActivityLog : "activities"

    AuditLog {
        uuid id PK
        uuid actorId FK
        action action
        string resource
        string resourceId
        json metadata
        string ipAddress
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    ActivityLog {
        uuid id PK
        uuid actorId FK
        string action
        string resource
        json details
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    SystemLog {
        uuid id PK
        level level
        string source
        string message
        json details
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    ErrorLog {
        uuid id PK
        severity severity
        status status
        string message
        uuid userId FK
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
```

## 17. Settings

```mermaid
erDiagram
    GeneralSettings {
        uuid id PK
        string key UK
        json value
        boolean isPublic
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    SecuritySettings {
        uuid id PK
        string key UK
        json value
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    StorageSettings {
        uuid id PK
        string key UK
        json value
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    EmailSettings {
        uuid id PK
        string key UK
        json value
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    ZoomSettings {
        uuid id PK
        string key UK
        json value
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
    ThemeSettings {
        uuid id PK
        string key UK
        json value
        datetime createdAt
        datetime updatedAt
        datetime deletedAt "soft"
    }
```

---

## Statistics

| Domain         | Tables  | Relations |
| -------------- | ------- | --------- |
| Users & RBAC   | 9       | 7         |
| Authentication | 7       | 8         |
| Courses        | 15      | 19        |
| Live Classes   | 5       | 6         |
| Booking        | 5       | 7         |
| Calendar       | 4       | 5         |
| Exams          | 9       | 10        |
| Homework       | 5       | 6         |
| Files          | 5       | 4         |
| Chat           | 4       | 5         |
| Notifications  | 5       | 6         |
| Certificates   | 3       | 5         |
| Payments       | 5       | 8         |
| Reports        | 4       | 5         |
| Feedback       | 4       | 6         |
| Audit          | 4       | 2         |
| Settings       | 6       | 0         |
| **Total**      | **~99** | **~109**  |

> See [DATABASE.md](./DATABASE.md) for full model documentation, index strategy, and conventions.
