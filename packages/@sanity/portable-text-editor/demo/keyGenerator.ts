let key = 0

export const keyGenerator = () => {
  return `${new Date().getTime()}-${key++}`
}
