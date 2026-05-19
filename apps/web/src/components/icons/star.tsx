import type { IconProps } from "./icon"

const paths: ReadonlyArray<string> = [
	"M12 2.01001L12 2.00001",
	"M9 19.01L9 19",
	"M15 19.01L15 19",
	"M4 12.01L4 12",
	"M20 12.01L20 12",
	"M4 17V21H7",
	"M20 17V21H17",
	"M11 17H13",
	"M8 8H2V10",
	"M16 8L22 8V10",
	"M18 14V15",
	"M6 14V15",
	"M14 4V6",
	"M10 4V6",
]

function StarIcon({ size = 24, className, ...props }: IconProps) {
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

function StarFilledIcon({ size = 24, className, ...props }: IconProps) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			width={size}
			height={size}
			className={className}
			fill="currentColor"
			aria-hidden="true"
			{...props}
		>
			<path
				d="M12 2L14.9 8.6L22 9.3L16.8 14L18.2 21L12 17.3L5.8 21L7.2 14L2 9.3L9.1 8.6L12 2Z"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinejoin="round"
			/>
		</svg>
	)
}

export { StarIcon, StarFilledIcon }
