'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useStudentProfile, useUpdateStudentProfile } from '@/lib/api/hooks';
import { LoadingState } from '@/components/dashboard/data-states';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  bio: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function StudentProfilePage() {
  const { data, isLoading } = useStudentProfile();
  const updateProfile = useUpdateStudentProfile();
  const [init, setInit] = useState(false);

  const profile = (data as Record<string, unknown> | undefined) ?? {};
  const user = (profile.user ?? profile) as Record<string, unknown>;

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: !init
      ? undefined
      : {
          firstName: String(user.firstName ?? ''),
          lastName: String(user.lastName ?? ''),
          phone: String(user.phone ?? ''),
          bio: String(user.bio ?? ''),
        },
  });

  // Initialize the form once data arrives.
  if (!init && !isLoading && data) {
    setInit(true);
  }

  const onSubmit = (form: ProfileForm) => {
    updateProfile.mutate(form as unknown as Record<string, unknown>);
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={String(user.avatarUrl ?? '')} />
              <AvatarFallback>
                {String(user.firstName ?? 'S').charAt(0)}
                {String(user.lastName ?? '').charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {String(user.firstName ?? '')} {String(user.lastName ?? '')}
              </p>
              <p className="text-muted-foreground text-sm">{String(user.email ?? '')}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" {...register('firstName')} />
                {errors.firstName && (
                  <p className="text-destructive text-sm">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" {...register('lastName')} />
                {errors.lastName && (
                  <p className="text-destructive text-sm">{errors.lastName.message}</p>
                )}
              </div>
</div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={String(user.email ?? '')} readOnly disabled />
              <p className="text-muted-foreground text-xs">
                Email cannot be changed here.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register('phone')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Input id="bio" {...register('bio')} />
            </div>
            <Button type="submit" disabled={!isDirty || updateProfile.isPending}>
              {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
