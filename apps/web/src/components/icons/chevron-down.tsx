import type { IconProps } from "./icon"

const paths: ReadonlyArray<string> = [
	"M12 16.99L12 17",
	"M10 14.99L10 15",
	"M14 14.99L14 15",
	"M16 12.99L16 13",
	"M8 12.99L8 13",
	"M6 10.99L6 11",
	"M18 10.99L18 11",
	"M20 8.98999L20 8.99999",
	"M4 8.98999L4 8.99999",
]

function ChevronDownIcon({ size = 24, className, ...props }: IconProps) {
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
export { ChevronDownIcon }
