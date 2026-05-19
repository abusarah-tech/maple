import type { IconProps } from "./icon"

const paths: ReadonlyArray<string> = [
	"M4 4H10V10H4Z",
	"M14 4H20V10H14Z",
	"M4 14H10V20H4Z",
	"M14 14H20V20H14Z",
]

function GridIcon({ size = 24, className, ...props }: IconProps) {
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
export { GridIcon }
