import { createFileRoute, redirect } from "@tanstack/react-router"

/**
 * Legacy path — the Connectors page merged into the Integrations hub.
 * Maps the old `?tab=` deep links onto `?integration=`.
 */
export const Route = createFileRoute("/connectors")({
	validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
		tab: typeof search.tab === "string" ? search.tab : undefined,
	}),
	beforeLoad: ({ search }) => {
		throw redirect({
			to: "/integrations",
			search: {
				integration:
					search.tab === "prometheus"
						? ("prometheus" as const)
						: search.tab === "cloudflare"
							? ("cloudflare" as const)
							: undefined,
			},
		})
	},
})
