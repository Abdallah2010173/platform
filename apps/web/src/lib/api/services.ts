import apiClient, { getApiData } from './client';

// ═══════════════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════════════

export const authApi = {
  login: async (email: string, password: string) =>
    getApiData(await apiClient.post('/auth/login', { email, password })),
  register: async (data: Record<string, unknown>) =>
    getApiData(await apiClient.post('/auth/register', data)),
  forgotPassword: async (email: string) =>
    getApiData(await apiClient.post('/auth/forgot-password', { email })),
  resetPassword: async (token: string, password: string) =>
    getApiData(await apiClient.post('/auth/reset-password', { token, password })),
  verifyEmail: async (token: string) =>
    getApiData(await apiClient.post('/auth/verify-email', { token })),
changePassword: async (currentPassword: string, newPassword: string) =>
    getApiData(await apiClient.post('/auth/change-password', { currentPassword, newPassword })),
  googleExchange: async (code: string) =>
    getApiData(await apiClient.post('/auth/google/exchange', { code })),
  me: async () => getApiData(await apiClient.get('/auth/me')),
};

// ═══════════════════════════════════════════════════════════════════════════
// STUDENT
// ═══════════════════════════════════════════════════════════════════════════

const d = <T>(data: unknown): T => data as T;

export interface TodayScheduleResponse {
  events?: { title?: string; type?: string; time?: string | null; startTime?: string | null }[];
  [key: string]: unknown;
}

export const studentApi = {
  homeStats: async () =>
    d<{
      myCourses: number;
      activeCourses: number;
      completedCourses: number;
      todayClasses: number;
      upcomingMeetings: number;
      pendingHomework: number;
      upcomingExams: number;
      certificatesEarned: number;
      unreadNotifications: number;
      averageProgress: number;
    }>(getApiData(await apiClient.get('/student/stats/home'))),
  progress: async () =>
    d<{
      courses: {
        courseId: string;
        title: string;
        progress: number;
        status: string;
        completedAt: string | null;
      }[];
      attendanceRate: number;
      homeworkCompletion: number;
      examAverage: number;
      examResults: { percentage: number; passed: boolean | null }[];
      achievements: { title: string; icon: string }[];
    }>(getApiData(await apiClient.get('/student/stats/progress'))),
  courses: async (params?: Record<string, string>) =>
    getApiData(await apiClient.get('/student/courses', { params })),
  courseDetail: async (courseId: string) =>
    getApiData(await apiClient.get(`/student/courses/${courseId}`)),
  lesson: async (courseId: string, lessonId: string) =>
    getApiData(await apiClient.get(`/student/courses/${courseId}/lessons/${lessonId}`)),
  completeLesson: async (courseId: string, lessonId: string) =>
    getApiData(await apiClient.post(`/student/courses/${courseId}/lessons/${lessonId}/complete`)),
  enroll: async (courseId: string) =>
    getApiData(await apiClient.post(`/student/courses/${courseId}/enroll`)),
  exams: async () => getApiData(await apiClient.get('/student/exams')),
  examResults: async () => getApiData(await apiClient.get('/student/exams/results')),
  examHistory: async () => getApiData(await apiClient.get('/student/exams/history')),
  startExam: async (examId: string) =>
    getApiData(await apiClient.post(`/student/exams/${examId}/start`)),
  upcomingMeetings: async () => getApiData(await apiClient.get('/student/meetings/upcoming')),
  attendance: async () => getApiData(await apiClient.get('/student/meetings/attendance')),
  assignments: async (params?: Record<string, string>) =>
    getApiData(await apiClient.get('/student/homework/assignments', { params })),
  grades: async () => getApiData(await apiClient.get('/student/homework/grades')),
  calendar: async (params?: Record<string, string>) =>
    getApiData(await apiClient.get('/student/calendar', { params })),
  todaySchedule: async () =>
    d<TodayScheduleResponse>(getApiData(await apiClient.get('/student/calendar/today'))),
  chats: async () => getApiData(await apiClient.get('/student/messages/chats')),
  messages: async (chatId: string, params?: Record<string, string>) =>
    getApiData(await apiClient.get(`/student/messages/chats/${chatId}/messages`, { params })),
  sendMessage: async (chatId: string, data: Record<string, unknown>) =>
    getApiData(await apiClient.post(`/student/messages/chats/${chatId}/messages`, data)),
  bookings: async (params?: Record<string, string>) =>
    getApiData(await apiClient.get('/student/bookings', { params })),
  teacherAvailability: async (params?: Record<string, string>) =>
    getApiData(await apiClient.get('/student/bookings/availability', { params })),
notifications: async (params?: Record<string, string>) =>
    getApiData(await apiClient.get('/student/notifications', { params })),
  markNotificationRead: async (notificationId: string) =>
    getApiData(await apiClient.patch(`/student/notifications/${notificationId}/read`)),
  markAllNotificationsRead: async () =>
    getApiData(await apiClient.post('/student/notifications/read-all')),
  profile: async () => getApiData(await apiClient.get('/student/profile')),
  updateProfile: async (data: Record<string, unknown>) =>
    getApiData(await apiClient.patch('/student/profile', data)),
  settings: async () => getApiData(await apiClient.get('/student/settings')),
  updateTheme: async (data: Record<string, unknown>) =>
    getApiData(await apiClient.patch('/student/settings/theme', data)),
  updateNotificationSettings: async (settings: Record<string, unknown>) =>
    getApiData(await apiClient.patch('/student/settings/notification-preferences', { settings })),
  certificates: async () => getApiData(await apiClient.get('/student/certificates')),
  search: async (params?: Record<string, string>) =>
    getApiData(await apiClient.get('/student/search', { params })),
  files: async (params?: Record<string, string>) =>
    getApiData(await apiClient.get('/student/files', { params })),
};

// ═══════════════════════════════════════════════════════════════════════════
// TEACHER
// ═══════════════════════════════════════════════════════════════════════════

export const teacherApi = {
  stats: async () => getApiData(await apiClient.get('/teacher/stats')),
  analytics: async () => getApiData(await apiClient.get('/teacher/analytics')),
  profile: async () => getApiData(await apiClient.get('/teacher/profile')),
  updateProfile: async (data: Record<string, unknown>) =>
    getApiData(await apiClient.patch('/teacher/profile', data)),
  students: async (params?: Record<string, string>) =>
    getApiData(await apiClient.get('/teacher/students', { params })),
  assignments: async (params?: Record<string, string>) =>
    getApiData(await apiClient.get('/teacher/assignments', { params })),
  createAssignment: async (courseId: string, data: Record<string, unknown>) =>
    getApiData(await apiClient.post(`/teacher/courses/${courseId}/assignments`, data)),
  updateAssignment: async (assignmentId: string, data: Record<string, unknown>) =>
    getApiData(await apiClient.patch(`/teacher/assignments/${assignmentId}`, data)),
  deleteAssignment: async (assignmentId: string) =>
    getApiData(await apiClient.delete(`/teacher/assignments/${assignmentId}`)),
  submissions: async (assignmentId: string) =>
    getApiData(await apiClient.get(`/teacher/assignments/${assignmentId}/submissions`)),
  gradeSubmission: async (submissionId: string, data: Record<string, unknown>) =>
    getApiData(await apiClient.post(`/teacher/submissions/${submissionId}/grade`, data)),
  exams: async (params?: Record<string, string>) =>
    getApiData(await apiClient.get('/teacher/exams', { params })),
  createExam: async (courseId: string, data: Record<string, unknown>) =>
    getApiData(await apiClient.post(`/teacher/courses/${courseId}/exams`, data)),
  updateExam: async (examId: string, data: Record<string, unknown>) =>
    getApiData(await apiClient.patch(`/teacher/exams/${examId}`, data)),
  deleteExam: async (examId: string) =>
    getApiData(await apiClient.delete(`/teacher/exams/${examId}`)),
  examResults: async (examId: string) =>
    getApiData(await apiClient.get(`/teacher/exams/${examId}/results`)),
  meetings: async () => getApiData(await apiClient.get('/teacher/meetings')),
  createMeeting: async (data: Record<string, unknown>) =>
    getApiData(await apiClient.post('/teacher/meetings', data)),
  updateMeeting: async (meetingId: string, data: Record<string, unknown>) =>
    getApiData(await apiClient.patch(`/teacher/meetings/${meetingId}`, data)),
  deleteMeeting: async (meetingId: string) =>
    getApiData(await apiClient.delete(`/teacher/meetings/${meetingId}`)),
  availability: async () => getApiData(await apiClient.get('/teacher/availability')),
  setAvailability: async (data: Record<string, unknown>) =>
    getApiData(await apiClient.post('/teacher/availability', data)),
  updateAvailability: async (availabilityId: string, data: Record<string, unknown>) =>
    getApiData(await apiClient.patch(`/teacher/availability/${availabilityId}`, data)),
  deleteAvailability: async (availabilityId: string) =>
    getApiData(await apiClient.delete(`/teacher/availability/${availabilityId}`)),
  calendar: async (params?: Record<string, string>) =>
    getApiData(await apiClient.get('/teacher/calendar', { params })),
notifications: async (params?: Record<string, string>) =>
    getApiData(await apiClient.get('/teacher/notifications', { params })),
  markNotificationRead: async (notificationId: string) =>
    getApiData(await apiClient.post(`/teacher/notifications/${notificationId}/read`)),
  markAllNotificationsRead: async () =>
    getApiData(await apiClient.post('/teacher/notifications/read-all')),
  questionBanks: async (params?: Record<string, string>) =>
    getApiData(await apiClient.get('/teacher/question-banks', { params })),
};

export const messagingApi = {
  contacts: async (search?: string) =>
    getApiData(await apiClient.get('/messages/contacts', { params: search ? { search } : undefined })),
  conversations: async () => getApiData(await apiClient.get('/messages/conversations')),
  directChat: async (otherUserId: string) =>
    getApiData(await apiClient.post(`/messages/conversations/direct/${otherUserId}`)),
  messages: async (chatId: string) =>
    getApiData(await apiClient.get(`/messages/conversations/${chatId}/messages`)),
  send: async (chatId: string, content: string) =>
    getApiData(await apiClient.post(`/messages/conversations/${chatId}/messages`, { content })),
  markRead: async (chatId: string) =>
    getApiData(await apiClient.post(`/messages/conversations/${chatId}/read`)),
};

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN / USERS
// ═══════════════════════════════════════════════════════════════════════════

export const adminApi = {
  users: async (params?: Record<string, string>) =>
    getApiData(await apiClient.get('/users', { params })),
  user: async (id: string) => getApiData(await apiClient.get(`/users/${id}`)),
  userStats: async () => getApiData(await apiClient.get('/users/stats')),
  createUser: async (data: Record<string, unknown>) =>
    getApiData(await apiClient.post('/users', data)),
  updateUser: async (id: string, data: Record<string, unknown>) =>
    getApiData(await apiClient.patch(`/users/${id}`, data)),
  deleteUser: async (id: string) => getApiData(await apiClient.delete(`/users/${id}`)),
  restoreUser: async (id: string) => getApiData(await apiClient.post(`/users/${id}/restore`)),
  changePassword: async (id: string, newPassword: string) =>
    getApiData(await apiClient.post(`/users/${id}/change-password`, { newPassword })),
  bulkAction: async (ids: string[], action: string, extra?: Record<string, unknown>) =>
    getApiData(await apiClient.post('/users/bulk', { ids, action, ...(extra ? { extra } : {}) })),
  meetings: async () => getApiData(await apiClient.get('/admin/meetings')),
  createMeeting: async (data: Record<string, unknown>) =>
    getApiData(await apiClient.post('/admin/meetings', data)),
  deleteMeeting: async (id: string) => getApiData(await apiClient.delete(`/admin/meetings/${id}`)),
};

// ═══════════════════════════════════════════════════════════════════════════
// COURSES (shared)
// ═══════════════════════════════════════════════════════════════════════════

export const courseApi = {
  categories: async (params?: Record<string, string>) =>
    getApiData(await apiClient.get('/categories', { params })),
  categoryTree: async () => getApiData(await apiClient.get('/categories/tree')),
  category: async (id: string) => getApiData(await apiClient.get(`/categories/${id}`)),
  courses: async (params?: Record<string, string>) =>
    getApiData(await apiClient.get('/courses', { params })),
  course: async (id: string) => getApiData(await apiClient.get(`/courses/${id}`)),
  createCourse: async (data: Record<string, unknown>) =>
    getApiData(await apiClient.post('/courses', data)),
  updateCourse: async (id: string, data: Record<string, unknown>) =>
    getApiData(await apiClient.patch(`/courses/${id}`, data)),
  updateCourseStatus: async (id: string, data: Record<string, unknown>) =>
    getApiData(await apiClient.patch(`/courses/${id}/status`, data)),
  deleteCourse: async (id: string) => getApiData(await apiClient.delete(`/courses/${id}`)),
  courseStats: async () => getApiData(await apiClient.get('/courses/stats')),
  createCategory: async (data: Record<string, unknown>) =>
    getApiData(await apiClient.post('/categories', data)),
  updateCategory: async (id: string, data: Record<string, unknown>) =>
    getApiData(await apiClient.patch(`/categories/${id}`, data)),
  deleteCategory: async (id: string) => getApiData(await apiClient.delete(`/categories/${id}`)),
};

export const formatApiError = (e: unknown): string => {
  if (e && typeof e === 'object' && 'response' in e) {
    const err = e as {
      response?: { data?: { message?: string; error?: string } };
      message?: string;
    };
    const data = err.response?.data;
    if (data?.message) return Array.isArray(data.message) ? data.message.join(', ') : data.message;
    if (data?.error) return data.error;
  }
  if (e instanceof Error) return e.message;
  return 'An unexpected error occurred';
};
