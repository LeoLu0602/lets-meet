export default function Schedule() {
  return (
    <section>
      <section className='fixed left-0 top-12 z-10 flex h-12 w-full justify-around bg-zinc-800'>
        {[' ', 'S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
          <span className='flex h-full w-[12.5%] items-center justify-center font-bold'>
            {day}
          </span>
        ))}
      </section>
      <section className='mt-28'>
        {new Array(24).fill(null).map((row, i) => (
          <div className='flex h-16 w-screen'>
            {new Array(8).fill(null).map((col, j) => (
              <div className='relative h-full w-[12.8%] cursor-pointer border-r-2 border-t-2 first:border-0 last:border-r-0'>
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
