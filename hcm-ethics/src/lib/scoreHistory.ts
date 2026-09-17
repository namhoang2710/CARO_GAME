import type { ScoreEvent } from "./sessionTypes";

export const formatPoints = (value: number) => value.toLocaleString("vi-VN");
export const signedPoints = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${formatPoints(Math.abs(value))}`;

export function describeScoreEvent(event: ScoreEvent): string {
  const name = event.counterpart_name || "người chơi";
  const amount = formatPoints(event.amount ?? Math.abs(event.delta));
  if (event.kind === "steal") return `Bạn đã cướp ${amount} điểm từ ${name}`;
  if (event.kind === "stolen") return `${name} đã cướp ${amount} điểm của bạn`;
  if (event.kind === "split") return `Bạn chia đều điểm với ${name}`;
  if (event.kind === "split_received") return `${name} chia đều điểm với bạn`;
  return event.label;
}
