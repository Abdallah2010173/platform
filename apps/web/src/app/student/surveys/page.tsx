'use client';

import { ClipboardList, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState, LoadingState } from '@/components/dashboard/data-states';
import { useStudentSurveys } from '@/lib/api/hooks';

interface Survey {
  id: string;
  title: string;
  description: string | null;
  externalUrl: string;
  course?: { title: string };
}

function isSurveyList(value: unknown): value is Survey[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'object' && item !== null && 'id' in item && 'title' in item && 'externalUrl' in item);
}

export default function StudentSurveysPage() {
  const { data, isLoading } = useStudentSurveys();
  const surveys = isSurveyList(data) ? data : [];
  if (isLoading) return <LoadingState label="Loading surveys..." />;
  if (!surveys.length) return <EmptyState title="No surveys available" description="Course surveys will appear here when published." />;
  return <div className="grid gap-4 md:grid-cols-2">{surveys.map((survey) => <Card key={survey.id}><CardHeader><CardTitle className="flex items-center gap-2 text-base"><ClipboardList className="h-4 w-4" />{survey.title}</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-muted-foreground text-sm">{survey.description || survey.course?.title}</p><Button asChild size="sm"><a href={survey.externalUrl} target="_blank" rel="noopener noreferrer">Open survey <ExternalLink className="ml-2 h-4 w-4" /></a></Button></CardContent></Card>)}</div>;
}
