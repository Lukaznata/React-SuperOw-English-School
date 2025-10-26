import { useState, useEffect } from "react";
import api from "../../services/api_connection";
import { useAuth } from "../../contexts/AuthContext";

interface Afazer {
  id: number;
  texto: string;
  status: boolean;
  data_criacao: string;
  administrador_id: number;
}

export default function AfazeresDiarios() {
  const [afazeres, setAfazeres] = useState<Afazer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<number | null>(null);
  const [textoEditado, setTextoEditado] = useState("");
  const [excluindo, setExcluindo] = useState<number | null>(null);
  const [criando, setCriando] = useState(false);
  const [novoTexto, setNovoTexto] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    const fetchAfazeres = async () => {
      if (!user?.id) {
        // Aguarda um pouco mais antes de desistir
        const timeout = setTimeout(() => {
          setLoading(false);
        }, 2000);
        return () => clearTimeout(timeout);
      }

      setLoading(true);
      try {
        const response = await api.get(
          `/afazeres/?administrador_id=${user.id}`
        );
        setAfazeres(response.data.items || []);
      } catch (err) {
        console.error("Erro ao buscar afazeres:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAfazeres();
  }, [user?.id]);

  const toggleStatus = async (afazer: Afazer) => {
    try {
      await api.put(`/afazeres/${afazer.id}`, {
        texto: afazer.texto,
        status: !afazer.status,
        administrador_id: afazer.administrador_id,
      });

      setAfazeres((prev) =>
        prev.map((a) => (a.id === afazer.id ? { ...a, status: !a.status } : a))
      );
    } catch (err) {
      console.error("Erro ao atualizar afazer:", err);
    }
  };

  const desmarcarTodos = async () => {
    // Filtra apenas os afazeres que estão marcados
    const marcados = afazeres.filter((a) => a.status);

    if (marcados.length === 0) {
      alert("Nenhum afazer marcado.");
      return;
    }

    // Confirmação opcional
    const confirmar = window.confirm("Deseja desmarcar todas as tarefas?");
    if (!confirmar) return;

    try {
      // Atualiza todos no backend
      await Promise.all(
        marcados.map((a) =>
          api.put(`/afazeres/${a.id}`, {
            texto: a.texto,
            status: false,
            administrador_id: a.administrador_id,
          })
        )
      );

      // Atualiza o estado local de uma vez
      setAfazeres((prev) => prev.map((a) => ({ ...a, status: false })));
    } catch (err) {
      console.error("Erro ao desmarcar todos:", err);
      alert("Erro ao desmarcar todos.");
    }
  };

  const iniciarEdicao = (afazer: Afazer) => {
    setEditando(afazer.id);
    setTextoEditado(afazer.texto);
  };

  const salvarEdicao = async (afazer: Afazer) => {
    if (!textoEditado.trim()) {
      alert("O texto não pode estar vazio");
      return;
    }

    try {
      await api.put(`/afazeres/${afazer.id}`, {
        texto: textoEditado,
        status: afazer.status,
        administrador_id: afazer.administrador_id,
      });

      setAfazeres((prev) =>
        prev.map((a) =>
          a.id === afazer.id ? { ...a, texto: textoEditado } : a
        )
      );

      setEditando(null);
      setTextoEditado("");
    } catch (err) {
      console.error("Erro ao atualizar afazer:", err);
      alert("Erro ao salvar alterações");
    }
  };

  const cancelarEdicao = () => {
    setEditando(null);
    setTextoEditado("");
  };

  const criarAfazer = async () => {
    if (!novoTexto.trim()) {
      alert("O texto não pode estar vazio");
      return;
    }

    if (!user?.id) {
      alert("Usuário não autenticado");
      return;
    }

    try {
      const response = await api.post("/afazeres/", {
        texto: novoTexto,
        administrador_id: user.id,
      });

      // Adiciona o novo afazer à lista
      setAfazeres((prev) => [...prev, response.data]);

      // Limpa e fecha o formulário
      setNovoTexto("");
      setCriando(false);
    } catch (err) {
      console.error("Erro ao criar afazer:", err);
      alert("Erro ao criar afazer");
    }
  };

  const excluirAfazer = async (afazer: Afazer) => {
    const confirmar = window.confirm(
      `Tem certeza que deseja excluir "${afazer.texto}"?`
    );

    if (!confirmar) return;

    setExcluindo(afazer.id);

    try {
      await api.delete(`/afazeres/${afazer.id}`);

      setAfazeres((prev) => prev.filter((a) => a.id !== afazer.id));
    } catch (err) {
      console.error("Erro ao excluir afazer:", err);
      alert("Erro ao excluir afazer");
    } finally {
      setExcluindo(null);
    }
  };

  // Renderiza loading apenas se realmente estiver carregando dados
  if (loading && user?.id) {
    return (
      <div className="w-full bg-[#14223b] rounded-lg shadow-lg p-4">
        <div className="text-gray-200">Carregando afazeres...</div>
      </div>
    );
  }

  // Se não tem user, mostra mensagem específica
  if (!user?.id) {
    return (
      <div className="w-full bg-[#14223b] rounded-lg shadow-lg p-4">
        <div className="text-gray-200">Aguardando autenticação...</div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#14223b] rounded-lg shadow-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-bold text-white">Afazeres diários</h2>
        <div className="flex gap-2">
          {!criando && (
            <button
              onClick={() => setCriando(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg 
            hover:bg-green-700
            transition-colors font-medium"
            >
              + Nova Tarefa
            </button>
          )}
          <button
            onClick={desmarcarTodos}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg 
      hover:bg-yellow-700 transition-colors font-medium"
          >
            Desmarcar Todos
          </button>
        </div>
      </div>
      <div className="flex gap-2">
        {criando && (
          <div className="mb-4 p-4 bg-white rounded-lg border-2 border-blue-500">
            <input
              type="text"
              value={novoTexto}
              onChange={(e) => setNovoTexto(e.target.value)}
              placeholder="Digite a nova tarefa..."
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") criarAfazer();
                if (e.key === "Escape") {
                  setCriando(false);
                  setNovoTexto("");
                }
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={criarAfazer}
                className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Criar
              </button>
              <button
                onClick={() => {
                  setCriando(false);
                  setNovoTexto("");
                }}
                className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {afazeres.length === 0 ? (
        <div className="text-gray-200 text-lg">Nenhum afazer para hoje 🎉</div>
      ) : (
        <div className="flex flex-col gap-5 pb-2 items-center">
          {afazeres.map((afazer) => (
            <div
              key={afazer.id}
              onClick={() => iniciarEdicao(afazer)}
              className={`
                flex-shrink-0 px-4 py-3 rounded-xl border-2 cursor-pointer
                transition-all duration-200 w-[96%]
                ${
                  afazer.status
                    ? "bg-green-50 border-green-500"
                    : "bg-[#f0f0f0] border-[#14223b]"
                }
                ${
                  editando === afazer.id
                    ? "shadow-lg"
                    : "hover:shadow-md hover:bg-[#4a4d68] hover:text-[#fff]"
                }
              `}
            >
              {editando === afazer.id ? (
                // Modo de edição
                <div className="space-y-2">
                  <input
                    type="text"
                    value={textoEditado}
                    onChange={(e) => setTextoEditado(e.target.value)}
                    className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") salvarEdicao(afazer);
                      if (e.key === "Escape") cancelarEdicao();
                    }}
                  />
                  <div className="flex gap-2 w-[20%]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        salvarEdicao(afazer);
                      }}
                      className="flex-1 px-2 py-1 bg-blue-500 text-white 
                      text-xs rounded hover:bg-blue-600 hover:text-[#fff]"
                    >
                      Salvar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        cancelarEdicao();
                      }}
                      className="flex-1 px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                // Modo de visualização
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-medium flex-1 ${
                      afazer.status ? "line-through text-gray-500" : ""
                    }`}
                  >
                    {afazer.texto}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      excluirAfazer(afazer);
                    }}
                    disabled={excluindo === afazer.id}
                    className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-red-700 
                    disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {excluindo === afazer.id ? "..." : "🗑️"}
                  </button>

                  <input
                    type="checkbox"
                    checked={afazer.status}
                    onChange={() => toggleStatus(afazer)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-6 h-6 cursor-pointer"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
