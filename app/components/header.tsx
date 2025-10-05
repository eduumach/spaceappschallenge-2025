import { ThemeToggle } from "~/components/theme-toggle"
import { LanguageSelector } from "~/components/language-selector"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full flex h-16 items-center justify-between pl-4 pr-2">
        <div className="flex items-center space-x-3">
          <img
            src="/queijo.png"
            alt="Queijo Logo"
            className="h-8 w-8] ml-2"
          />
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent" >
             Code and Cheese
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSelector />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
