// components/ui/Button.tsx
import Link from 'next/link'
import { cn } from '@/lib/cn'

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'outline' | 'ghost'
  size?: 'sm' | 'md'
  href?: string
}

export default function Button({
  variant = 'primary',
  size = 'md',
  href,
  className,
  children,
  ...rest
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'

  const sizeStyles =
    size === 'sm'
      ? 'px-3 py-1.5 text-sm'
      : 'px-4 py-2 text-base'

  const variantStyles =
    variant === 'primary'
      ? 'bg-[#f1861e] text-white hover:bg-orange-600 focus-visible:ring-[#f1861e]'
      : variant === 'outline'
      ? 'border border-[#f1861e] text-[#f1861e] hover:bg-[#f1861e]/10 focus-visible:ring-[#f1861e]'
      : 'text-gray-600 hover:bg-gray-100 focus-visible:ring-gray-300'

  const cls = cn(baseStyles, sizeStyles, variantStyles, className)

  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    )
  }

  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  )
}
