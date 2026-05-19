import type { IconProps } from "./icon"

const paths: ReadonlyArray<string> = [
	"M3 4H21V10H3Z",
	"M3 14H21V20H3Z",
	"M7 7L7 7.01",
	"M7 17L7 17.01",
]

function ServerIcon({ size = 24, className, ...props }: IconProps) {
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
export { ServerIcon }
