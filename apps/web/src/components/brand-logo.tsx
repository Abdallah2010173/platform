import Image from 'next/image';
import Link from 'next/link';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  link?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
} as const;

export function BrandLogo({ size = 'md', link = true, className = '' }: BrandLogoProps) {
  const content = (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src="/logo.png"
        alt="Global Math"
        width={size === 'lg' ? 56 : size === 'md' ? 40 : 32}
        height={size === 'lg' ? 56 : size === 'md' ? 40 : 32}
        className={`${sizeClasses[size]} rounded-full object-cover shadow-sm`}
        priority={size !== 'sm'}
      />
      <span className="text-foreground font-semibold">Global Math</span>
    </span>
  );

  return link ? <Link href="/">{content}</Link> : content;
}