const color = {
  reset: "\x1b[0m",

  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",

  bold: "\x1b[1m",
  underline: "\x1b[4m"
} as const;


type Color = keyof Omit<typeof color, "reset">;
const colors = Object.fromEntries(
  Object.entries(color)
    .filter(([key]) => key !== "reset")
    .map(([key, value]) => [
      key,
      (text: string) => `${value}${text}${color.reset}`
    ])
) as Record<Color, (text: string) => string>;

export { color, colors };