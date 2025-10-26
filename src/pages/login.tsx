import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api_connection";
import { useToast } from "../hooks/useToast";

export default function Login() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Criação de conta
  const [showRegister, setShowRegister] = useState(false);
  const [registerName, setRegisterName] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerError, setRegisterError] = useState("");

  const toast = useToast();

  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        nome: name,
        senha: password,
      });

      console.log(response);

      // Salva o token
      if (response.data.access_token) {
        login(response.data.access_token);
        // Redireciona para a página da carteira
        navigate("/caixa");
      }
    } catch (err: any) {
      console.error("Erro:", err.response?.data); // Debug
      setError(err.response?.data?.detail || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError("");
    setLoading(true);

    try {
      await api.post("/administradores/", {
        nome: registerName,
        senha: registerPassword,
      });

      setShowRegister(false);
      setRegisterName("");
      setRegisterPassword("");
      toast.success("Cadastro criado com sucesso!");
    } catch (err: any) {
      setRegisterError(err.response?.data?.detail || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#01083f] 
    via-[#000000] to-[#31020c] animate-gradient flex items-center 
    justify-center"
    >
      <div className="bg-white p-8 rounded-xl shadow-md w-96">
        <h1
          className="text-2xl font-bold mb-6 text-
        bg-gradient-to-r from-yellow-800 via-black/80 to-red-800 bg-clip-text text-transparent
        "
        >
          Super-Ow Escola e INGLÊS
        </h1>

        {showRegister ? (
          <>
            <h1 className="text-2xl font-bold mb-6 text-[#3b3b3b]">
              Cadastrar-se
            </h1>
            <form onSubmit={handleRegister}>
              {registerError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                  {registerError}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Nome de usuário
                </label>
                <input
                  type="text"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Senha</label>
                <input
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                  required
                  autoComplete="off"
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full bg-[#201e3a] text-white py-2 rounded-lg 
            hover:bg-[#020063] disabled:bg-gray-400"
                  disabled={loading}
                >
                  {loading ? "Cadastrando..." : "Criar conta"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-6 text-[#3b3b3b]">Login</h1>
            <form onSubmit={handleLogin}>
              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                  {error}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Usuário</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Senha</label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                    required
                    autoComplete="off"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full bg-[#201e3a] text-white py-2 rounded-lg 
            hover:bg-[#020063] disabled:bg-gray-400"
                  disabled={loading}
                >
                  {loading ? "Entrando..." : "Entrar"}
                </button>
              </div>
            </form>
          </>
        )}

        {/* Mostrar login ou cadastrar */}
        {!showRegister ? (
          <>
            <button
              type="button"
              className="w-full mt-4 text-gray-800 hover:font-semibold"
              onClick={() => setShowRegister(true)}
            >
              Criar conta
            </button>
          </>
        ) : (
          <button
            type="button"
            className="w-full mt-4 text-gray-800 hover:font-semibold"
            onClick={() => setShowRegister(false)}
          >
            Ja tenho conta
          </button>
        )}
      </div>
    </div>
  );
}
