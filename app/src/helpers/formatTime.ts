export const formatTime = (date: Date) => {
  const year = date.getFullYear().toString().padStart(4, '0')
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`
}