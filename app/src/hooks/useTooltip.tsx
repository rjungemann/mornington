import { useEffect } from "react"

export const useTooltip = () => {
  useEffect(() => {
    const element = document.createElement('div')
    element.classList.add('bg-slate-800', 'text-slate-200', 'p-2', 'text-xs')
    element.id = 'tooltip'
    element.style.pointerEvents = 'none'
    element.style.position = 'absolute'
    element.style.opacity = '0%'
    document.body.appendChild(element)
    return () => {
      document.body.removeChild(element)
    }
  }, [])
  return true
}