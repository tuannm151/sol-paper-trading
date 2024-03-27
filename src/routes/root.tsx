import {
  Link,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate
} from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import SearchToken from "@/components/search-token";
import { HomeIcon, SettingsIcon } from "lucide-react";
import TokenBalance from "@/components/token-balance";

export default function Root() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="flex relative">
        <aside className={`md:w-[300px] md:static pt-5 px-2 rounded-lg flex flex-col gap-2`}>
          <header className="flex justify-between items-center">
            <h1
              className="text-2xl font-bold text-primary mb-2 cursor-pointer"
              onClick={() => navigate("/")}
            >
              TradeQuest
            </h1>
            <ModeToggle />
          </header>
          <div className="px-2">
            <SearchToken />
          </div>
          {!location.pathname.includes("/token/") && (
            <nav className="space-y-2 flex flex-col gap-2 mt-4">
              <div className="flex flex-col gap-2 text-sm">
                <Link
                  className="flex py-2 px-4 items-center space-x-2 hover:bg-secondary rounded-lg"
                  to={"/"}
                >
                  <HomeIcon className="w-5 h-5" />
                  <span>Home</span>
                </Link>
                <Link
                  className="flex py-2 px-4 items-center space-x-2 hover:bg-secondary rounded-lg"
                  to={"/settings"}
                >
                  <SettingsIcon className="w-5 h-5" />
                  <span>Settings</span>
                </Link>
              </div>
            </nav>
          )}
          <Routes>
            <Route
              path="/token/:address"
              element={
                <div className="w-full mt-auto mb-2">
                  <TokenBalance />
                </div>
              }
            />
          </Routes>
        </aside>
        <main className="flex-1 min-h-screen">
          <Outlet />
        </main>
      </div>
    </ThemeProvider>
  );
}
