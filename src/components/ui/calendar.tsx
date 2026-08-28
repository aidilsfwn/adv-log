import { DayPicker } from 'react-day-picker'
import { cn } from '@/lib/utils'

export function Calendar({ className, ...props }: React.ComponentProps<typeof DayPicker>) {
  return <DayPicker className={cn('p-3', className)} classNames={{ month_caption: 'flex justify-center py-2 font-medium', nav: 'flex items-center gap-1', button_previous: 'absolute left-2 top-2 size-8 rounded-md hover:bg-muted', button_next: 'absolute right-2 top-2 size-8 rounded-md hover:bg-muted', month_grid: 'w-full border-collapse', weekdays: 'flex', weekday: 'w-9 text-center text-xs text-muted-foreground', week: 'mt-1 flex w-full', day: 'size-9 p-0 text-center text-sm', day_button: 'size-9 rounded-md hover:bg-muted', selected: 'bg-primary text-primary-foreground hover:bg-primary', today: 'font-bold underline', outside: 'text-muted-foreground opacity-50' }} {...props} />
}
