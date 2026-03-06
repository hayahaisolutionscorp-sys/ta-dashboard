"use client";

import { IconCalendar } from "@tabler/icons-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { AvailableDateItem } from "@/constants/types/booking.types";

interface AvailableDatesProps {
  dates: AvailableDateItem[];
  isLoading: boolean;
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

function formatDateLabel(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`);
  const day = date.getDate();
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
  const month = date.toLocaleDateString("en-US", { month: "short" });
  return { day, weekday, month };
}

export default function AvailableDates({
  dates,
  isLoading,
  selectedDate,
  onDateSelect,
}: AvailableDatesProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground">
          <IconCalendar className="h-4 w-4" />
          Loading available dates...
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={`skeleton-${i}`}
              className="h-18 w-16 sm:h-20 sm:w-18 shrink-0 rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  if (dates.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground py-2">
        <IconCalendar className="h-4 w-4" />
        No available dates found for this route.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-muted-foreground">
        <IconCalendar className="h-4 w-4" />
        Available Dates ({dates.length})
      </div>
      {/* Negative margin + padding trick for edge-to-edge scrolling on mobile */}
      <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-none snap-x snap-mandatory">
        {dates.map((item) => {
          const { day, weekday, month } = formatDateLabel(item.date);
          const isSelected = selectedDate === item.date;

          return (
            <button
              key={item.date}
              type="button"
              onClick={() => onDateSelect(item.date)}
              className={`flex flex-col items-center justify-center shrink-0 w-16 h-18 sm:w-18 sm:h-20 rounded-lg border-2 transition-all cursor-pointer snap-start ${
                isSelected
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 shadow-sm"
                  : "border-border hover:border-blue-300 hover:bg-accent"
              }`}
            >
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wide font-medium opacity-70">
                {weekday}
              </span>
              <span className="text-base sm:text-lg font-bold leading-tight">
                {day}
              </span>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-wide opacity-70">
                {month}
              </span>
              <span
                className={`text-[8px] sm:text-[9px] mt-0.5 ${isSelected ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"}`}
              >
                {item.trip_count} trip{item.trip_count !== 1 ? "s" : ""}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
