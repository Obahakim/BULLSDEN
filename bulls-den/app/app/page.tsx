export default function HomePage() {
  return (
    <div>
      <div className="mb-10">
        <h2 className="text-3xl font-bold mb-2">The Den</h2>
        <p className="text-zinc-400">
          Moderated prediction markets. Only $ANSEM. Winners take 88%.
        </p>
      </div>

      <div className="grid gap-4">
        {/* Markets will be loaded from Supabase + on-chain */}
        <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/50">
          <p className="text-zinc-500 text-sm">
            No live markets yet. Create one or wait for admin approval.
          </p>
        </div>
      </div>
    </div>
  );
}
