import { useState, useEffect, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string | null;
  createdAt: string;
}

export interface RegisterResult {
  email: string;
  maskedEmail: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  register: (
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ) => Promise<RegisterResult>;
  verifyEmail: (email: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string, password: string) => Promise<void>;
  oauthSignIn: (input: {
    provider: "google" | "github";
    email: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  }) => Promise<void>;
  updateProfile: (input: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    api
      .get("/auth/me")
      .then((response) => {
        if (active) setUser(response.data.user);
      })
      .catch(() => {
        // No valid session — leave user as null.
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const register = async (
    firstName: string,
    lastName: string,
    email: string,
    password: string
  ): Promise<RegisterResult> => {
    const response = await api.post("/auth/register", {
      firstName,
      lastName,
      email,
      password,
    });
    return response.data as RegisterResult;
  };

  const verifyEmail = async (email: string): Promise<void> => {
    await api.post("/auth/verify-email", { email });
    router.push("/login?verified=success");
  };

  const login = async (email: string, password: string): Promise<void> => {
    const response = await api.post("/auth/login", { email, password });
    setUser(response.data.user);
    router.push("/dashboard");
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
      // Full page navigation so the session cookie is cleared and the
      // dashboard auth guard cannot race us to /login.
      window.location.href = "/";
    }
  };

  const resetPassword = async (email: string, password: string): Promise<void> => {
    await api.post("/auth/reset-password", { email, password });
  };

  const oauthSignIn = async (input: {
    provider: "google" | "github";
    email: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  }): Promise<void> => {
    const response = await api.post("/auth/oauth", input);
    setUser(response.data.user);
    router.push("/dashboard");
  };

  const updateProfile = async (input: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
  }): Promise<void> => {
    const response = await api.patch("/auth/me", input);
    setUser(response.data.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        register,
        verifyEmail,
        login,
        logout,
        resetPassword,
        oauthSignIn,
        updateProfile,
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
