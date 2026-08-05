'use client';

import { Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStudentCertificates } from '@/lib/api/hooks';
import { LoadingState, EmptyState } from '@/components/dashboard/data-states';

interface CertificateItem {
  id: string;
  title: string;
  certificateNumber?: string;
  issuedAt?: string | null;
  status?: string;
  courseTitle?: string;
  [key: string]: unknown;
}

export default function StudentCertificatesPage() {
  const { data, isLoading, isError } = useStudentCertificates();

  const certificates: CertificateItem[] = Array.isArray(data)
    ? (data as CertificateItem[])
    : ((data as { certificates?: CertificateItem[] })?.certificates ?? []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">My Certificates</h2>
        <p className="text-muted-foreground text-sm">Certificates you have earned</p>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : isError || certificates.length === 0 ? (
        <EmptyState
          title="No certificates yet"
          description="Complete your courses to earn certificates."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {certificates.map((c) => (
            <Card key={c.id as string}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
                    <Award className="text-primary h-5 w-5" />
                  </div>
                  <Badge>{String(c.status ?? 'ISSUED')}</Badge>
                </div>
                <CardTitle className="mt-3 text-base">{String(c.title)}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground space-y-2 text-sm">
                {c.certificateNumber && (
                  <p className="font-mono text-xs">#{String(c.certificateNumber)}</p>
                )}
                {c.issuedAt && <p>Issued: {new Date(String(c.issuedAt)).toLocaleDateString()}</p>}
                <Button asChild size="sm" variant="outline" className="w-full">
                  <a href={`/student/certificates/${c.id}`}>View Certificate</a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
