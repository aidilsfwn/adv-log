import { Popover as PopoverPrimitive } from '@base-ui/react/popover'
import { cn } from '@/lib/utils'

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger
function PopoverContent({ className, ...props }: PopoverPrimitive.Popup.Props) { return <PopoverPrimitive.Portal><PopoverPrimitive.Positioner sideOffset={6} className="z-50"><PopoverPrimitive.Popup className={cn('rounded-lg border bg-popover p-1 text-popover-foreground shadow-md', className)} {...props} /></PopoverPrimitive.Positioner></PopoverPrimitive.Portal> }
export { Popover, PopoverTrigger, PopoverContent }
