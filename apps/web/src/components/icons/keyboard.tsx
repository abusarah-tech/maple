import type { IconProps } from "./icon"

const paths: ReadonlyArray<string> = [
	"M14 14L10 14",
	"M6 10H6.01",
	"M6 14H6.01",
	"M10 10H10.01",
	"M14 10H14.01",
	"M18 10H18.01",
	"M18 14H18.01",
	"M4 6H20",
	"M4 18H20",
	"M2 8V16",
	"M22 8V16",
]

function KeyboardIcon({ size = 24, className, ...props }: IconProps) {
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
export { KeyboardIcon }
