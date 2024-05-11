'use client';

import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import clsx from 'clsx';

export default function Schedule({
  supabase,
  userId,
  groupId,
  availableTimeSlots,
  setAvailableTimeSlots,
  isUserSelected,
}: {
  supabase: SupabaseClient<any, 'public', any>;
  userId: string | null;
  groupId: string;
  availableTimeSlots: string[];
  setAvailableTimeSlots: Function;
  isUserSelected: boolean;
}) {
  function handleClick(
    i: number,
    j: number,
    userId: string,
    groupId: string
  ): void {
    const timeSlot: string = `${i},${j}`;
    const isTimeSlotAvailable: boolean = new Set(availableTimeSlots).has(
      timeSlot
    );
    const newAvailableTimeSlots: string[] = isTimeSlotAvailable
      ? [...availableTimeSlots].filter((slot) => slot !== timeSlot)
      : [...availableTimeSlots, timeSlot];

    setAvailableTimeSlots(newAvailableTimeSlots);
    updateAvailableTimeSlots(newAvailableTimeSlots, userId, groupId);
  }

  async function updateAvailableTimeSlots(
    availableTimeSlots: string[],
    userId: string,
    groupId: string
  ): Promise<void> {
    const { error }: { error: PostgrestError | null } = await supabase
      .from('group_user')
      .update({ available_time_slots: availableTimeSlots })
      .eq('user_id', userId)
      .eq('group_id', groupId)
      .select();

    if (error) {
      console.error('Update Available Time Slots Error: ', error);
      alert('Update Available Time Slots Error');
    }
  }

  return (
    <>
      <section className='sticky left-0 top-24 z-10 flex h-12 w-full justify-around bg-zinc-800'>
        {[' ', 'S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <span
            key={i}
            className={clsx(
              'flex h-full w-[12.5%] items-center justify-center font-bold'
            )}
          >
            {day}
          </span>
        ))}
      </section>

      <section className='my-4'>
        {new Array(24).fill(null).map((row, i) => (
          <div key={i} className='flex h-16 w-full'>
            {new Array(8).fill(null).map((col, j) => (
              <div
                key={j}
                className={clsx(
                  'relative h-full w-[12.5%] cursor-pointer border-r-2 border-t-2 first:cursor-default first:border-t-0',
                  {
                    'bg-emerald-500': new Set(availableTimeSlots).has(
                      `${i},${j}`
                    ),
                    'border-b-2': i === 23 && j > 0,
                  }
                )}
                onClick={() => {
                  if (j > 0 && userId && isUserSelected) {
                    handleClick(i, j, userId, groupId);
                  }
                }}
              >
                {j === 0 && (
                  <span className='absolute -top-2 left-0 flex h-4 w-full items-center justify-center text-xs'>
                    {i.toString().padStart(2, '0')}:00
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}
      </section>
    </>
  );
}
