// /components/ui/Card.tsx
import { cn } from '@/lib/cn'

export function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props
  return <div className={cn('card', className)} {...rest} />
}

export function CardBody(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props
  return <div className={cn('card-body', className)} {...rest} />
}
