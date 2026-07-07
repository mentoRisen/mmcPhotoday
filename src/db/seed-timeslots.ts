export type TimeslotSeed = {
  id: number;
  label: string;
  startTime: string;
  bookable: boolean;
};

export const TIMESLOT_SEEDS = [
  { id: 1, label: "Gatherup", startTime: "09:00:00", bookable: false },
  { id: 2, label: "First shoot", startTime: "09:30:00", bookable: true },
  { id: 3, label: "Second shoot", startTime: "11:00:00", bookable: true },
  { id: 4, label: "Third shoot", startTime: "12:30:00", bookable: true },
] as const satisfies readonly TimeslotSeed[];

export const TIMESLOT_GATHERUP = TIMESLOT_SEEDS[0];
export const TIMESLOT_FIRST = TIMESLOT_SEEDS[1];
export const TIMESLOT_SECOND = TIMESLOT_SEEDS[2];
export const TIMESLOT_THIRD = TIMESLOT_SEEDS[3];
