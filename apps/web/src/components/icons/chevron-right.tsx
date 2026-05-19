import type { IconProps } from "./icon"

const paths: ReadonlyArray<string> = [
	"M16.99 12H17",
	"M14.99 10H15",
	"M14.99 14H15",
	"M12.99 16H13",
	"M12.99 8H13",
	"M10.99 6H11",
	"M10.99 18H11",
	"M8.99 20H9",
	"M8.99 4H9",
]

function ChevronRightIcon({ size = 24, className, ...props }: IconProps) {
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
export { ChevronRightIcon }
