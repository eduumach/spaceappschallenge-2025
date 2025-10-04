import { Moon, Sun } from "lucide-react"
import { Button } from "~/components/ui/button"
import { useTheme } from "~/components/theme-provider"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark")
    } else if (theme === "dark") {
      setTheme("light")
    } else {
      setTheme("light")
    }
  }

  const getIcon = () => {
    if (theme === "dark") {
      return <Moon className="h-4 w-4" />
    } else if (theme === "light") {
      return <Sun className="h-4 w-4" />
    } else {
      return <Sun className="h-4 w-4" />
    }
  }

  const getTooltipText = () => {
    if (theme === "light") {
      return "Mudar para tema escuro"
    } else if (theme === "dark") {
      return "Mudar para tema do sistema"
    } else {
      return "Mudar para tema claro"
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      title={getTooltipText()}
      className="relative"
    >
      {getIcon()}
      <span className="sr-only">{getTooltipText()}</span>
    </Button>
  )
}
