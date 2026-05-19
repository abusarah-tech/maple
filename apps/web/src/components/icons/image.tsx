import type { IconProps } from "./icon"

const paths: ReadonlyArray<string> = [
	"M19 21H5",
	"M19 3H5",
	"M3 19L3 5",
	"M21 19L21 5",
	"M17 13L17 13.01",
	"M15 15L15 15.01",
	"M13 17L13 17.01",
	"M11 19L11 19.01",
	"M19 15L19 15.01",
	"M9 7H10",
	"M9 12H10",
	"M12 9L12 10",
	"M7 9L7 10",
]

function ImageIcon({ size = 24, className, ...props }: IconProps) {
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
export { ImageIcon }
