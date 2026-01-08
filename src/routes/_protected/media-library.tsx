import { createFileRoute } from "@tanstack/react-router";
import { MediaLibrary } from "../../components/MediaLibrary";

export const Route = createFileRoute("/_protected/media-library")({
	component: () => <MediaLibrary standalone />,
});
