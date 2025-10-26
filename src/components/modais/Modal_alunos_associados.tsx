import { useState, useEffect, useRef } from "react";
import api from "../../services/api_connection";
import { useToast } from "../../hooks/useToast";

interface Aluno {
  id: number;
  nome_completo: string;
  telefone: string;
  foto_perfil: string;
}

interface ModalAlunosAssociadosProps {
  professorId: number;
  professorNome: string;
  onClose: () => void;
}

export default function ModalAlunosAssociados({
  professorId,
  professorNome,
  onClose,
}: ModalAlunosAssociadosProps) {
  const toast = useToast();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [todosAlunos, setTodosAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [associando, setAssociando] = useState(false);
  const [desassociando, setDesassociando] = useState<number | null>(null);
  const [mostrarModalAssociar, setMostrarModalAssociar] = useState(false);
  const [busca, setBusca] = useState("");
  const mouseDownInsideModal = useRef(false);

  const formatarTelefone = (telefone: string | null | undefined): string => {
    if (!telefone) return "";

    const numeros = telefone.replace(/\D/g, "");
    const limitado = numeros.slice(0, 11);

    if (limitado.length <= 2) return limitado;
    if (limitado.length <= 6)
      return `(${limitado.slice(0, 2)}) ${limitado.slice(2)}`;
    if (limitado.length <= 10) {
      return `(${limitado.slice(0, 2)}) ${limitado.slice(
        2,
        6
      )}-${limitado.slice(6)}`;
    }
    return `(${limitado.slice(0, 2)}) ${limitado.slice(2, 7)}-${limitado.slice(
      7
    )}`;
  };

  const carregarAlunos = async () => {
    try {
      const response = await api.get(`/professores/${professorId}/alunos`);
      setAlunos(response.data);
    } catch (err: any) {
      console.error("Erro ao carregar alunos:", err);
      toast.error("Erro ao carregar alunos do professor.");
    } finally {
      setLoading(false);
    }
  };

  const carregarTodosAlunos = async () => {
    try {
      const response = await api.get("/alunos");
      setTodosAlunos(response.data.items || []);
    } catch (err: any) {
      console.error("Erro ao carregar todos os alunos:", err);
      toast.error("Erro ao carregar lista de alunos.");
    }
  };

  useEffect(() => {
    carregarAlunos();
  }, [professorId]);

  useEffect(() => {
    if (mostrarModalAssociar) {
      carregarTodosAlunos();
    }
  }, [mostrarModalAssociar]);

  const handleAssociarAluno = async (alunoId: number) => {
    setAssociando(true);
    try {
      await api.post(`/professores/${professorId}/alunos/${alunoId}`);
      toast.success("Aluno associado com sucesso!");

      // Recarrega a lista de alunos associados
      await carregarAlunos();

      setMostrarModalAssociar(false);
      setBusca("");
    } catch (err: any) {
      console.error("Erro ao associar aluno:", err);
      let mensagemErro = "Erro ao associar aluno. Tente novamente.";
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === "string") {
          mensagemErro = err.response.data.detail;
        }
      }
      toast.error(mensagemErro);
    } finally {
      setAssociando(false);
    }
  };

  const handleDesassociarAluno = async (alunoId: number) => {
    const confirmar = window.confirm(
      "Tem certeza que deseja desassociar este aluno?"
    );
    if (!confirmar) return;

    setDesassociando(alunoId);
    try {
      await api.delete(`/alunos/${alunoId}/professores/${professorId}`);
      toast.success("Aluno desassociado com sucesso!");

      // Recarrega a lista de alunos associados
      await carregarAlunos();
    } catch (err: any) {
      console.error("Erro ao desassociar aluno:", err);
      let mensagemErro = "Erro ao desassociar aluno. Tente novamente.";
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === "string") {
          mensagemErro = err.response.data.detail;
        }
      }
      toast.error(mensagemErro);
    } finally {
      setDesassociando(null);
    }
  };

  // Filtra alunos que NÃO estão associados
  const alunosDisponiveis = todosAlunos.filter(
    (aluno) => !alunos.some((a) => a.id === aluno.id)
  );

  // Filtro por busca
  const alunosFiltrados = alunosDisponiveis.filter((aluno) =>
    aluno.nome_completo.toLowerCase().includes(busca.toLowerCase())
  );

  const handleBackdropMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      mouseDownInsideModal.current = false;
    }
  };

  const handleBackdropMouseUp = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !mouseDownInsideModal.current) {
      onClose();
    }
    mouseDownInsideModal.current = false;
  };

  const handleModalMouseDown = () => {
    mouseDownInsideModal.current = true;
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-[60] pr-4"
        onMouseDown={handleBackdropMouseDown}
        onMouseUp={handleBackdropMouseUp}
      >
        <div
          className="bg-white rounded-lg shadow-2xl w-full max-w-md h-[96vh] overflow-y-auto flex flex-col"
          onMouseDown={handleModalMouseDown}
        >
          {/* Header */}
          <div className="bg-[#1a472f] text-white p-6 rounded-t-lg sticky top-0 z-10">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold">Alunos Associados</h2>
                <p className="text-gray-300 text-sm mt-1">
                  Professor(a): {professorNome}
                </p>
              </div>
              <button
                onClick={() => setMostrarModalAssociar(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                title="Associar novo aluno"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Associar
              </button>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="flex-1 p-6">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : alunos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-16 w-16 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <p className="text-lg font-medium">Nenhum aluno associado</p>
                <p className="text-sm">
                  Este professor ainda não possui alunos
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {alunos.map((aluno) => (
                  <div
                    key={aluno.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      {/* Foto */}
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-300 flex-shrink-0">
                        {aluno.foto_perfil ? (
                          <img
                            src={`data:image/webp;base64,${aluno.foto_perfil}`}
                            alt={aluno.nome_completo}
                            className="w-full h-auto object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-2xl font-bold">
                            {aluno.nome_completo.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Informações */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-800 truncate">
                          {aluno.nome_completo}
                        </h3>
                        <div className="flex items-center gap-2 text-gray-600 mt-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                          <span className="text-sm">
                            {formatarTelefone(aluno.telefone)}
                          </span>
                        </div>
                      </div>

                      {/* Botão Desassociar */}
                      <button
                        onClick={() => handleDesassociarAluno(aluno.id)}
                        disabled={desassociando === aluno.id}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 flex items-center gap-2"
                        title="Desassociar aluno"
                      >
                        {desassociando === aluno.id ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                            <span className="text-sm">Removendo...</span>
                          </>
                        ) : (
                          <>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            <span className="text-sm">Remover</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-4 rounded-b-lg flex justify-between items-center sticky bottom-0">
            <p className="text-sm text-gray-600">
              Total: <span className="font-semibold">{alunos.length}</span>{" "}
              {alunos.length === 1 ? "aluno" : "alunos"}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Associar Aluno */}
      {mostrarModalAssociar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-[#1a472f] text-white p-6 rounded-t-lg sticky top-0 z-10">
              <h2 className="text-2xl font-bold">Associar Aluno</h2>
              <p className="text-gray-300 text-sm mt-1">
                Selecione um aluno para associar ao professor
              </p>
            </div>

            {/* Busca */}
            <div className="p-6 border-b">
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar aluno por nome..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Lista de alunos disponíveis */}
            <div className="p-6 max-h-96 overflow-y-auto">
              {alunosFiltrados.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p className="text-lg">
                    {busca
                      ? "Nenhum aluno encontrado"
                      : "Todos os alunos já estão associados"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alunosFiltrados.map((aluno) => (
                    <div
                      key={aluno.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {/* Foto */}
                        <div className="flex items-center w-12 h-12 rounded-full overflow-hidden border-2 border-gray-300 flex-shrink-0">
                          {aluno.foto_perfil ? (
                            <img
                              src={`data:image/webp;base64,${aluno.foto_perfil}`}
                              alt={aluno.nome_completo}
                              className="w-full h-auto object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xl font-bold">
                              {aluno.nome_completo.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Informações */}
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {aluno.nome_completo}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {formatarTelefone(aluno.telefone)}
                          </p>
                        </div>
                      </div>

                      {/* Botão Associar */}
                      <button
                        onClick={() => handleAssociarAluno(aluno.id)}
                        disabled={associando}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                      >
                        {associando ? "Associando..." : "Associar"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-4 rounded-b-lg flex justify-end sticky bottom-0">
              <button
                onClick={() => {
                  setMostrarModalAssociar(false);
                  setBusca("");
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
