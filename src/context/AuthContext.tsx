import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext<{
  user: any;
  token: string | null;
  login: (credentials: any) => Promise<void>;
  logout: () => void;
}>({
  user: null,
  token: null,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // 1. On initial render, check if we have anything in localStorage.
  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("authUser");

    if (storedToken) {
      setToken(storedToken);
    }
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // 2. Login method
  const login = async (credentials: any) => {
    try {
      const response = await axios.post(
        "http://localhost:1337/api/auth/local",
        credentials
      );
      const receivedToken = response.data.jwt;
      const receivedUser = response.data.user;

      // Save in React state
      setToken(receivedToken);
      setUser(receivedUser);

      // Also persist to localStorage
      localStorage.setItem("authToken", receivedToken);
      localStorage.setItem("authUser", JSON.stringify(receivedUser));
    } catch (error) {
      throw error;
    }
  };

  // 3. Logout method
  const logout = () => {
    setToken(null);
    setUser(null);

    // Clear from localStorage
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
