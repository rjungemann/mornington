import { MouseEvent } from "react"

export const useTooltipMessage = (message: string) => {
  const onMouseEnter = (e: MouseEvent) => {
    const tooltip = document.getElementById('tooltip')
    if (!tooltip) {
      return
    }
    tooltip.style.opacity = '100%'
  }

  const onMouseMove = (e: MouseEvent) => {
    const tooltip = document.getElementById('tooltip')
    if (!tooltip) {
      return
    }
    tooltip.style.left = `${e.pageX + 10}px`
    tooltip.style.top = `${e.pageY + 10}px`
    tooltip.style.opacity = '100%'
    tooltip.textContent = message
  }

  const onMouseOut = (e: MouseEvent) => {
    const tooltip = document.getElementById('tooltip')
    if (!tooltip) {
      return
    }
    tooltip.style.opacity = '0%'
  }

  return { onMouseEnter, onMouseMove, onMouseOut }
}