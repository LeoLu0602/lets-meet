export default function Schedule() {
  return (
    <section>
      <section className='fixed left-0 top-12 z-10 flex h-12 w-full justify-around'>
        {[' ', 'S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
          <span className='flex h-full w-[12.5%] items-center justify-center bg-zinc-800 font-bold'>
            {day}
          </span>
        ))}
      </section>
      <section className='mt-24'>
        {new Array(24).fill(null).map((row, i) => (
          <div className='flex h-16 w-screen border-b-2 first:border-t-2'>
            {new Array(8).fill(null).map((col, j) => (
              <div className='h-full w-[12.8%] cursor-pointer border-r-2 last:border-0'></div>
            ))}
          </div>
        ))}
      </section>
    </section>
  );
}
