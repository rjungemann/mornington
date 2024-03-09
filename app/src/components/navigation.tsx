import Link from "next/link"

export const Navigation = () => {
  return (
    <nav className="flex items-center justify-between flex-wrap p-6">
      <div className="flex items-center flex-shrink-0 mr-6">
        <span className="font-semibold text-xl text-sky-500 tracking-tight font-semibold bg-slate-200 text-slate-800 p-4 pt-2 pb-2 inline-block">Mornington</span>
      </div>
      
      <div className="w-full block flex-grow lg:flex lg:items-center lg:w-auto mt-2 lg:mt-0">
        <div className="text-sm font-semibold lg:flex-grow">
          <Link href="/games" className="block mt-4 lg:inline-block lg:mt-0 opacity-60 hover:opacity-100 mr-4">
            Games
          </Link>
          <Link href="/about" className="block mt-4 lg:inline-block lg:mt-0 opacity-60 hover:opacity-100 mr-4">
            About
          </Link>
        </div>
      </div>
    </nav>
  )
}