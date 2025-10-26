import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import api from "../services/api_connection";

interface User {
  name: string;
  id: number;
}

interface AuthContextType {
  token: string | null | undefined;
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verifica se existe token no localStorage ao carregar
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken) {
      setToken(storedToken);
    }

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (err) {
        console.error("Erro ao parsear usuário:", err);
        localStorage.removeItem("user");
      }
    }

    setIsLoading(false);
  }, []);

  // Busca informações do usuário quando o token é definido
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setUser(null);
        return;
      }

      // Se já tem user, não precisa buscar novamente
      if (user) {
        return;
      }

      try {
        const response = await api.get("/administradores/atual");

        const userInfo = {
          name: response.data.nome,
          id: response.data.id,
        };

        setUser(userInfo);
        localStorage.setItem("user", JSON.stringify(userInfo));
      } catch (err) {
        console.error("Erro ao buscar usuário:", err);
      }
    };

    fetchUser();
  }, [token]);

  const login = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  // Não renderiza nada enquanto verifica o token inicial
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Carregando...
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return context;
};
