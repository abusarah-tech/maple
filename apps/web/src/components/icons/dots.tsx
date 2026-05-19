import type { IconProps } from "./icon"

const paths: ReadonlyArray<string> = ["M5 12L5 12.01", "M12 12L12 12.01", "M19 12L19 12.01"]

function DotsIcon({ size = 24, className, ...props }: IconProps) {
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
				<path key={i} d={d} stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
			))}
		</svg>
	)
}
export { DotsIcon }
