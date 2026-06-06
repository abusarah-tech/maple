import { useTheme } from "@maple/ui/hooks/use-theme"
import { Switch } from "@maple/ui/components/ui/switch"
import { MoonIcon, SunIcon } from "@/components/icons"

/**
 * "Dark mode" row for the user dropdown menu — a binary light/dark Switch.
 *
 * Rendered as a plain row (not a `DropdownMenuItem`) on purpose: Base UI menu
 * items close the menu on click, which would dismiss the dropdown every time
 * the switch is flipped. The icon reflects the active theme; the switch is on
 * when dark mode is active.
 */
export function ThemeToggle() {
	const { theme, setTheme } = useTheme()
	const isDark = theme === "dark"

	return (
		<div className="flex items-center gap-2 rounded-md px-2 py-2 text-xs select-none">
			{isDark ? (
				<MoonIcon size={16} className="shrink-0 text-muted-foreground" />
			) : (
				<SunIcon size={16} className="shrink-0 text-muted-foreground" />
			)}
			<span>Dark mode</span>
			<Switch
				className="ml-auto"
				checked={isDark}
				onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
				aria-label="Toggle dark mode"
			/>
		</div>
	)
}
