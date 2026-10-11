import React from 'react';
import { Activity } from '../types/index.ts';

interface ActivityFeedProps {
  activities: Activity[];
}

function formatActivityDate(dateStr: string): { date: string; time: string } {
  try {
    const d = new Date(dateStr);
    const date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    return { date, time };
  } catch {
    return { date: dateStr, time: '' };
  }
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="py-12 text-center border border-dashed border-neutral-200 rounded-lg">
        <p className="text-xs text-neutral-500">No project activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-lg divide-y divide-neutral-100 overflow-hidden">
      {activities.map((act) => {
        const { date, time } = formatActivityDate(act.created_at);
        return (
          <div
            key={act.id}
            className="p-3.5 sm:px-5 sm:py-3 hover:bg-neutral-50/60 transition-colors flex items-start sm:items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="w-7 h-7 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-xs font-semibold text-neutral-700 shrink-0">
                {act.user_name ? act.user_name.charAt(0).toUpperCase() : 'U'}
              </div>

              <div className="min-w-0">
                <p className="text-neutral-900 leading-snug">
                  <span className="font-semibold text-neutral-950">{act.user_name}</span>{' '}
                  <span className="text-neutral-600">{act.action}</span>
                  {act.task_title && (
                    <span className="text-neutral-900 font-medium"> "{act.task_title}"</span>
                  )}
                </p>
                {act.details && (
                  <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                    {act.details}
                  </p>
                )}
              </div>
            </div>

            <div className="text-right text-[11px] text-neutral-400 shrink-0 font-mono flex flex-col sm:flex-row sm:gap-2">
              <span>{date}</span>
              {time && <span className="text-neutral-400">{time}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
