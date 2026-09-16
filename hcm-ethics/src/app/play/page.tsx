import RoomScreen from "@/components/RoomScreen";
export default async function PlayPage({ searchParams }: { searchParams: Promise<{ room?: string }> }) {
  const { room } = await searchParams;
  return <RoomScreen code={room ?? ""} />;
}
