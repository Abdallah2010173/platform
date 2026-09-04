import Image from 'next/image';
import Link from 'next/link';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  link?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-12 w-12',
  md: 'h-16 w-16',
  lg: 'h-24 w-24',
} as const;

export function BrandLogo({ size = 'md', link = true, className = '' }: BrandLogoProps) {
  const content = (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src="/logo.png"
        alt="Global Math"
        width={size === 'lg' ? 96 : size === 'md' ? 64 : 48}
        height={size === 'lg' ? 96 : size === 'md' ? 64 : 48}
        className={`${sizeClasses[size]} rounded-full object-cover shadow-sm`}
        priority={size !== 'sm'}
      />
      <span className="text-foreground font-semibold">Global Math</span>
    </span>
  );

  return link ? <Link href="/">{content}</Link> : content;
}