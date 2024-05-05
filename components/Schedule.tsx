export default function Schedule() {
  return (
    <section className='relative h-auto w-full overflow-auto'>
      <section className='fixed left-0 top-12 flex h-12 w-full justify-around'>
        {[' ', 'S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
          <span className='flex h-full w-[12.5%] items-center justify-center font-bold'>
            {day}
          </span>
        ))}
      </section>
      <section></section>
    </section>
  );
}
