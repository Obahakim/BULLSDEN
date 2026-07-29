"use client";

export default function CreateMarketPage() {
  return (
    <div className="max-w-xl">
      <h2 className="text-2xl font-bold mb-6">Submit a Market</h2>
      <p className="text-zinc-400 mb-8 text-sm">
        All markets are reviewed by admin. You need a verified email + connected wallet.
        Max duration: 14 days. Binary outcomes only.
      </p>

      <form className="space-y-5">
        <div>
          <label className="block text-sm mb-1">Title</label>
          <input
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2"
            placeholder="Will X happen by Y date?"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Description / Resolution criteria</label>
          <textarea
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 h-28"
            placeholder="Clear rules for how this will be resolved..."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Outcome A</label>
            <input className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2" defaultValue="Yes" />
          </div>
          <div>
            <label className="block text-sm mb-1">Outcome B</label>
            <input className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2" defaultValue="No" />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">Deadline (max 14 days)</label>
          <input type="datetime-local" className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2" />
        </div>
        <button
          type="submit"
          className="w-full bg-red-700 hover:bg-red-600 text-white font-medium py-3 rounded-lg"
        >
          Submit for Review
        </button>
      </form>
    </div>
  );
}
