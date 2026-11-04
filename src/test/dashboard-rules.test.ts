import { describe, expect, it } from "vitest";
import { canTransitionJob } from "@/lib/dashboard-rules";
import { PLATFORM_COMMISSION_RATE } from "@/lib/commission";

describe("Dashboard business rules", () => {
  it("preserves the platform commission of 8%", () => {
    expect(PLATFORM_COMMISSION_RATE).toBe(0.08);
    expect(250 * PLATFORM_COMMISSION_RATE).toBe(20);
  });
  it("allows starting a scheduled job", () => expect(canTransitionJob("scheduled", "in_progress")).toBe(true));
  it("allows completing an active job", () => expect(canTransitionJob("in_progress", "completed")).toBe(true));
  it("does not reopen completed jobs", () => expect(canTransitionJob("completed", "scheduled")).toBe(false));
  it("does not restart cancelled jobs", () => expect(canTransitionJob("cancelled", "in_progress")).toBe(false));
});