import { Progress as ProgressPrimitive } from "@base-ui/react/progress"

import { FileIcon, PulseIcon, ChartLineIcon, ComputerIcon, type IconComponent } from "@/components/icons"
import type { AggregatedUsage } from "@/lib/billing/usage"
import { formatCount, formatUsage, usagePercentage } from "@/lib/billing/usage"
import type { PlanLimits } from "@/lib/billing/plans"
import { cn } from "@maple/ui/utils"

interface MeterRowProps {
	icon: IconComponent
	label: string
	used: number
	/** Use `Infinity` for track-only meters with no plan cap; renders as "Unlimited". */
	limit: number
	formatValue: (value: number) => string
}

function MeterRow({ icon: Icon, label, used, limit, formatValue }: MeterRowProps) {
	const pct = usagePercentage(used, limit)
	const isUnlimited = limit === Infinity
	const limitLabel = isUnlimited ? "Unlimited" : formatValue(limit)

	return (
		<ProgressPrimitive.Root value={pct} className="flex flex-col gap-2">
			<div className="flex w-full items-center gap-2">
				<Icon size={14} className="text-muted-foreground shrink-0" />
				<ProgressPrimitive.Label className="text-xs font-medium">{label}</ProgressPrimitive.Label>
				<span className="text-muted-foreground ml-auto text-xs tabular-nums font-mono">
					{formatValue(used)} / {limitLabel}
				</span>
			</div>
			<ProgressPrimitive.Track className="bg-muted h-1.5 relative flex w-full items-center overflow-x-hidden">
				<ProgressPrimitive.Indicator
					className={cn(
						"h-full transition-all",
						pct > 100 ? "bg-destructive" : pct > 80 ? "bg-severity-warn" : "bg-primary",
					)}
				/>
			</ProgressPrimitive.Track>
		</ProgressPrimitive.Root>
	)
}

interface UsageMetersProps {
	usage: AggregatedUsage
	limits: PlanLimits
}

export function UsageMeters({ usage, limits }: UsageMetersProps) {
	return (
		<div className="space-y-4">
			<MeterRow
				icon={FileIcon}
				label="Logs"
				used={usage.logsGB}
				limit={limits.logsGB}
				formatValue={formatUsage}
			/>
			<MeterRow
				icon={PulseIcon}
				label="Traces"
				used={usage.tracesGB}
				limit={limits.tracesGB}
				formatValue={formatUsage}
			/>
			<MeterRow
				icon={ChartLineIcon}
				label="Metrics"
				used={usage.metricsGB}
				limit={limits.metricsGB}
				formatValue={formatUsage}
			/>
			<MeterRow
				icon={ComputerIcon}
				label="Browser Sessions"
				used={usage.browserSessions}
				limit={Infinity}
				formatValue={formatCount}
			/>
		</div>
	)
}
