'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { SupabaseClient } from '@supabase/supabase-js';

export default function Schedule({
  supabase,
  userId,
}: {
  supabase: SupabaseClient<any, 'public', any>;
  userId: string | null;
}) {
  const [availableTimeSlot, setAvailableTimeSlot] = useState<Set<string>>(
    new Set()
  );

  async function handleClick(i: number, j: number): Promise<void> {
    const timeSlot: string = `${i},${j}`;
    const newAvailableTimeSlot: Set<string> = new Set(availableTimeSlot);

    if (newAvailableTimeSlot.has(timeSlot)) {
      newAvailableTimeSlot.delete(timeSlot);
    } else {
      newAvailableTimeSlot.add(timeSlot);
    }

    setAvailableTimeSlot(newAvailableTimeSlot);
  }

  return (
    <section>
      <section className='fixed left-0 top-12 z-10 flex h-12 w-full justify-around bg-zinc-800'>
        {[' ', 'S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <span
            key={i}
            className='flex h-full w-[12.5%] items-center justify-center font-bold'
          >
            {day}
          </span>
        ))}
      </section>
      <section className='mt-28'>
        {new Array(24).fill(null).map((row, i) => (
          <div key={i} className='flex h-16 w-screen'>
            {new Array(8).fill(null).map((col, j) => (
              <div
                key={j}
                className={clsx(
                  'relative h-full w-[12.8%] cursor-pointer border-r-2 border-t-2 first:cursor-default first:border-0 last:border-r-0',
                  {
                    'bg-emerald-500': availableTimeSlot.has(`${i},${j}`),
                  }
                )}
                onClick={() => {
                  if (j > 0) {
                    handleClick(i, j);
                  }
                }}
              >
                {j === 0 && (
                  <span className='left-0flex absolute -top-2 flex w-full items-center justify-center text-xs'>
                    {i.toString().padStart(2, '0')}:00
                  </span>
                )}
              </div>
            ))}
          </div>
        ))}
      </section>
    </section>
  );
}
