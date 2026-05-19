import type { IconProps } from "./icon"

const paths: ReadonlyArray<string> = [
	"M10 14V20H14V14",
	"M18 10V20H22V10",
	"M2 18V20H6V18",
	"M4.01001 16L4.00001 16",
	"M12.01 12L12 12",
	"M2.01001 8L2.00001 8",
	"M4.01001 6L4.00001 6",
	"M6.01001 4L6.00001 4",
	"M8.01001 6L8.00001 6",
	"M10.01 8L10 8",
	"M12.01 6L12 6",
	"M14.01 4L14 4",
	"M20.01 8L20 8",
]

function ChartBarTrendUpIcon({ size = 24, className, ...props }: IconProps) {
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
export { ChartBarTrendUpIcon }
