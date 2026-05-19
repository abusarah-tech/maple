import type { IconProps } from "./icon"

const paths: ReadonlyArray<string> = [
	"M8 2L16 2",
	"M8 22L16 22",
	"M2 8L2 16",
	"M22 8L22 16",
	"M6 4L6 4.01",
	"M4 6L4 6.01",
	"M18 4L18 4.01",
	"M20 6L20 6.01",
	"M6 20L6 20.01",
	"M4 18L4 18.01",
	"M18 20L18 20.01",
	"M20 18L20 18.01",
]

function RadioCheckedIcon({ size = 24, className, ...props }: IconProps) {
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
			<rect x="9" y="9" width="6" height="6" fill="currentColor" />
		</svg>
	)
}
export { RadioCheckedIcon }
