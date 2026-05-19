import type { IconProps } from "./icon"

const paths: ReadonlyArray<string> = [
	"M20.0001 20L20 20",
	"M4.00006 20L4.00006 20.0001",
	"M18.0001 18L18 18",
	"M6.00006 18L6.00006 18.0001",
	"M16.0001 16L16 16",
	"M8.00006 16L8.00006 16.0001",
	"M14.0001 14L14 14",
	"M10.0001 14L10.0001 14.0001",
	"M12.0001 12L12 12",
	"M14.0001 10L14.0001 10.0001",
	"M10.0001 10L10 10",
	"M16.0001 8L16.0001 8.0001",
	"M8.00012 8L8.00002 8",
	"M18.0001 6L18.0001 6.0001",
	"M6.00012 6L6.00002 6",
	"M20.0001 4L20.0001 4.0001",
	"M4.00012 4L4.00002 4",
]

function XmarkIcon({ size = 24, className, ...props }: IconProps) {
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
export { XmarkIcon }
