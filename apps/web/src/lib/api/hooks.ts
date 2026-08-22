'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentApi, teacherApi, adminApi, courseApi, authApi, messagingApi } from './services';
import { toast } from 'sonner';
import { formatApiError } from './services';

// ═══════════════════════════════════════════════════════════════════════════
// STUDENT HOOKS
// ═══════════════════════════════════════════════════════════════════════════

export const useStudentHomeStats = () =>
  useQuery({ queryKey: ['student', 'home'], queryFn: () => studentApi.homeStats() });

export const useStudentProgress = () =>
  useQuery({ queryKey: ['student', 'progress'], queryFn: () => studentApi.progress() });

export const useStudentCourses = (params?: Record<string, string>) =>
  useQuery({
    queryKey: ['student', 'courses', params],
    queryFn: () => studentApi.courses(params),
  });

export const useStudentExams = () =>
  useQuery({ queryKey: ['student', 'exams'], queryFn: () => studentApi.exams() });

export const useStudentExamResults = () =>
  useQuery({
    queryKey: ['student', 'exam-results'],
    queryFn: () => studentApi.examResults(),
  });

export const useStudentUpcomingMeetings = () =>
  useQuery({
    queryKey: ['student', 'meetings'],
    queryFn: () => studentApi.upcomingMeetings(),
  });

export const useStudentAttendance = () =>
  useQuery({
    queryKey: ['student', 'attendance'],
    queryFn: () => studentApi.attendance(),
  });

export const useStudentAssignments = (status?: string) =>
  useQuery({
    queryKey: ['student', 'assignments', status],
    queryFn: () => studentApi.assignments({ ...(status ? { status } : {}) }),
  });

export const useStudentGrades = () =>
  useQuery({ queryKey: ['student', 'grades'], queryFn: () => studentApi.grades() });

export const useStudentCalendar = () =>
  useQuery({
    queryKey: ['student', 'calendar'],
    queryFn: () => studentApi.calendar(),
  });

export const useStudentToday = () =>
  useQuery({ queryKey: ['student', 'today'], queryFn: () => studentApi.todaySchedule() });

export const useStudentChats = () =>
  useQuery({ queryKey: ['student', 'chats'], queryFn: () => studentApi.chats() });

export const useMessageContacts = (search?: string) =>
  useQuery({ queryKey: ['messages', 'contacts', search], queryFn: () => messagingApi.contacts(search) });

export const useMessageConversations = () =>
  useQuery({ queryKey: ['messages', 'conversations'], queryFn: messagingApi.conversations });

export const useMessageHistory = (chatId: string | null) =>
  useQuery({
    queryKey: ['messages', 'history', chatId],
    queryFn: () => messagingApi.messages(chatId as string),
    enabled: Boolean(chatId),
  });

export const useStartDirectChat = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (otherUserId: string) => messagingApi.directChat(otherUserId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['messages', 'conversations'] }),
    onError: (e) => toast.error(formatApiError(e)),
  });
};

export const useSendMessage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId, content }: { chatId: string; content: string }) => messagingApi.send(chatId, content),
    onSuccess: (_data, variables) => qc.invalidateQueries({ queryKey: ['messages', 'history', variables.chatId] }),
    onError: (e) => toast.error(formatApiError(e)),
  });
};

export const useStudentNotifications = () =>
  useQuery({
    queryKey: ['student', 'notifications'],
    queryFn: () => studentApi.notifications(),
  });

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => studentApi.markNotificationRead(notificationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student', 'notifications'] });
    },
    onError: (e) => toast.error(formatApiError(e)),
  });
};

export const useMarkAllNotificationsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => studentApi.markAllNotificationsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student', 'notifications'] });
    },
    onError: (e) => toast.error(formatApiError(e)),
  });
};

export const useStudentCertificates = () =>
  useQuery({
    queryKey: ['student', 'certificates'],
    queryFn: () => studentApi.certificates(),
  });

export const useStudentProfile = () =>
  useQuery({ queryKey: ['student', 'profile'], queryFn: () => studentApi.profile() });

export const useStudentSettings = () =>
  useQuery({ queryKey: ['student', 'settings'], queryFn: () => studentApi.settings() });

export const useUpdateStudentProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => studentApi.updateProfile(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student', 'profile'] });
      toast.success('Profile updated successfully');
    },
    onError: (e) => toast.error(formatApiError(e)),
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// TEACHER HOOKS
// ═══════════════════════════════════════════════════════════════════════════

export const useTeacherStats = () =>
  useQuery({ queryKey: ['teacher', 'stats'], queryFn: () => teacherApi.stats() });

export const useTeacherAnalytics = () =>
  useQuery({ queryKey: ['teacher', 'analytics'], queryFn: () => teacherApi.analytics() });

export const useTeacherProfile = () =>
  useQuery({ queryKey: ['teacher', 'profile'], queryFn: () => teacherApi.profile() });

export const useUpdateTeacherProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => teacherApi.updateProfile(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher', 'profile'] });
      toast.success('Profile updated successfully');
    },
    onError: (e) => toast.error(formatApiError(e)),
  });
};

export const useTeacherStudents = (courseId?: string, search?: string) =>
  useQuery({
    queryKey: ['teacher', 'students', courseId, search],
    queryFn: () =>
      teacherApi.students({ ...(courseId ? { courseId } : {}), ...(search ? { search } : {}) }),
  });

export const useTeacherAssignments = (courseId?: string) =>
  useQuery({
    queryKey: ['teacher', 'assignments', courseId],
    queryFn: () => teacherApi.assignments({ ...(courseId ? { courseId } : {}) }),
  });

export const useTeacherExams = (courseId?: string) =>
  useQuery({
    queryKey: ['teacher', 'exams', courseId],
    queryFn: () => teacherApi.exams({ ...(courseId ? { courseId } : {}) }),
  });

export const useTeacherMeetings = () =>
  useQuery({ queryKey: ['teacher', 'meetings'], queryFn: () => teacherApi.meetings() });

export const useTeacherAvailability = () =>
  useQuery({
    queryKey: ['teacher', 'availability'],
    queryFn: () => teacherApi.availability(),
  });

export const useTeacherCalendar = () =>
  useQuery({ queryKey: ['teacher', 'calendar'], queryFn: () => teacherApi.calendar() });

export const useTeacherNotifications = () =>
  useQuery({
    queryKey: ['teacher', 'notifications'],
    queryFn: () => teacherApi.notifications(),
  });

export const useTeacherCourses = () =>
  useQuery({ queryKey: ['teacher', 'courses'], queryFn: () => courseApi.courses() });

export const useCreateAssignment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, data }: { courseId: string; data: Record<string, unknown> }) =>
      teacherApi.createAssignment(courseId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher', 'assignments'] });
      toast.success('Assignment created');
    },
    onError: (e) => toast.error(formatApiError(e)),
  });
};

export const useDeleteAssignment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => teacherApi.deleteAssignment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher', 'assignments'] });
      toast.success('Assignment deleted');
    },
    onError: (e) => toast.error(formatApiError(e)),
  });
};

export const useCreateExam = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, data }: { courseId: string; data: Record<string, unknown> }) =>
      teacherApi.createExam(courseId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher', 'exams'] });
      toast.success('Exam created');
    },
    onError: (e) => toast.error(formatApiError(e)),
  });
};

export const useDeleteExam = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => teacherApi.deleteExam(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher', 'exams'] });
      toast.success('Exam deleted');
    },
    onError: (e) => toast.error(formatApiError(e)),
  });
};

export const useCreateMeeting = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => teacherApi.createMeeting(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher', 'meetings'] });
      toast.success('Meeting created');
    },
    onError: (e) => toast.error(formatApiError(e)),
  });
};

export const useDeleteMeeting = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => teacherApi.deleteMeeting(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher', 'meetings'] });
      toast.success('Meeting deleted');
    },
    onError: (e) => toast.error(formatApiError(e)),
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN HOOKS
// ═══════════════════════════════════════════════════════════════════════════

export const useAdminUsers = (params?: Record<string, string>) =>
  useQuery({ queryKey: ['admin', 'users', params], queryFn: () => adminApi.users(params) });

export const useAdminUserStats = () =>
  useQuery({ queryKey: ['admin', 'user-stats'], queryFn: () => adminApi.userStats() });

export const useAdminUser = (id: string | null) =>
  useQuery({
    queryKey: ['admin', 'user', id],
    queryFn: () => adminApi.user(id as string),
    enabled: !!id,
  });

export const useChangeUserPassword = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      adminApi.changePassword(id, password),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('Password reset successfully');
    },
    onError: (e) => toast.error(formatApiError(e)),
  });
};

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.createUser(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User created');
    },
    onError: (e) => toast.error(formatApiError(e)),
  });
};

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      adminApi.updateUser(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User updated');
    },
    onError: (e) => toast.error(formatApiError(e)),
  });
};

export const useDeleteUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      toast.success('User deleted');
    },
    onError: (e) => toast.error(formatApiError(e)),
  });
};

export const useAdminMeetings = () =>
  useQuery({ queryKey: ['admin', 'meetings'], queryFn: adminApi.meetings });

export const useCreateAdminMeeting = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.createMeeting(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'meetings'] });
      toast.success('Meeting created');
    },
    onError: (e) => toast.error(formatApiError(e)),
  });
};

export const useDeleteAdminMeeting = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteMeeting(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'meetings'] });
      toast.success('Meeting deleted');
    },
    onError: (e) => toast.error(formatApiError(e)),
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// COURSE HOOKS
// ═══════════════════════════════════════════════════════════════════════════

export const useCategories = (params?: Record<string, string>) =>
  useQuery({ queryKey: ['categories', params], queryFn: () => courseApi.categories(params) });

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => courseApi.createCategory(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category created');
    },
    onError: (e) => toast.error(formatApiError(e)),
  });
};

export const useUpdateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      courseApi.updateCategory(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category updated');
    },
    onError: (e) => toast.error(formatApiError(e)),
  });
};

export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => courseApi.deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted');
    },
    onError: (e) => toast.error(formatApiError(e)),
  });
};

export const useAllCourses = (params?: Record<string, string>) =>
  useQuery({ queryKey: ['courses', params], queryFn: () => courseApi.courses(params) });

export const useCourseStats = () =>
  useQuery({ queryKey: ['courses', 'stats'], queryFn: () => courseApi.courseStats() });

export const useCreateCourse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => courseApi.createCourse(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course created');
    },
    onError: (e) => toast.error(formatApiError(e)),
  });
};

export const useUpdateCourse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      courseApi.updateCourse(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course updated');
    },
    onError: (e) => toast.error(formatApiError(e)),
  });
};

export const useUpdateCourseStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      courseApi.updateCourseStatus(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course status updated');
    },
    onError: (e) => toast.error(formatApiError(e)),
  });
};

export const useDeleteCourse = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => courseApi.deleteCourse(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
      toast.success('Course deleted');
    },
    onError: (e) => toast.error(formatApiError(e)),
  });
};

export const useChangePassword = () =>
  useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => authApi.changePassword(currentPassword, newPassword),
    onSuccess: () => toast.success('Password changed successfully'),
    onError: (e) => toast.error(formatApiError(e)),
  });
