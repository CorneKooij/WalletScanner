import { useNavigate } from "react-router-dom";
import WalletInput from "./WalletInput";

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div
          className="flex items-center mb-4 md:mb-0"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          <div className="bg-[#2563EB] text-white p-2 rounded-lg mr-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#111827]">WalletScanner</h1>
        </div>

        <WalletInput />
      </div>
    </header>
  );
};

export default Header;
