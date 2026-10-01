import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonStyles = cva('ui-button', {
  variants: {
    variant: { default: 'ui-button-primary', outline: 'ui-button-outline', ghost: 'ui-button-ghost' },
    size: { default: 'ui-button-default', sm: 'ui-button-small', icon: 'ui-button-icon' },
  },
  defaultVariants: { variant: 'default', size: 'default' },
})

export function Button({ className, variant, size, ...props }) {
  return <button className={cn(buttonStyles({ variant, size }), className)} {...props} />
}