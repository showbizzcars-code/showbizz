import { createFileRoute, notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/admin-preview")({
  loader: () => {
    throw notFound();
  },
  component: () => null,
});
