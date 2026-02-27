import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import SnakeGame from "./pages/SnakeGame";
import SnakeEnglish from "./pages/SnakeEnglish";
import CubeDemo from "./pages/CubeDemo";
import WordShooter from "./pages/WordShooter";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-gray-200">
      <nav className="flex items-center gap-6 px-6 py-3 bg-[#111] border-b border-[#222]">
        <Link to="/" className="text-lg font-bold text-white no-underline">
          Game Collection
        </Link>
        <div className="flex gap-4">
          <Link to="/snake" className="text-sm text-gray-500 no-underline hover:text-white transition-colors">Snake</Link>
          <Link to="/snake-english" className="text-sm text-gray-500 no-underline hover:text-white transition-colors">Snake English</Link>
          <Link to="/cube" className="text-sm text-gray-500 no-underline hover:text-white transition-colors">3D Cube</Link>
          <Link to="/word-shooter" className="text-sm text-gray-500 no-underline hover:text-white transition-colors">Word Shooter</Link>
          <Link to="/admin" className="text-sm text-gray-500 no-underline hover:text-white transition-colors">Word List</Link>
        </div>
      </nav>
      <main className="flex-1 flex">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/snake" element={<SnakeGame />} />
          <Route path="/snake-english" element={<SnakeEnglish />} />
          <Route path="/cube" element={<CubeDemo />} />
          <Route path="/word-shooter" element={<WordShooter />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
    </div>
  );
}
