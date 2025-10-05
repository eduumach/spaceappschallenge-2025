import { Moon, Sun } from "lucide-react"
import { Button } from "~/components/ui/button"
import { useTheme } from "~/components/theme-provider"
import { useTranslation } from "~/i18n"
import { useMounted } from "~/lib/utils"
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation('common')
  const mounted = useMounted()
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
      return t("theme.toggle.to_dark")
    } else if (theme === "dark") {
      return t("theme.toggle.to_light")
    } else {
      return t("theme.toggle.to_system")
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      title={!mounted ? "" : getTooltipText()}
      className="relative"
    >
      {getIcon()}
      <span className="sr-only">{!mounted ? "" : getTooltipText()}</span>
    </Button>
  )
}
