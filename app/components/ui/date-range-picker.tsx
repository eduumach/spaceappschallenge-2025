import * as React from "react"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Card, CardContent } from "~/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "~/components/ui/dialog"
import { cn } from "~/lib/utils"

export interface DateRange {
  from?: Date | undefined
  to?: Date | undefined
}

interface DateRangePickerProps {
  dateRange?: DateRange
  onDateRangeChange?: (range: DateRange | undefined) => void
  disabled?: boolean
  children?: React.ReactNode
  placeholder?: string
}

function getDaysInMonth(date: Date): Date[] {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days: Date[] = []

  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push(new Date(year, month, -firstDay.getDay() + i + 1))
  }

  
  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day))
  }

  return days
}


function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}


function isInRange(date: Date, from: Date | undefined, to: Date | undefined): boolean {
  if (!from || !to) return false
  return date >= from && date <= to
}

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  disabled = false,
  children,
  placeholder = "Selecionar período"
}: DateRangePickerProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date())
  const [isOpen, setIsOpen] = React.useState(false)
  const [tempRange, setTempRange] = React.useState<DateRange | undefined>(dateRange)

  const handleDateClick = (date: Date) => {
    if (disabled) return

    const newRange: DateRange = { ...tempRange }

    if (!newRange.from || (newRange.from && newRange.to)) {
      
      newRange.from = date
      newRange.to = undefined
    } else if (newRange.from && !newRange.to) {
      
      if (date < newRange.from) {
        newRange.to = newRange.from
        newRange.from = date
      } else {
        newRange.to = date
      }
    }

    setTempRange(newRange)
  }

  const handleApply = () => {
    onDateRangeChange?.(tempRange)
    setIsOpen(false)
  }

  const handleCancel = () => {
    setTempRange(dateRange)
    setIsOpen(false)
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const formatDateRange = (range: DateRange | undefined) => {
    if (!range?.from) return placeholder
    if (!range.to) return range.from.toLocaleDateString('pt-BR')
    return `${range.from.toLocaleDateString('pt-BR')} - ${range.to.toLocaleDateString('pt-BR')}`
  }

  const days = getDaysInMonth(currentMonth)
  const today = new Date()

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !dateRange?.from && "text-muted-foreground"
            )}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {formatDateRange(dateRange)}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] z-[10001]">
        <div className="space-y-4">
          
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
              disabled={disabled}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <h3 className="text-lg font-semibold">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
              disabled={disabled}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          
          <Card>
            <CardContent className="p-4">
              
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map(day => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                    {day}
                  </div>
                ))}
              </div>

              
              <div className="grid grid-cols-7 gap-1">
                {days.map((date, index) => {
                  const isCurrentMonth = date.getMonth() === currentMonth.getMonth()
                  const isToday = isSameDay(date, today)
                  const isSelected = tempRange?.from && isSameDay(date, tempRange.from) ||
                                   tempRange?.to && isSameDay(date, tempRange.to)
                  const isInSelectedRange = isInRange(date, tempRange?.from, tempRange?.to)
                  const isPastDate = date > today

                  return (
                    <Button
                      key={index}
                      variant={isSelected ? "default" : "ghost"}
                      size="sm"
                      disabled={disabled || !isCurrentMonth || isPastDate}
                      onClick={() => handleDateClick(date)}
                      className={cn(
                        "h-9 w-full p-0 font-normal",
                        !isCurrentMonth && "text-muted-foreground opacity-50",
                        isToday && !isSelected && "border border-primary",
                        isInSelectedRange && !isSelected && "bg-primary/10",
                        isPastDate && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {date.getDate()}
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          
          {tempRange?.from && (
            <div className="text-sm text-muted-foreground text-center">
              {tempRange.to ? (
                <span>
                  Período selecionado: <strong>{formatDateRange(tempRange)}</strong>
                </span>
              ) : (
                <span>
                  Data de início: <strong>{tempRange.from.toLocaleDateString('pt-BR')}</strong>
                  <br />
                  Selecione a data de fim
                </span>
              )}
            </div>
          )}

          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button 
              onClick={handleApply}
              disabled={!tempRange?.from || !tempRange?.to}
            >
              Aplicar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
