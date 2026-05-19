import type { IconProps } from "./icon"

const paths: ReadonlyArray<string> = [
	"M12 2.01001L12 2.00001",
	"M12 22L12 22.01",
	"M10 4.01001L10 4.00001",
	"M10 20L10 20.01",
	"M14 4.01001L14 4.00001",
	"M14 20L14 20.01",
	"M16 6.01001L16 6.00001",
	"M16 18L16 18.01",
	"M18 8.01001L18 8.00001",
	"M18 16L18 16.01",
	"M8 6.01001L8 6.00001",
	"M8 18L8 18.01",
	"M6 8.01001L6 8.00001",
	"M6 16L6 16.01",
]

function ChevronExpandYIcon({ size = 24, className, ...props }: IconProps) {
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
export { ChevronExpandYIcon }
