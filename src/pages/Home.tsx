import { Link } from "react-router-dom";

const games = [
  {
    path: "/snake",
    title: "Snake Game",
    description: "Classic snake game. Eat food and grow longer!",
  },
  {
    path: "/snake-english",
    title: "Snake English Word",
    description: "Spell words by eating letters in order. Learn English while playing!",
  },
  {
    path: "/cube",
    title: "3D Cube Demo",
    description: "Interactive 3D cube with Three.js.",
  },
  {
    path: "/word-shooter",
    title: "Word Shooter",
    description: "Shoot falling letters to spell English words!",
  },
];

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-8">Games</h1>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-5 w-full max-w-3xl">
        {games.map((game) => (
          <Link
            key={game.path}
            to={game.path}
            className="bg-[#161616] border border-[#262626] rounded-xl p-6 no-underline text-inherit transition-all hover:border-[#444] hover:-translate-y-0.5"
          >
            <h2 className="text-base font-semibold mb-2 text-white">{game.title}</h2>
            <p className="text-sm text-gray-500">{game.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
