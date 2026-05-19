import type { IconProps } from "./icon"

const paths: ReadonlyArray<string> = [
	"M9 6L9 6.01",
	"M9 12L9 12.01",
	"M9 18L9 18.01",
	"M15 6L15 6.01",
	"M15 12L15 12.01",
	"M15 18L15 18.01",
]

function GripDotsIcon({ size = 24, className, ...props }: IconProps) {
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
				<path key={i} d={d} stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
			))}
		</svg>
	)
}
export { GripDotsIcon }
