import type { IconProps } from "./icon"

const paths: ReadonlyArray<string> = [
	"M14 21H16",
	"M8 21H10",
	"M12 19H12.01",
	"M18 19V17",
	"M6 19V17",
	"M20 15H20.01",
	"M13 15L11 15",
	"M4 15H4.01",
	"M22 13V11",
	"M15 13L15 11",
	"M9 13L9 11",
	"M2 13V11",
	"M20 9H20.01",
	"M13 9L11 9",
	"M4 9H4.01",
	"M18 7V5",
	"M12 5H12.01",
	"M6 7V5",
	"M14 3H16",
	"M8 3H10",
]

function GearIcon({ size = 24, className, ...props }: IconProps) {
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
export { GearIcon }
