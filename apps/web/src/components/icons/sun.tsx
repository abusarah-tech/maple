import type { IconProps } from "./icon"

const paths: ReadonlyArray<string> = [
	"M9 9H15V15H9Z",
	"M12 2V4",
	"M12 20V22",
	"M2 12H4",
	"M20 12H22",
	"M5 5L6 6",
	"M18 18L19 19",
	"M5 19L6 18",
	"M18 6L19 5",
]

function SunIcon({ size = 24, className, ...props }: IconProps) {
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
export { SunIcon }
