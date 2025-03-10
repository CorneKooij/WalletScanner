import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { WalletProvider } from "@/contexts/WalletContext";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Holdings from "@/pages/Holdings";
import Transactions from "@/pages/Transactions";
import NFTs from "@/pages/NFTs";
import Header from "@/components/Header";

function Router() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Header />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/holdings" component={Holdings} />
        <Route path="/transactions" component={Transactions} />
        <Route path="/nfts" component={NFTs} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <WalletProvider>
      <QueryClientProvider client={queryClient}>
        <Router />
        <Toaster />
      </QueryClientProvider>
    </WalletProvider>
  );
}

export default App;
