import { Link, useLocation } from "react-router-dom";

const TabNavigation = () => {
  const location = useLocation();
  const isRootActive = location.pathname === "/";
  const isHoldingsActive = location.pathname === "/holdings";
  const isTransactionsActive = location.pathname === "/transactions";
  const isNFTsActive = location.pathname === "/nfts";

  const getTabClassName = (isActive: boolean) => {
    return `flex-1 text-center px-4 py-2.5 border-b-2 font-medium text-sm transition-colors ${
      isActive
        ? "border-primary text-primary"
        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
    }`;
  };

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex justify-between w-full max-w-screen-xl mx-auto px-4">
        <Link to="/" className={getTabClassName(isRootActive)}>
          Dashboard
        </Link>
        <Link to="/holdings" className={getTabClassName(isHoldingsActive)}>
          Holdings
        </Link>
        <Link
          to="/transactions"
          className={getTabClassName(isTransactionsActive)}
        >
          Transactions
        </Link>
        <Link to="/nfts" className={getTabClassName(isNFTsActive)}>
          NFTs
        </Link>
      </nav>
    </div>
  );
};

export default TabNavigation;
