import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import type { User } from "@/types";
import {
  loginWithCredentials as apiLogin,
  registerWithCredentials as apiRegister,
  verifyEmail as apiVerifyEmail,
  resendVerificationCode as apiResendCode,
  getCurrentUser,
  setAuthToken,
} from "./api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ) => Promise<{ email: string; maskedEmail: string }>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendCode: (email: string) => Promise<{ maskedEmail: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "timelens-desktop-token";

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function storeToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Storage unavailable
  }
}

function clearStoredToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage unavailable
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const storedToken = getStoredToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        setAuthToken(storedToken);
        const { user: me } = await getCurrentUser(storedToken);
        if (active) {
          setUser(me);
          setToken(storedToken);
        }
      } catch {
        clearStoredToken();
        setAuthToken(null);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiLogin(email, password);
    const { token: newToken, user: me } = response;

    storeToken(newToken);
    setAuthToken(newToken);
    setToken(newToken);
    setUser(me);
  }, []);

  const register = useCallback(
    async (
      firstName: string,
      lastName: string,
      email: string,
      password: string
    ) => {
      const result = await apiRegister(firstName, lastName, email, password);
      return { email: result.email, maskedEmail: result.maskedEmail };
    },
    []
  );

  const verifyEmail = useCallback(async (email: string, code: string) => {
    const response = await apiVerifyEmail(email, code);
    const { token: newToken, user: me } = response;

    storeToken(newToken);
    setAuthToken(newToken);
    setToken(newToken);
    setUser(me);
  }, []);

  const resendCode = useCallback(async (email: string) => {
    return await apiResendCode(email);
  }, []);

  const logout = useCallback(async () => {
    clearStoredToken();
    setAuthToken(null);
    setToken(null);
    setUser(null);

    if (window.electronAPI) {
      await window.electronAPI.logout();
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        verifyEmail,
        resendCode,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
