import Link from "next/link";
import { User, Bell } from "lucide-react";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="md:hidden">
          <MobileNav />
        </div>
        <div className="flex items-center gap-2 font-bold md:w-[200px]">
          <span className="hidden md:inline-block">SATURNX</span>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2 md:space-x-4">
          <ThemeToggle />
          <button className="relative p-2 hover:bg-accent rounded-full transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600"></span>
            <span className="sr-only">Notifications</span>
          </button>
          <button className="p-2 hover:bg-accent rounded-full transition-colors">
            <User className="h-5 w-5" />
            <span className="sr-only">Profile</span>
          </button>
        </div>
      </div>
    </header>
  );
}
