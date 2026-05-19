import type { IconProps } from "./icon"

const paths: ReadonlyArray<string> = [
	"M11 2.00001H13",
	"M11 8.00001H13",
	"M15 4L15 6",
	"M9 4L9 6",
	"M19 14H21",
	"M3.00002 14H5.00002",
	"M19 20H21",
	"M3.00002 20H5.00002",
	"M23 16L23 18",
	"M7 16L7 18",
	"M17 16L17 18",
	"M1 16L1 18",
	"M4.01003 10L4.00003 10",
	"M20 10L20.01 10",
	"M10 21L10.01 21",
	"M14 21L14.01 21",
	"M12 22L12.01 22",
	"M5.01003 8L5.00003 8",
	"M19 8L19.01 8",
]

function NetworkNodesIcon({ size = 24, className, ...props }: IconProps) {
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
export { NetworkNodesIcon }
