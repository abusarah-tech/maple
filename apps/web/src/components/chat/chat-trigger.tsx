import { useEffect } from "react"
import { useNavigate, useRouterState } from "@tanstack/react-router"
import { Button } from "@maple/ui/components/ui/button"

import { ChatBubbleSparkleIcon } from "@/components/icons"

export function ChatTrigger() {
	const navigate = useNavigate()
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	})

	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.key === ".") {
				e.preventDefault()
				navigate({ to: "/chat" })
			}
		}
		window.addEventListener("keydown", handleKeyDown)
		return () => window.removeEventListener("keydown", handleKeyDown)
	}, [navigate])

	if (pathname.startsWith("/chat")) return null

	return (
		<Button
			onClick={() => navigate({ to: "/chat" })}
			size="icon"
			className="fixed bottom-5 right-5 z-50 size-10 rounded-full shadow-lg"
			title={`Open Maple AI (${navigator.platform.includes("Mac") ? "⌘" : "Ctrl"}+.)`}
		>
			<ChatBubbleSparkleIcon className="size-5" />
		</Button>
	)
}
