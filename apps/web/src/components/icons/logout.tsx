import type { IconProps } from "./icon"

const paths: ReadonlyArray<string> = [
	"M4 10V14",
	"M14 12H1.99997",
	"M6 4L6 4.01",
	"M20.01 6L20 6",
	"M18.01 4L18 4",
	"M20.01 18L20 18",
	"M18.01 20L18 20",
	"M6.01001 20L6.00001 20",
	"M22 8L22 16",
	"M8 2L16 2",
	"M8 22L16 22",
	"M6 8.01001L6 8.00001",
	"M6 16.01L6 16",
]

function LogoutIcon({ size = 24, className, ...props }: IconProps) {
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
export { LogoutIcon }
