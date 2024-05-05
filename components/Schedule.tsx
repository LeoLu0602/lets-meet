export default function Schedule() {
  return (
    <section className='relative flex h-auto w-full overflow-auto'>
      <section className='fixed left-0 top-[5vh] flex h-6 w-full justify-around'>
        {[' ', 'S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
          <div className='flex h-8 w-[12.5%] items-center justify-center'>
            {day}
          </div>
        ))}
      </section>
      <section></section>
    </section>
  );
}
