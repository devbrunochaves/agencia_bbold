import { describe, expect, it } from "vitest";
import { shiftCompetenceMonth } from "../competence";
import { computeGoalProgress } from "../rules";

describe("shiftCompetenceMonth (§33 recurrence month rollover)", () => {
  it("rolls over across a year boundary going forward", () => {
    expect(shiftCompetenceMonth("2026-12-01", 1)).toBe("2027-01-01");
  });

  it("rolls over across a year boundary going backward", () => {
    expect(shiftCompetenceMonth("2026-01-01", -1)).toBe("2025-12-01");
  });

  it("is a no-op for delta 0", () => {
    expect(shiftCompetenceMonth("2026-08-01", 0)).toBe("2026-08-01");
  });
});

describe("computeGoalProgress", () => {
  it("computes percentage/remaining/exceeded for a partially-met goal", () => {
    const progress = computeGoalProgress(1_000_000, 600_000);
    expect(progress).toEqual({
      goalCents: 1_000_000,
      receivedCents: 600_000,
      percentage: 60,
      remainingCents: 400_000,
      exceededByCents: 0,
    });
  });

  it("reports the surplus once the goal is exceeded, never a negative remaining", () => {
    const progress = computeGoalProgress(1_000_000, 1_300_000);
    expect(progress.remainingCents).toBe(0);
    expect(progress.exceededByCents).toBe(300_000);
    expect(progress.percentage).toBe(130);
  });

  it("returns 0% for a goal of 0, never dividing by zero", () => {
    expect(computeGoalProgress(0, 500_000).percentage).toBe(0);
  });
});
