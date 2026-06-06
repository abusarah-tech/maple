"use client"

import { useSyncExternalStore } from "react"

export type Theme = "light" | "dark"

/** Persisted in localStorage and mirrored as a class on <html>. */
const STORAGE_KEY = "maple-theme"
const DEFAULT_THEME: Theme = "dark"

const listeners = new Set<() => void>()

function readInitialTheme(): Theme {
	// The inline bootstrap script in apps/web/index.html already resolved the
	// theme and applied the class before first paint, so the DOM is the source
	// of truth here. Fall back to localStorage, then the default.
	if (typeof document !== "undefined") {
		const root = document.documentElement
		if (root.classList.contains("light")) return "light"
		if (root.classList.contains("dark")) return "dark"
	}
	try {
		const stored = localStorage.getItem(STORAGE_KEY)
		if (stored === "light" || stored === "dark") return stored
	} catch {
		// localStorage unavailable (private mode / non-browser) — use the default.
	}
	return DEFAULT_THEME
}

let current: Theme = readInitialTheme()

function applyTheme(theme: Theme): void {
	const root = document.documentElement
	root.classList.remove("light", "dark")
	root.classList.add(theme)
	root.style.colorScheme = theme
}

function notify(): void {
	for (const listener of listeners) listener()
}

function handleStorage(event: StorageEvent): void {
	if (event.key !== STORAGE_KEY) return
	if (event.newValue !== "light" && event.newValue !== "dark") return
	current = event.newValue
	applyTheme(current)
	notify()
}

function subscribe(listener: () => void): () => void {
	if (listeners.size === 0 && typeof window !== "undefined") {
		window.addEventListener("storage", handleStorage)
	}
	listeners.add(listener)
	return () => {
		listeners.delete(listener)
		if (listeners.size === 0 && typeof window !== "undefined") {
			window.removeEventListener("storage", handleStorage)
		}
	}
}

function getSnapshot(): Theme {
	return current
}

function getServerSnapshot(): Theme {
	return DEFAULT_THEME
}

/** Set the active theme, persist it, and apply the `light`/`dark` class to <html>. */
export function setTheme(theme: Theme): void {
	current = theme
	try {
		localStorage.setItem(STORAGE_KEY, theme)
	} catch {
		// Ignore persistence failures.
	}
	applyTheme(theme)
	notify()
}

/**
 * Dependency-free light/dark theme hook backed by a module-global store — no
 * provider required. The initial class is applied before first paint by the
 * inline bootstrap script in apps/web/index.html; this store keeps React in
 * sync, persists changes, and mirrors cross-tab updates via the `storage` event.
 */
export function useTheme(): { theme: Theme; setTheme: (theme: Theme) => void } {
	const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
	return { theme, setTheme }
}
