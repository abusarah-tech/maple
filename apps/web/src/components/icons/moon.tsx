import type { IconProps } from "./icon"

const paths: ReadonlyArray<string> = [
	"M14 3L9 5L6 9L6 15L9 19L14 21",
	"M14 21L11 17L10 12L11 7L14 3",
]

function MoonIcon({ size = 24, className, ...props }: IconProps) {
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
export { MoonIcon }
