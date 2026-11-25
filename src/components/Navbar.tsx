import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import logo from "@/assets/freshflix-transparent.webp.asset.json";

export function Navbar() {
  return (
    <header className="glass-bar fixed inset-x-0 top-0 z-50">
      <nav className="mx-auto flex h-16 items-center justify-between px-5 sm:px-10">
        <Link to="/" aria-label="FRESHFLIX home" className="flex items-center"><img src={logo.url} alt="FRESHFLIX" width={600} height={140} className="h-8 w-auto sm:h-9" /></Link>
        <div className="flex items-center gap-1 text-sm">
          <Link to="/search" search={{ q: "" }} className="nav-pill" activeProps={{ className: "nav-pill-active" }}><Search className="h-4 w-4" /><span className="hidden sm:inline">Search</span></Link>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
