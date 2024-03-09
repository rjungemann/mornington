import Link from "next/link"
import Image from 'next/image'
import logo from '../app/logo.svg'

export const Navigation = () => {
  return (
    <nav className="p-4 pt-6 pb-6">
      <span className="inline-block font-semibold text-xl text-sky-500 tracking-tight font-semibold text-slate-800">
        {/* Mornington */}
        <Image priority src={logo} alt="Logo for Mornington" style={{ height: 220/4, width: 920/4 }} />
      </span>
    </nav>
  )
}