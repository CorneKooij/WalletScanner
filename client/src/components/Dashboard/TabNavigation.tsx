import { Link, useRoute } from "wouter";

const TabNavigation = () => {
  const [isRootActive] = useRoute("/");
  const [isHoldingsActive] = useRoute("/holdings");
  const [isTransactionsActive] = useRoute("/transactions");
  const [isNFTsActive] = useRoute("/nfts");

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
        <Link href="/">
          <a className={getTabClassName(isRootActive)}>
            Dashboard
          </a>
        </Link>
        <Link href="/holdings">
          <a className={getTabClassName(isHoldingsActive)}>
            Holdings
          </a>
        </Link>
        <Link href="/transactions">
          <a className={getTabClassName(isTransactionsActive)}>
            Transactions
          </a>
        </Link>
        <Link href="/nfts">
          <a className={getTabClassName(isNFTsActive)}>
            NFTs
          </a>
        </Link>
      </nav>
    </div>
  );
};

export default TabNavigation;