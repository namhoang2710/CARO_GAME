import AdminDashboard from "@/components/AdminDashboard";
export default async function AdminPage({ searchParams }: { searchParams: Promise<{ room?: string }> }) {
  const { room } = await searchParams;
  return <AdminDashboard code={room} />;
}
