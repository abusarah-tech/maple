import type { IconProps } from "./icon"

const paths: ReadonlyArray<string> = [
	"M9.99999 18H10.01",
	"M12 16H12.01",
	"M7.99999 16H8.00999",
	"M14 14H14.01",
	"M5.99999 14H6.00999",
	"M3.99999 12H4.00999",
	"M22 6H22.01",
	"M16 12H16.01",
	"M18 10H18.01",
	"M20 8H20.01",
]

function CheckIcon({ size = 24, className, ...props }: IconProps) {
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
export { CheckIcon }
