// Example of custom keyGenerator

let key = 0

export const keyGenerator = (): string => {
  return `${new Date().getTime()}-${key++}`
}
