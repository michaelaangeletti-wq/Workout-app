import type { StreakDay } from '../lib/sessionStats'

const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'R', 'F', 'S']

export function WeekStreak({ days }: { days: StreakDay[] }) {
  return (
    <div className="flex justify-between gap-1">
      {days.map((day, i) => (
        <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[10px] font-medium text-slate-500">{WEEKDAY_LETTERS[i]}</span>
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
              day.hasSession ? 'bg-sky-400 text-slate-950' : 'bg-slate-800 text-slate-500'
            } ${day.isToday ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-900' : ''}`}
          >
            {day.hasSession ? '✓' : ''}
          </div>
        </div>
      ))}
    </div>
  )
}
