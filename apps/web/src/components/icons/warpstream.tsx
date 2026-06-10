import type { IconProps } from "./icon"

// No simple-icons entry exists for WarpStream — custom mono mark: three
// warped stream lines converging, echoing the product's stream motif.
function WarpStreamIcon({ size = 24, className, ...props }: IconProps) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			width={size}
			height={size}
			className={className}
			fill="none"
			stroke="currentColor"
			strokeWidth={2.2}
			strokeLinecap="round"
			aria-hidden="true"
			{...props}
		>
			<path d="M3 6.5h10c3.5 0 5.5 1.5 5.5 1.5" />
			<path d="M3 12h18" />
			<path d="M3 17.5h10c3.5 0 5.5-1.5 5.5-1.5" />
		</svg>
	)
}

export { WarpStreamIcon }
