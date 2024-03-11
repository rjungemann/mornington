const dateToHoroscopeSign = (date: Date) => {
  const datestamp = `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
  const pairs: [string, string, string, string, string][] = [
    ['01-01', '01-19', 'capricorn', 'Capricorn', '♑︎'],
    ['01-20', '02-18', 'aquarius', 'Aquarius', '♒︎'],
    ['02-19', '03-20', 'pisces', 'Pisces', '♓︎'],
    ['03-21', '04-19', 'aries', 'Aries', '♈︎'],
    ['04-20', '05-20', 'taurus', 'Taurus', '♉︎'],
    ['05-21', '06-20', 'gemini', 'Gemini', '♊︎'],
    ['06-21', '07-22', 'cancer', 'Cancer', '♋︎'],
    ['07-23', '08-22', 'leo', 'Leo', '♌︎'],
    ['08-23', '09-22', 'virgo', 'Virgo', '♍︎'],
    ['09-23', '10-22', 'libra', 'Libra', '♎︎'],
    ['10-23', '11-21', 'scorpio', 'Scorpio', '♏︎'],
    ['11-22', '12-21', 'saggitarius', 'Saggitarius', '♐︎'],
    ['12-22', '12-31', 'capricorn', 'Capricorn', '♑︎'],
  ]
  for (let i = 0; i < pairs.length; i++) {
    const [start, end, name, title, sign] = pairs[i]
    if (datestamp >= start && datestamp <= end) {
      return [name, title, sign]
    }
  }
  return []
}

export { dateToHoroscopeSign }