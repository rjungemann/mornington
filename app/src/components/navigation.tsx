import Link from "next/link"
import Image from 'next/image'
import logo from '../app/logo.svg'
import logo2 from '../app/logo-2.svg'

export const Navigation = () => {
  return (
    <nav className="p-4 pt-8 pb-0">
      <Link href="/" className="inline-block font-semibold text-2xl text-blue-500 tracking-tight font-semibold text-slate-800">
        {/* Mornington */}
        {/* <Image priority src={logo} alt="Logo for Mornington" style={{ height: 220/5, width: 920/5 }} /> */}
        <Image priority src={logo2} alt="Logo for Mornington" style={{ height: 220/5, width: 1210/5 }} />
      </Link>
    </nav>
  )
}