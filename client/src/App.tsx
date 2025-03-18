import { Routes, Route, BrowserRouter } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { WalletProvider } from "./contexts/WalletContext";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Holdings from "@/pages/Holdings";
import Transactions from "@/pages/Transactions";
import NFTs from "@/pages/NFTs";
import Header from "@/components/Header";

function Router() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/holdings" element={<Holdings />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/nfts" element={<NFTs />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <Router />
        <Toaster />
      </WalletProvider>
    </QueryClientProvider>
  );
}

export default App;
