import type { IconProps } from "./icon"

const paths: ReadonlyArray<string> = [
	"M9 3L4 8",
	"M4 8V16",
	"M4 16L9 21",
	"M9 21H15",
	"M15 21L20 16",
	"M20 16V8",
	"M20 8L16 4",
	"M16 4H11",
	"M15 1L11 4L15 7",
]

function ArrowPathIcon({ size = 24, className, ...props }: IconProps) {
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
export { ArrowPathIcon }
