import { describe, it, expect } from "vitest";
import {
  TIMESLOT_SEEDS,
  TIMESLOT_GATHERUP,
  TIMESLOT_FIRST,
  TIMESLOT_SECOND,
  TIMESLOT_THIRD,
} from "./seed-timeslots";

describe("timeslot seeds", () => {
  it("defines exactly four timeslots", () => {
    expect(TIMESLOT_SEEDS).toHaveLength(4);
  });

  it("marks gatherup as not bookable and shoot slots as bookable", () => {
    expect(TIMESLOT_GATHERUP.bookable).toBe(false);
    expect(TIMESLOT_FIRST.bookable).toBe(true);
    expect(TIMESLOT_SECOND.bookable).toBe(true);
    expect(TIMESLOT_THIRD.bookable).toBe(true);
  });

  it("uses start times 9:00, 9:30, 11:00, 12:30", () => {
    expect(TIMESLOT_GATHERUP.startTime).toBe("09:00:00");
    expect(TIMESLOT_FIRST.startTime).toBe("09:30:00");
    expect(TIMESLOT_SECOND.startTime).toBe("11:00:00");
    expect(TIMESLOT_THIRD.startTime).toBe("12:30:00");
  });
});
