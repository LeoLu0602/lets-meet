'use client';

import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import clsx from 'clsx';

export default function Schedule({
  supabase,
  userId,
  groupId,
  blueSlots,
  greenSlots,
  setGreenSlots,
  isUserSelected,
  isAllSelected,
}: {
  supabase: SupabaseClient<any, 'public', any>;
  userId: string | null;
  groupId: string;
  blueSlots: string[];
  greenSlots: string[];
  setGreenSlots: Function;
  isUserSelected: boolean;
  isAllSelected: boolean;
}) {
  const greenSlotsSet = new Set(greenSlots);
  const blueSlotsSet: Set<string> = new Set(blueSlots);

  async function handleClick(
    i: number,
    j: number,
    userId: string,
    groupId: string
  ): Promise<void> {
    const newGreenSlotsSet: Set<string> = new Set(greenSlots);

    if (j === 0) {
      // row selection
      for (let d = 1; d <= 7; d++) {
        newGreenSlotsSet.add(`${i},${d}`);
      }
    } else {
      const timeSlot: string = `${i},${j}`;
      const isTimeSlotAvailable: boolean = newGreenSlotsSet.has(timeSlot);

      if (isTimeSlotAvailable) {
        newGreenSlotsSet.delete(timeSlot);
      } else {
        newGreenSlotsSet.add(timeSlot);
      }
    }

    const newGreenSlots: string[] = Array.from(newGreenSlotsSet);

    // update available time slots on the client side first and on the server side later
    setGreenSlots(newGreenSlots);
    await updateAvailableTimeSlots(newGreenSlots, userId, groupId);
  }

  async function handleColumnSelection(
    col: number,
    userId: string,
    groupId: string
  ): Promise<void> {
    const newGreenSlotsSet: Set<string> = new Set(greenSlots);

    for (let i = 0; i < 24; i++) {
      newGreenSlotsSet.add(`${i},${col}`);
    }

    const newGreenSlots: string[] = Array.from(newGreenSlotsSet);

    // update available time slots on the client side first and on the server side later
    setGreenSlots(newGreenSlots);
    await updateAvailableTimeSlots(newGreenSlots, userId, groupId);
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
      <section className='sticky left-0 top-0 z-10 flex h-12 w-full justify-around bg-zinc-800'>
        {[' ', 'S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <span
            className={clsx(
              'flex h-full w-[12.5%] items-center justify-center font-bold',
              { 'cursor-pointer': i > 0 }
            )}
            key={i}
            onClick={() => {
              if (userId && isUserSelected && i > 0) {
                handleColumnSelection(i, userId, groupId);
              }
            }}
          >
            {day}
          </span>
        ))}
      </section>

      <section className='my-4'>
        {new Array(24).fill(null).map((row, i) => (
          <section key={i} className='flex h-16 w-full'>
            {new Array(8).fill(null).map((col, j) => (
              <section
                className={clsx(
                  'relative h-full w-[12.5%] cursor-pointer border-r-2 border-t-2 first:border-t-0',
                  {
                    'bg-emerald-500':
                      greenSlotsSet.has(`${i},${j}`) && isUserSelected,
                    'bg-emerald-700':
                      greenSlotsSet.has(`${i},${j}`) && !isUserSelected,
                    'bg-sky-500':
                      isAllSelected && blueSlotsSet.has(`${i},${j}`),
                    'border-b-2': i === 23 && j > 0,
                  }
                )}
                key={j}
                onClick={() => {
                  if (userId && isUserSelected) {
                    handleClick(i, j, userId, groupId);
                  }
                }}
              >
                {j === 0 && (
                  <span className='absolute -top-2 left-0 flex h-4 w-full items-center justify-center text-xs'>
                    {i.toString().padStart(2, '0')}:00
                  </span>
                )}
              </section>
            ))}
          </section>
        ))}
      </section>
    </>
  );
}
