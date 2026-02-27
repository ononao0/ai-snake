import { useState, useMemo } from "react";
import puzzles from "../data/puzzles";

const letterGroups = [3, 4, 5, 6, 7, 8] as const;

export default function Admin() {
  const [search, setSearch] = useState("");
  const [filterLength, setFilterLength] = useState<number | null>(null);

  const filtered = useMemo(() => {
    return puzzles.filter((p) => {
      if (filterLength && p.answer.length !== filterLength) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        p.answer.toLowerCase().includes(q) ||
        p.question.toLowerCase().includes(q) ||
        p.hint.includes(search)
      );
    });
  }, [search, filterLength]);

  const grouped = useMemo(() => {
    const map = new Map<number, typeof filtered>();
    for (const p of filtered) {
      const len = p.answer.length;
      if (!map.has(len)) map.set(len, []);
      map.get(len)!.push(p);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [filtered]);

  return (
    <div className="flex-1 flex flex-col items-center p-6 max-w-5xl mx-auto w-full">
      <h1 className="text-3xl font-bold mb-6">Word List</h1>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-6 w-full items-center">
        <input
          type="text"
          placeholder="Search words, questions, hints..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 rounded-lg bg-[#161616] border border-[#333] text-gray-200 placeholder-gray-600 outline-none focus:border-[#555] transition-colors"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setFilterLength(null)}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors cursor-pointer ${
              filterLength === null
                ? "bg-blue-600 text-white"
                : "bg-[#222] text-gray-400 hover:bg-[#333]"
            }`}
          >
            All
          </button>
          {letterGroups.map((len) => (
            <button
              key={len}
              onClick={() => setFilterLength(filterLength === len ? null : len)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors cursor-pointer ${
                filterLength === len
                  ? "bg-blue-600 text-white"
                  : "bg-[#222] text-gray-400 hover:bg-[#333]"
              }`}
            >
              {len} letters
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="text-sm text-gray-500 mb-4 w-full">
        Showing {filtered.length} / {puzzles.length} words
      </div>

      {/* Table */}
      {grouped.map(([len, items]) => (
        <div key={len} className="w-full mb-8">
          <h2 className="text-lg font-semibold mb-3 text-gray-300">
            {len}-letter words
            <span className="ml-2 text-sm font-normal text-gray-600">
              ({items.length})
            </span>
          </h2>
          <div className="overflow-x-auto rounded-lg border border-[#262626]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#161616] text-left text-gray-500">
                  <th className="px-4 py-3 font-medium w-10">#</th>
                  <th className="px-4 py-3 font-medium w-32">Answer</th>
                  <th className="px-4 py-3 font-medium">Question (English)</th>
                  <th className="px-4 py-3 font-medium">Hint (Japanese)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p, i) => (
                  <tr
                    key={p.answer}
                    className="border-t border-[#222] hover:bg-[#1a1a1a] transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-600">{i + 1}</td>
                    <td className="px-4 py-3 font-mono font-bold text-green-400">
                      {p.answer}
                    </td>
                    <td className="px-4 py-3 text-gray-300">{p.question}</td>
                    <td className="px-4 py-3 text-gray-400">{p.hint}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <p className="text-gray-600 mt-8">No words found.</p>
      )}
    </div>
  );
}
