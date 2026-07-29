export default function AdminPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-8">Admin Dashboard</h2>

      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <a href="/admin/pending" className="border border-zinc-700 rounded-xl p-6 hover:border-red-700 transition">
          <h3 className="font-semibold mb-1">Pending Markets</h3>
          <p className="text-sm text-zinc-500">Review & approve / deny submissions</p>
        </a>
        <a href="/admin/resolve" className="border border-zinc-700 rounded-xl p-6 hover:border-red-700 transition">
          <h3 className="font-semibold mb-1">Resolve</h3>
          <p className="text-sm text-zinc-500">Markets past deadline</p>
        </a>
        <a href="/admin/appeals" className="border border-zinc-700 rounded-xl p-6 hover:border-red-700 transition">
          <h3 className="font-semibold mb-1">Appeals</h3>
          <p className="text-sm text-zinc-500">User challenges</p>
        </a>
      </div>

      <p className="text-zinc-500 text-sm">
        Connect with the admin wallet to perform actions. All resolves are logged.
      </p>
    </div>
  );
}
