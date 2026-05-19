import type { IconProps } from "./icon"

const paths: ReadonlyArray<string> = [
	"M13 16L11 16",
	"M15 14L15 12",
	"M9 14L9 12",
	"M20.01 10L20 10",
	"M13 10L11 10",
	"M4.01001 10L4.00001 10",
	"M22.01 8L22 8",
	"M18.01 8L18 8",
	"M6.01001 8L6.00001 8",
	"M2.01001 8L2.00001 8",
	"M16 6L8 6",
	"M18.01 4L18 4",
	"M6.01001 4L6.00001 4",
	"M12.01 3L12 3",
	"M22 12V14",
	"M2 12V14",
]

function EyeIcon({ size = 24, className, ...props }: IconProps) {
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
export { EyeIcon }
