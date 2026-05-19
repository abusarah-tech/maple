import type { IconProps } from "./icon"

const paths: ReadonlyArray<{ d: string; opacity: number }> = [
	{ d: "M12 19V22", opacity: 0.5 },
	{ d: "M19.01 19L19 19", opacity: 0.63 },
	{ d: "M5.01001 19L5.00001 19", opacity: 0.38 },
	{ d: "M17.01 17L17 17", opacity: 0.63 },
	{ d: "M7.01001 17L7.00001 17", opacity: 0.38 },
	{ d: "M22.005 11.995L19.005 11.995", opacity: 0.75 },
	{ d: "M5.005 11.995L2.005 11.995", opacity: 0.25 },
	{ d: "M17.01 7L17 7", opacity: 0.88 },
	{ d: "M7.01001 7L7.00001 7", opacity: 0.13 },
	{ d: "M19.01 5L19 5", opacity: 0.88 },
	{ d: "M5.01001 5L5.00001 5", opacity: 0.13 },
	{ d: "M12 2V5", opacity: 1 },
]

function LoaderIcon({ size = 24, className, ...props }: IconProps) {
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
			{paths.map((p, i) => (
				<path
					key={i}
					d={p.d}
					opacity={p.opacity}
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="square"
				/>
			))}
		</svg>
	)
}
export { LoaderIcon }
