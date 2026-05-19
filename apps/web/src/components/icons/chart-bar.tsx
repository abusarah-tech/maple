import type { IconProps } from "./icon"

const paths: ReadonlyArray<string> = [
	"M2 20H22",
	"M4 8L4 8.01",
	"M20 11L20 11.01",
	"M12 3L12 3.01",
	"M2 10V16H6V10",
	"M18 13V16H22V13",
	"M10 5V16H14V5",
]

function ChartBarIcon({ size = 24, className, ...props }: IconProps) {
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
export { ChartBarIcon }
