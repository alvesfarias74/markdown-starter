import { z } from "zod";

export const dashboardTotalsSchema = z.object({
  inProgress: z.number(), completed: z.number(), pending: z.number(),
  available: z.number(), received: z.number(), gross: z.number(), fees: z.number(),
});

export const canTransitionJob = (from: string, to: string) =>
  (from === "scheduled" && ["in_progress", "completed", "cancelled"].includes(to)) ||
  (from === "in_progress" && ["completed", "cancelled"].includes(to));