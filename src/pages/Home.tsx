import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";

function Home() {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Navbar */}
      <div className="flex justify-between items-center p-4 bg-white shadow-sm">
        <div className="font-bold text-xl">Ayna Corp</div>
        <div className="relative">
          <div className="cursor-pointer">
            <UserCircleIcon
              className="h-10 w-10"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            />
          </div>

          {/* Profile Popup Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1">
              <div
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => navigate("/profile")}
              >
                View Profile
              </div>
              <div
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={handleLogout}
              >
                Logout
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Existing content */}
      <div className="flex flex-col items-center justify-center flex-grow">
        <h1 className="text-2xl font-bold">Home</h1>
        <div className="cursor-pointer" onClick={() => navigate("/chat")}>
          Go to chatroom
        </div>
      </div>
    </div>
  );
}

export default Home;
