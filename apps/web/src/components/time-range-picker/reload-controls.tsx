import { Button } from "@maple/ui/components/ui/button"

import { ArrowPathIcon } from "@/components/icons"
import { cn } from "@maple/ui/utils"

import { usePageRefreshContext } from "./page-refresh-context"

export function ReloadControls() {
	const { isReloading, reload } = usePageRefreshContext()

	return (
		<Button type="button" variant="outline" size="sm" onClick={reload} disabled={isReloading}>
			<ArrowPathIcon className={cn("size-3.5", isReloading && "animate-spin")} />
			<span>Reload</span>
		</Button>
	)
}
