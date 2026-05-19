import type { IconProps } from "./icon"

const paths: ReadonlyArray<string> = ["M4 4H17L20 7V20H4Z", "M8 4V9H15V4", "M8 13H16V20H8Z"]

function FloppyDiskIcon({ size = 24, className, ...props }: IconProps) {
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
export { FloppyDiskIcon }
