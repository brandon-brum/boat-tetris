// eslint-disable-next-line no-unused-vars
const getRandomFrom = arr => {
  if (typeof (arr[0]) === 'undefined') { arr = Object.values(arr) }
  return arr[Math.floor(Math.random() * arr.length)]
}
// eslint-disable-next-line no-unused-vars
const mod = (n, m) => ((n % m) + m) % m
