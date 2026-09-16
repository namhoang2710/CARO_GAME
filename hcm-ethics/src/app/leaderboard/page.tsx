import RoomScreen from "@/components/RoomScreen";
export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ room?: string }> }) {
  const { room } = await searchParams;
  return <RoomScreen code={room ?? ""} mode="spectator" />;
}
