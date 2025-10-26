import { useState, useEffect, useRef } from "react";
import api from "../../services/api_connection";
import { useToast } from "../../hooks/useToast";

interface Aluno {
  id: number;
  nome_completo: string;
  foto_perfil: string;
}

interface Mensalidade {
  id: number;
  aluno_id: number;
  data: string;
  status: string;
  valor: number;
}

interface ModalMensalidadeProps {
  aluno: Aluno;
  onClose: () => void;
}

export default function ModalMensalidade({
  aluno,
  onClose,
}: ModalMensalidadeProps) {
  const toast = useToast();
  const [mensalidades, setMensalidades] = useState<Mensalidade[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState<Mensalidade | null>(null);
  const mouseDownInsideModal = useRef(false);

  // Estados do formulário
  const [data, setData] = useState("");
  const [status, setStatus] = useState("pendente");
  const [valor, setValor] = useState("");

  // Função para verificar e atualizar mensalidades atrasadas
  const verificarEAtualizarAtrasadas = async (mensalidades: Mensalidade[]) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const mensalidadesParaAtualizar = mensalidades.filter((mensalidade) => {
      const dataMensalidade = new Date(mensalidade.data);
      dataMensalidade.setHours(0, 0, 0, 0);

      // Se a data é anterior a hoje e o status não é "pago" nem "atrasado"
      return (
        dataMensalidade < hoje &&
        mensalidade.status.toLowerCase() !== "pago" &&
        mensalidade.status.toLowerCase() !== "atrasado"
      );
    });

    if (mensalidadesParaAtualizar.length > 0) {
      try {
        await Promise.all(
          mensalidadesParaAtualizar.map((mensalidade) =>
            api.put(`/mensalidades/${mensalidade.id}`, {
              data: mensalidade.data,
              status: "atrasado",
              valor: mensalidade.valor,
            })
          )
        );
        return true;
      } catch (err) {
        console.error("Erro ao atualizar mensalidades atrasadas:", err);
      }
    }
    return false;
  };

  // Carregar mensalidades do aluno
  const carregarMensalidades = async () => {
    setCarregando(true);
    try {
      const response = await api.get(`/mensalidades/aluno/${aluno.id}`);
      const mensalidadesCarregadas = response.data || [];

      // Verificar e atualizar mensalidades atrasadas
      const foiAtualizado = await verificarEAtualizarAtrasadas(
        mensalidadesCarregadas
      );

      if (foiAtualizado) {
        // Recarregar para pegar os dados atualizados
        const responseAtualizada = await api.get(
          `/mensalidades/aluno/${aluno.id}`
        );
        setMensalidades(responseAtualizada.data || []);
      } else {
        setMensalidades(mensalidadesCarregadas);
      }
    } catch (err) {
      console.error("Erro ao carregar mensalidades:", err);
      toast.error("Erro ao carregar mensalidades.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarMensalidades();
  }, [aluno.id]);

  // Calcular totais
  const calcularTotais = () => {
    const pagas = mensalidades.filter((m) => m.status.toLowerCase() === "pago");
    const atrasadas = mensalidades.filter(
      (m) => m.status.toLowerCase() === "atrasado"
    );

    return {
      total: mensalidades.length,
      pagas: pagas.length,
      atrasadas: atrasadas.length,
      valorPago: pagas.reduce((sum, m) => sum + m.valor, 0),
      valorAtrasado: atrasadas.reduce((sum, m) => sum + m.valor, 0),
    };
  };

  // Abrir formulário para criar
  const handleNovaMensalidade = () => {
    setEditando(null);
    setData("");
    setStatus("pendente");
    setValor("");
    setMostrarFormulario(true);
  };

  // Abrir formulário para editar
  const handleEditarMensalidade = (mensalidade: Mensalidade) => {
    setEditando(mensalidade);
    setData(mensalidade.data);
    setStatus(mensalidade.status);
    setValor(mensalidade.valor.toString());
    setMostrarFormulario(true);
  };

  // Salvar mensalidade (criar ou atualizar)
  const handleSalvar = async () => {
    if (!data || !valor) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    const valorNumerico = parseFloat(valor);
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      toast.error("Valor inválido.");
      return;
    }

    setCarregando(true);

    try {
      if (editando) {
        // Atualizar
        await api.put(`/mensalidades/${editando.id}`, {
          data,
          status,
          valor: valorNumerico,
        });
        toast.success("Mensalidade atualizada com sucesso!");
      } else {
        // Criar
        await api.post("/mensalidades", {
          aluno_id: aluno.id,
          data,
          status,
          valor: valorNumerico,
        });
        toast.success("Mensalidade criada com sucesso!");
      }

      setMostrarFormulario(false);
      carregarMensalidades();
    } catch (err: any) {
      console.error("Erro ao salvar mensalidade:", err);
      toast.error(err.response?.data?.detail || "Erro ao salvar mensalidade.");
    } finally {
      setCarregando(false);
    }
  };

  // Excluir mensalidade
  const handleExcluir = async (id: number) => {
    const confirmar = window.confirm(
      "Tem certeza que deseja excluir esta mensalidade?"
    );
    if (!confirmar) return;

    setCarregando(true);
    try {
      await api.delete(`/mensalidades/${id}`);
      toast.success("Mensalidade excluída com sucesso!");
      carregarMensalidades();
    } catch (err) {
      console.error("Erro ao excluir mensalidade:", err);
      toast.error("Erro ao excluir mensalidade.");
    } finally {
      setCarregando(false);
    }
  };

  const totais = calcularTotais();

  // Formatar data para exibição
  const formatarData = (dataStr: string): string => {
    const [ano, mes, dia] = dataStr.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  // Cor do badge de status
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case "pago":
        return "bg-green-100 text-green-800";
      case "atrasado":
        return "bg-red-100 text-red-800";
      case "pendente":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Handlers para fechar ao clicar fora
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
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onMouseDown={handleBackdropMouseDown}
      onMouseUp={handleBackdropMouseUp}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col"
        onMouseDown={handleModalMouseDown}
      >
        {/* Cabeçalho - Fixo */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-t-lg flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-lg flex-shrink-0 flex items-center">
                {aluno.foto_perfil ? (
                  <img
                    src={`data:image/webp;base64,${aluno.foto_perfil}`}
                    alt={aluno.nome_completo}
                    className="w-full h-auto object-center"
                  />
                ) : (
                  <div className="w-full h-full bg-purple-300 flex items-center justify-center text-purple-700 text-2xl font-bold">
                    {aluno.nome_completo.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold">Mensalidades</h2>
                <p className="text-purple-100">{aluno.nome_completo}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-purple-800 rounded-full p-2 transition-colors flex-shrink-0"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Cards de Resumo - Fixo */}
        <div className="p-6 bg-gray-50 border-b flex-shrink-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Total</p>
              <p className="text-2xl font-bold text-blue-600">{totais.total}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Pagas</p>
              <p className="text-2xl font-bold text-green-600">
                {totais.pagas}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                R$ {totais.valorPago.toFixed(2)}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Atrasadas</p>
              <p className="text-2xl font-bold text-red-600">
                {totais.atrasadas}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                R$ {totais.valorAtrasado.toFixed(2)}
              </p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-600">
                {totais.total - totais.pagas - totais.atrasadas}
              </p>
            </div>
          </div>
        </div>

        {/* Conteúdo - Com Scroll */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Botão Nova Mensalidade */}
          {!mostrarFormulario && (
            <div className="mb-6">
              <button
                onClick={handleNovaMensalidade}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2"
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
                Nova Mensalidade
              </button>
            </div>
          )}

          {/* Formulário */}
          {mostrarFormulario && (
            <div className="mb-6 border border-gray-200 rounded-lg p-6 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                {editando ? "Editar Mensalidade" : "Nova Mensalidade"}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data *
                  </label>
                  <input
                    type="date"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="pago">Pago</option>
                    <option value="atrasado">Atrasado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSalvar}
                  disabled={carregando}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                >
                  {carregando ? "Salvando..." : "Salvar"}
                </button>
                <button
                  onClick={() => setMostrarFormulario(false)}
                  disabled={carregando}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Lista de Mensalidades */}
          {carregando && !mostrarFormulario ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : mensalidades.length === 0 ? (
            <div className="text-center py-12">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mx-auto text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-500 text-lg font-medium">
                Nenhuma mensalidade encontrada
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Clique em "Nova Mensalidade" para adicionar
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {mensalidades
                .sort(
                  (a, b) =>
                    new Date(b.data).getTime() - new Date(a.data).getTime()
                )
                .map((mensalidade) => (
                  <div
                    key={mensalidade.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="text-center flex-shrink-0">
                          <p className="text-2xl font-bold text-gray-800">
                            {formatarData(mensalidade.data).split("/")[0]}
                          </p>
                          <p className="text-lg text-gray-500">
                            {formatarData(mensalidade.data)
                              .split("/")
                              .slice(1)
                              .join("/")}
                          </p>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                                mensalidade.status
                              )}`}
                            >
                              {mensalidade.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-2xl font-bold text-purple-600">
                            R$ {mensalidade.valor.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleEditarMensalidade(mensalidade)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
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
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleExcluir(mensalidade.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Rodapé - Fixo */}
        <div className="bg-gray-50 p-4 rounded-b-lg border-t flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
