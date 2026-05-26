import { memo, Suspense } from "react"

import { getChartById } from "@maple/ui/components/charts/registry"
import { ChartSkeleton } from "@maple/ui/components/charts/_shared/chart-skeleton"
import { WidgetFrame } from "@/components/dashboard-builder/widgets/widget-shell"
import type { WidgetDataState, WidgetDisplayConfig, WidgetMode } from "@/components/dashboard-builder/types"

interface FunnelWidgetProps {
	dataState: WidgetDataState
	display: WidgetDisplayConfig
	mode: WidgetMode
	onRemove?: () => void
	onClone?: () => void
	onConfigure?: () => void
	onFix?: () => void
}

export const FunnelWidget = memo(function FunnelWidget({
	dataState,
	display,
	mode,
	onRemove,
	onClone,
	onConfigure,
	onFix,
}: FunnelWidgetProps) {
	const entry = getChartById(display.chartId ?? "query-builder-funnel")
	if (!entry) return null

	const ChartComponent = entry.component
	const chartData =
		dataState.status === "ready" && Array.isArray(dataState.data) ? dataState.data : undefined

	return (
		<WidgetFrame
			title={display.title || "Untitled"}
			dataState={dataState}
			mode={mode}
			onRemove={onRemove}
			onClone={onClone}
			onConfigure={onConfigure}
			onFix={onFix}
			loadingSkeleton={<ChartSkeleton variant="funnel" />}
		>
			<Suspense fallback={<ChartSkeleton variant="funnel" />}>
				<ChartComponent
					data={chartData}
					className="h-full w-full aspect-auto"
					unit={display.unit}
					funnel={display.funnel}
				/>
			</Suspense>
		</WidgetFrame>
	)
})
