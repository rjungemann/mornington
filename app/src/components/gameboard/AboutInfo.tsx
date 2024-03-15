
const AboutInfo = () => {
  return (
    <div className='bg-slate-800 mt-4 p-4'>
      <h2 className="text-2xl text-sky-500 font-semibold mt-4 mb-4">About Minstowe Circle</h2>
      <div className="opacity-80 mb-4">
        <p className="mb-2">
          Minstowe Circle is a subway simulator and game inspired by a certain BBC Radio show.
        </p>
        <p className="mb-2">
          <a className="text-lime-400 opacity-80 hover:opacity-100" href="https://phasor.space/Articles/Other+Articles/Introducing+Minstowe+Circle">Read the introductory blog post.</a>
        </p>
        <p className="mb-2">
          It was created by <a className="text-lime-400 opacity-80 hover:opacity-100" href="https://phasor.space">Phasor Space</a>.
        </p>
        <p className="mb-2">
          The code can be found on <a className="text-lime-400 opacity-80 hover:opacity-100" href="https://github.com/rjungemann/mornington">GitHub</a>.
        </p>
      </div>
    </div>
  )
}

export { AboutInfo }