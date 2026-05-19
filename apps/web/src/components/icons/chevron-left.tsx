import type { IconProps } from "./icon"

const paths: ReadonlyArray<string> = [
	"M7.01001 12H7.00001",
	"M9.01001 10H9.00001",
	"M9.01001 14H9.00001",
	"M11.01 16H11",
	"M11.01 8H11",
	"M13.01 6H13",
	"M13.01 18H13",
	"M15.01 20H15",
	"M15.01 4H15",
]

function ChevronLeftIcon({ size = 24, className, ...props }: IconProps) {
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
export { ChevronLeftIcon }
