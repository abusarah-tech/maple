import type { IconProps } from "./icon"

const paths: ReadonlyArray<string> = [
	"M5 15H5.01",
	"M7 13H7.01",
	"M9 11H9.01",
	"M11 9H11.01",
	"M13 7H13.01",
	"M15 5H15.01",
	"M17 3H17.01",
	"M19 5H19.01",
	"M9 19H9.01",
	"M11 17H11.01",
	"M13 21H21",
	"M13 15H13.01",
	"M15 13H15.01",
	"M17 11H17.01",
	"M19 9H19.01",
	"M21 7H21.01",
	"M3 17V21H7",
	"M15 9H15.01",
]

function PencilIcon({ size = 24, className, ...props }: IconProps) {
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
export { PencilIcon }
