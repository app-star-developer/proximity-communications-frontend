import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/signup")({
	loader: () => {
		// Self-service signup is disabled
		throw redirect({ to: "/login" });
	},
	component: () => null,
});
