'use client';

import { ArrowUpRight, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useState } from 'react';

export interface StatItem {
  title: string;
  value: string | number;
  increase?: string;
  subtitle?: string;
  accent?: boolean;
}

export function StatsCards({ stats }: { stats: StatItem[] }) {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card
          key={stat.title}
          onMouseEnter={() => setHoveredCard(index)}
          onMouseLeave={() => setHoveredCard(null)}
          style={{ animationDelay: `${index * 100}ms` }}
          className={`animate-slide-in-up p-4 transition-all duration-500 ease-out ${
            stat.accent ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground'
          } ${hoveredCard === index ? 'scale-105 shadow-2xl' : 'shadow-lg'}`}
        >
          <div className="mb-3 flex items-start justify-between">
            <h3 className="text-xs font-medium opacity-90">{stat.title}</h3>
            <div
              className={`h-6 w-6 rounded-full ${
                stat.accent ? 'bg-primary-foreground/20' : 'bg-primary'
              } flex items-center justify-center transition-transform duration-300 ${
                hoveredCard === index ? 'rotate-45' : ''
              }`}
            >
              <ArrowUpRight
                className={`h-3 w-3 ${
                  stat.accent ? 'text-primary-foreground' : 'text-primary-foreground'
                }`}
              />
            </div>
          </div>
          <p className="mb-2 text-3xl font-bold">{stat.value}</p>
          <div className="flex items-center gap-1.5 text-xs opacity-80">
            {stat.increase && (
              <>
                <TrendingUp className="h-3 w-3" />
                <span>{stat.increase}</span>
              </>
            )}
            {stat.subtitle && <span>{stat.subtitle}</span>}
          </div>
        </Card>
      ))}
    </div>
  );
}
