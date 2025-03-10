import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Router, Switch } from 'wouter';
import { WalletProvider } from './contexts/WalletContext';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';

const queryClient = new QueryClient();

export default function App() {
  return (
    <WalletProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="min-h-screen flex flex-col">
            <Header />
            <div className="container mx-auto flex-1 p-4">
              <Switch>
                <Route path="/" component={Home} />
                <Route path="/dashboard" component={Dashboard} />
              </Switch>
            </div>
          </div>
        </Router>
      </QueryClientProvider>
    </WalletProvider>
  );
}