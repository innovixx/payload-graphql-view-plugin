export const toSingularString = (str: string): string => {
  const lastChar = str.slice(-1)
  if (lastChar === 's') {
    return str.slice(0, -1)
  }
  return str
}
