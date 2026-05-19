import type { IconProps } from "./icon"

const paths: ReadonlyArray<string> = [
	"M4 21H20",
	"M22 17L22 19",
	"M12 17H12.01",
	"M2 17L2 19",
	"M20 13L20 15",
	"M4 13L4 15",
	"M18 9L18 11",
	"M12 13V9",
	"M6 9L6 11",
	"M16 5L16 7",
	"M8 5L8 7",
	"M10 3H14",
]

function AlertWarningIcon({ size = 24, className, ...props }: IconProps) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			width={size}
			height={size}
			className={className}
			fill="none"
			aria-hidden="true"
			{...props}
		>
			{paths.map((d, i) => (
				<path key={i} d={d} stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
			))}
		</svg>
	)
}
export { AlertWarningIcon }
