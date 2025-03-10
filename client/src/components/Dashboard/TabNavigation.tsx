import { Link, useRoute } from "wouter";

const TabNavigation = () => {
  const [isRootActive] = useRoute("/");
  const [isHoldingsActive] = useRoute("/holdings");
  const [isTransactionsActive] = useRoute("/transactions");
  const [isNFTsActive] = useRoute("/nfts");

  // Determine the class name based on if the route is active
  const getTabClassName = (isActive: boolean) => {
    return isActive
      ? "px-4 py-2 border-b-2 border-[#2563EB] text-[#2563EB] font-medium"
      : "px-4 py-2 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium";
  };

  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex -mb-px overflow-x-auto">
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
