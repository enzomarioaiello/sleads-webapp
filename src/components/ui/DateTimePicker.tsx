"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  date: Date | undefined;
  time: string;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (time: string) => void;
  dateLabel?: string;
  timeLabel?: string;
  dateId?: string;
  timeId?: string;
  required?: boolean;
  minDate?: Date;
  className?: string;
  disabled?: boolean;
}

export function DateTimePicker({
  date,
  time,
  onDateChange,
  onTimeChange,
  dateLabel = "Date",
  timeLabel = "Time",
  dateId,
  timeId,
  required = false,
  minDate,
  className,
  disabled = false,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className={cn("flex gap-4", className)}>
      <div className="flex flex-col gap-2 flex-1">
        <Label htmlFor={dateId} className="text-sm font-medium">
          {dateLabel} {required && <span className="text-red-500">*</span>}
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id={dateId}
              disabled={disabled}
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(selectedDate) => {
                onDateChange(selectedDate);
                setOpen(false);
              }}
              initialFocus
              disabled={
                disabled
                  ? () => true
                  : minDate
                    ? (date) => {
                        const dateOnly = new Date(
                          date.getFullYear(),
                          date.getMonth(),
                          date.getDate()
                        );
                        const minDateOnly = new Date(
                          minDate.getFullYear(),
                          minDate.getMonth(),
                          minDate.getDate()
                        );
                        return dateOnly < minDateOnly;
                      }
                    : undefined
              }
              captionLayout="dropdown"
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-col gap-2 flex-1">
        <Label htmlFor={timeId} className="text-sm font-medium">
          {timeLabel} {required && <span className="text-red-500">*</span>}
        </Label>
        <Input
          type="time"
          id={timeId}
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
          step="300"
          required={required}
          disabled={disabled}
          className="bg-background text-slate-900 font-semibold text-lg h-10 border-slate-300 dark:text-white dark:bg-sleads-slate800 dark:border-sleads-slate700 dark:placeholder:text-sleads-slate400 placeholder:text-slate-400"
        />
      </div>
    </div>
  );
}
