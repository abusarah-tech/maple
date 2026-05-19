import type { IconProps } from "./icon"

const paths: ReadonlyArray<string> = [
	"M7 2V5",
	"M2 5H12",
	"M4.00001 7.00001L4 7.01001",
	"M5.00001 9.00001L5 9.01001",
	"M9.00001 13L9 13.01",
	"M7.00001 11L7 11.01",
	"M10 7.00001L10 7.01001",
	"M9.00001 9.00001L9 9.01001",
	"M5.00001 13L5 13.01",
	"M3.00001 14L3 14.01",
	"M17 8.01V8",
	"M19 12V10",
	"M15 12V10",
	"M12 20V18",
	"M13 14V17H21V14",
	"M22 20V18",
]

function LanguageIcon({ size = 24, className, ...props }: IconProps) {
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
export { LanguageIcon }
