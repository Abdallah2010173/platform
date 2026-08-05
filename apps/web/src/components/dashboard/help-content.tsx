'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const FAQS = [
  {
    q: 'How do I get support?',
    a: 'You can reach our support team through the messaging system or by emailing support@platform.local.',
  },
  {
    q: 'How do I reset my password?',
    a: 'Use the "Forgot Password" link on the login page and follow the instructions sent to your email.',
  },
  {
    q: 'How do I change my profile settings?',
    a: 'Navigate to Settings from the sidebar to update your appearance, theme, and notification preferences.',
  },
];

export function HelpContent() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Help Center</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Find answers to common questions below. If you need further assistance, reach out to our
            support team.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {FAQS.map((item, i) => (
          <Card key={i} className="overflow-hidden">
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between p-4 text-left"
            >
              <span className="text-sm font-medium">{item.q}</span>
              <ChevronDown
                className={cn(
                  'text-muted-foreground h-4 w-4 transition-transform',
                  open === i && 'rotate-180',
                )}
              />
            </button>
            {open === i && (
              <CardContent className="text-muted-foreground border-t pt-3 text-sm">
                {item.a}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
