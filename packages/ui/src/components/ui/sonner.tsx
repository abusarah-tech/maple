import { Toaster as Sonner, type ToasterProps } from "sonner"
import { useTheme } from "../../hooks/use-theme"
import { CircleCheckIcon, CircleInfoIcon, AlertWarningIcon, CircleXmarkIcon, LoaderIcon } from "../icons"

const Toaster = ({ ...props }: ToasterProps) => {
	const { theme } = useTheme()

	return (
		<Sonner
			theme={theme as ToasterProps["theme"]}
			className="toaster group"
			icons={{
				success: <CircleCheckIcon strokeWidth={2} className="size-4" />,
				info: <CircleInfoIcon strokeWidth={2} className="size-4" />,
				warning: <AlertWarningIcon strokeWidth={2} className="size-4" />,
				error: <CircleXmarkIcon strokeWidth={2} className="size-4" />,
				loading: <LoaderIcon strokeWidth={2} className="size-4 animate-spin" />,
			}}
			style={
				{
					"--normal-bg": "var(--popover)",
					"--normal-text": "var(--popover-foreground)",
					"--normal-border": "var(--border)",
					"--border-radius": "var(--radius)",
				} as React.CSSProperties
			}
			toastOptions={{
				classNames: {
					toast: "cn-toast",
				},
			}}
			{...props}
		/>
	)
}

export { Toaster }
