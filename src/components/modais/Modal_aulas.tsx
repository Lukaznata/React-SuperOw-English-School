import { useState, useEffect, useRef } from "react";
import api from "../../services/api_connection";
import { useToast } from "../../hooks/useToast";

interface Professor {
  id: number;
  nome_completo: string;
  foto_perfil: string;
  id_idioma: number;
}

interface Aluno {
  id: number;
  nome_completo: string;
  foto_perfil: string;
}

interface AulaDetalhada {
  id: number;
  professor_id: number;
  professor: Professor;
  data_aula: string;
  idioma: string;
  valor_professor: number;
  valor_escola: number;
  status: boolean;
  alunos: Aluno[];
}

interface ModalAulasProps {
  dia: Date;
  horario: string;
  onClose: () => void;
  onAulaAtualizada: () => void;
}

export default function ModalAulas({
  dia,
  horario,
  onClose,
  onAulaAtualizada,
}: ModalAulasProps) {
  const toast = useToast();
  const mouseDownInsideModal = useRef(false);

  // Estados
  const [aulas, setAulas] = useState<AulaDetalhada[]>([]);
  const [aulaSelecionada, setAulaSelecionada] = useState<AulaDetalhada | null>(
    null
  );
  const [carregando, setCarregando] = useState(true);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [removendoAluno, setRemovendoAluno] = useState<number | null>(null);

  // Dados editados
  const [dataEdit, setDataEdit] = useState("");
  const [horaEdit, setHoraEdit] = useState("");
  const [valorProfessorEdit, setValorProfessorEdit] = useState(0);
  const [valorEscolaEdit, setValorEscolaEdit] = useState(0);
  const [professorEdit, setProfessorEdit] = useState<Professor | null>(null);

  // Professores disponíveis
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [mostrarListaProfessores, setMostrarListaProfessores] = useState(false);
  const [buscaProfessor, setBuscaProfessor] = useState("");

  // Estados para Modal de Alunos
  const [mostrarListaAlunos, setMostrarListaAlunos] = useState(false);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [buscaAluno, setBuscaAluno] = useState("");
  const [adicionandoAluno, setAdicionandoAluno] = useState(false);

  // Carregar aulas do horário
  const carregarAulas = async () => {
    setCarregando(true);
    try {
      const response = await api.get("/aulas");
      const todasAulas = response.data.items || response.data || [];

      // Filtrar aulas do dia e horário específicos
      const aulasFiltradas = todasAulas.filter((aula: any) => {
        const dataAula = parseDataAula(aula.data_aula);
        if (!dataAula) return false;

        const horarioAula = `${dataAula
          .getHours()
          .toString()
          .padStart(2, "0")}:${dataAula
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;

        return (
          dataAula.getDate() === dia.getDate() &&
          dataAula.getMonth() === dia.getMonth() &&
          dataAula.getFullYear() === dia.getFullYear() &&
          horarioAula === horario
        );
      });

      // Carregar detalhes de cada aula (professor e alunos)
      const aulasDetalhadas = await Promise.all(
        aulasFiltradas.map(async (aula: any) => {
          try {
            const [resProfessor, resAlunos] = await Promise.all([
              api.get(`/professores/${aula.professor_id}`),
              api.get(`/aulas/${aula.id}/alunos`),
            ]);

            return {
              ...aula,
              professor: resProfessor.data,
              alunos: resAlunos.data || [],
            };
          } catch (err) {
            console.error("Erro ao carregar detalhes da aula:", err);
            return {
              ...aula,
              professor: null,
              alunos: [],
            };
          }
        })
      );

      setAulas(aulasDetalhadas);
    } catch (err) {
      console.error("Erro ao carregar aulas:", err);
      toast.error("Erro ao carregar aulas.");
    } finally {
      setCarregando(false);
    }
  };

  // Carregar professores
  const carregarProfessores = async () => {
    try {
      const response = await api.get("/professores");
      setProfessores(
        (response.data.items || response.data || []).filter(
          (p: any) => p.situacao
        )
      );
    } catch (err) {
      console.error("Erro ao carregar professores:", err);
    }
  };

  // Carregar alunos
  const carregarAlunos = async () => {
    try {
      const response = await api.get("/alunos");
      setAlunos(
        (response.data.items || response.data || []).filter(
          (a: any) => a.situacao
        )
      );
    } catch (err) {
      console.error("Erro ao carregar alunos:", err);
    }
  };

  useEffect(() => {
    carregarAulas();
    carregarProfessores();
    carregarAlunos();
  }, []);

  // Adicionar aluno à aula
  const handleAdicionarAluno = async (aluno: Aluno) => {
    if (!aulaSelecionada) return;

    const confirmar = window.confirm(
      `Adicionar ${aluno.nome_completo} a esta aula?`
    );
    if (!confirmar) return;

    setAdicionandoAluno(true);
    try {
      await api.post(`/aulas/${aulaSelecionada.id}/alunos/${aluno.id}`);
      toast.success(`${aluno.nome_completo} adicionado(a) à aula!`);

      // Atualizar lista de alunos da aula
      setAulaSelecionada({
        ...aulaSelecionada,
        alunos: [...aulaSelecionada.alunos, aluno],
      });

      setMostrarListaAlunos(false);
      onAulaAtualizada();
    } catch (err: any) {
      console.error("Erro ao adicionar aluno:", err);
      toast.error("Erro ao adicionar aluno à aula.");
    } finally {
      setAdicionandoAluno(false);
    }
  };

  // Parse de data
  const parseDataAula = (dataStr: string): Date | null => {
    try {
      const [datePart, timePart] = dataStr.split(" ");
      const [dia, mes, ano] = datePart.split("/");
      const [hora, minuto] = timePart.split(":");

      return new Date(
        parseInt(ano),
        parseInt(mes) - 1,
        parseInt(dia),
        parseInt(hora),
        parseInt(minuto)
      );
    } catch {
      return null;
    }
  };

  // Selecionar aula
  const handleSelecionarAula = (aula: AulaDetalhada) => {
    setAulaSelecionada(aula);

    // Preparar dados para edição
    const dataAula = parseDataAula(aula.data_aula);
    if (dataAula) {
      const ano = dataAula.getFullYear();
      const mes = String(dataAula.getMonth() + 1).padStart(2, "0");
      const dia = String(dataAula.getDate()).padStart(2, "0");
      const hora = String(dataAula.getHours()).padStart(2, "0");
      const minuto = String(dataAula.getMinutes()).padStart(2, "0");

      setDataEdit(`${ano}-${mes}-${dia}`);
      setHoraEdit(`${hora}:${minuto}`);
    }

    // Garantir que os valores sejam números
    setValorProfessorEdit(Number(aula.valor_professor) || 0);
    setValorEscolaEdit(Number(aula.valor_escola) || 0);
    setProfessorEdit(aula.professor);
  };

  // Voltar para lista
  const handleVoltar = () => {
    setAulaSelecionada(null);
    setModoEdicao(false);
    carregarAulas();
  };

  // Remover aluno
  const handleRemoverAluno = async (alunoId: number) => {
    if (!aulaSelecionada) return;

    const confirmar = window.confirm(
      "Tem certeza que deseja remover este aluno da aula?"
    );
    if (!confirmar) return;

    setRemovendoAluno(alunoId);
    try {
      await api.delete(`/aulas/${aulaSelecionada.id}/alunos/${alunoId}`);
      toast.success("Aluno removido da aula!");

      // Atualizar lista de alunos
      setAulaSelecionada({
        ...aulaSelecionada,
        alunos: aulaSelecionada.alunos.filter((a) => a.id !== alunoId),
      });

      onAulaAtualizada();
    } catch (err: any) {
      console.error("Erro ao remover aluno:", err);
      toast.error("Erro ao remover aluno da aula.");
    } finally {
      setRemovendoAluno(null);
    }
  };

  // Salvar alterações
  const handleSalvar = async () => {
    if (!aulaSelecionada) return;

    setSalvando(true);
    try {
      const dataHoraISO = `${dataEdit}T${horaEdit}:00-03:00`;

      const dadosAtualizados = {
        professor_id: professorEdit?.id || aulaSelecionada.professor_id,
        data_aula: dataHoraISO,
        idioma: aulaSelecionada.idioma,
        valor_professor: valorProfessorEdit,
        valor_escola: valorEscolaEdit,
        status: aulaSelecionada.status,
        repetir_dia: false,
      };

      await api.put(`/aulas/${aulaSelecionada.id}`, dadosAtualizados);
      toast.success("Aula atualizada com sucesso!");

      setModoEdicao(false);
      onAulaAtualizada();
      handleVoltar();
    } catch (err: any) {
      console.error("Erro ao atualizar aula:", err);
      toast.error("Erro ao atualizar aula.");
    } finally {
      setSalvando(false);
    }
  };

  // Excluir aula
  const handleExcluirAula = async (aulaId: number) => {
    const confirmar = window.confirm(
      "Tem certeza que deseja excluir esta aula?"
    );
    if (!confirmar) return;

    try {
      await api.delete(`/aulas/${aulaId}`);
      toast.success("Aula excluída com sucesso!");
      onAulaAtualizada();
      onClose();
    } catch (err: any) {
      console.error("Erro ao excluir aula:", err);
      toast.error("Erro ao excluir aula.");
    }
  };

  // Handlers de modal
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

  // Filtrar professores
  const professoresFiltrados = professores.filter((prof) =>
    prof.nome_completo.toLowerCase().includes(buscaProfessor.toLowerCase())
  );

  // Filtrar alunos (remover os que já estão na aula)
  const alunosFiltrados = alunos.filter(
    (aluno) =>
      aluno.nome_completo.toLowerCase().includes(buscaAluno.toLowerCase()) &&
      !aulaSelecionada?.alunos.some((a) => a.id === aluno.id)
  );

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onMouseDown={handleBackdropMouseDown}
        onMouseUp={handleBackdropMouseUp}
      >
        <div
          className="bg-white rounded-lg shadow-2xl max-w-4xl w-full mx-4 max-h-[96vh] overflow-hidden"
          onMouseDown={handleModalMouseDown}
        >
          {/* Lista de Aulas */}
          <div
            className={`transition-transform duration-300 ${
              aulaSelecionada ? "hidden" : "block"
            }`}
          >
            {/* Header */}
            <div className="bg-[#1a472f] text-white p-6 rounded-t-lg">
              <h2 className="text-2xl font-bold">
                Aulas -{" "}
                {dia.toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                })}
              </h2>
              <p className="text-gray-300 text-sm mt-1">Horário: {horario}</p>
            </div>

            {/* Conteúdo */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {carregando ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
              ) : aulas.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Nenhuma aula encontrada neste horário
                </p>
              ) : (
                <div className="space-y-4">
                  {aulas.map((aula) => (
                    <div
                      key={aula.id}
                      onClick={() => handleSelecionarAula(aula)}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md cursor-pointer transition-all hover:border-green-500"
                    >
                      {/* Professor */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-300 flex items-center">
                          {aula.professor?.foto_perfil ? (
                            <img
                              src={`data:image/webp;base64,${aula.professor.foto_perfil}`}
                              alt={aula.professor.nome_completo}
                              className="w-full h-auto object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-2xl font-bold">
                              {aula.professor?.nome_completo
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {aula.professor?.nome_completo}
                          </h3>
                          <p className="text-sm text-gray-500">{aula.idioma}</p>
                        </div>
                      </div>

                      {/* Alunos */}
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">
                          Alunos ({aula.alunos.length}):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {aula.alunos.length === 0 ? (
                            <span className="text-sm text-gray-400">
                              Nenhum aluno
                            </span>
                          ) : (
                            aula.alunos.map((aluno) => (
                              <div
                                key={aluno.id}
                                className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1"
                              >
                                <div className="w-10 h-10 rounded-full flex items-center overflow-hidden border border-gray-300">
                                  {aluno.foto_perfil ? (
                                    <img
                                      src={`data:image/webp;base64,${aluno.foto_perfil}`}
                                      alt={aluno.nome_completo}
                                      className="w-full h-auto object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-bold">
                                      {aluno.nome_completo
                                        .charAt(0)
                                        .toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                <span className="text-sm">
                                  {aluno.nome_completo}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Botão Excluir */}
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExcluirAula(aula.id);
                          }}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                          Excluir Aula
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-4 rounded-b-lg flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>

          {/* Detalhes da Aula */}
          {aulaSelecionada && (
            <div className="flex flex-col max-h-[96vh]">
              {/* Header */}
              <div className="bg-blue-600 text-white p-6 flex-shrink-0">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleVoltar}
                    className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
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
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <h2 className="text-2xl font-bold">Detalhes da Aula</h2>
                </div>
              </div>

              {/* Conteúdo com scroll */}
              <div
                className="p-6 overflow-y-auto flex-1"
                style={{ maxHeight: "calc(96vh - 180px)" }}
              >
                {/* Professor */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Professor
                  </label>
                  {modoEdicao ? (
                    <div>
                      {professorEdit ? (
                        <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-300 flex items-center">
                              {professorEdit.foto_perfil ? (
                                <img
                                  src={`data:image/webp;base64,${professorEdit.foto_perfil}`}
                                  alt={professorEdit.nome_completo}
                                  className="w-full h-auto object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 font-bold">
                                  {professorEdit.nome_completo
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                              )}
                            </div>
                            <p className="font-semibold">
                              {professorEdit.nome_completo}
                            </p>
                          </div>
                          <button
                            onClick={() => setMostrarListaProfessores(true)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            Trocar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setMostrarListaProfessores(true)}
                          className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                        >
                          Selecionar Professor
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-300 flex items-center">
                        {aulaSelecionada.professor?.foto_perfil ? (
                          <img
                            src={`data:image/webp;base64,${aulaSelecionada.professor.foto_perfil}`}
                            alt={aulaSelecionada.professor.nome_completo}
                            className="w-full h-auto object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xl font-bold">
                            {aulaSelecionada.professor?.nome_completo
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">
                          {aulaSelecionada.professor?.nome_completo}
                        </p>
                        <p className="text-sm text-gray-500">
                          {aulaSelecionada.idioma}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Data e Hora */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data
                    </label>
                    {modoEdicao ? (
                      <input
                        type="date"
                        value={dataEdit}
                        onChange={(e) => setDataEdit(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-50">
                        {parseDataAula(
                          aulaSelecionada.data_aula
                        )?.toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hora
                    </label>
                    {modoEdicao ? (
                      <input
                        type="time"
                        value={horaEdit}
                        onChange={(e) => setHoraEdit(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-50">
                        {horario}
                      </p>
                    )}
                  </div>
                </div>

                {/* Valores */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor Professor
                    </label>
                    {modoEdicao ? (
                      <input
                        type="number"
                        value={valorProfessorEdit}
                        onChange={(e) =>
                          setValorProfessorEdit(Number(e.target.value))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-50">
                        R${" "}
                        {(Number(aulaSelecionada.valor_professor) || 0).toFixed(
                          2
                        )}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor Escola
                    </label>
                    {modoEdicao ? (
                      <input
                        type="number"
                        value={valorEscolaEdit}
                        onChange={(e) =>
                          setValorEscolaEdit(Number(e.target.value))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="px-4 py-2 border border-gray-200 rounded-lg bg-gray-50">
                        R${" "}
                        {(Number(aulaSelecionada.valor_escola) || 0).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Alunos */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Alunos da Aula
                    </label>
                    <button
                      onClick={() => setMostrarListaAlunos(true)}
                      className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-1"
                    >
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
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Adicionar Aluno
                    </button>
                  </div>
                  {aulaSelecionada.alunos.length === 0 ? (
                    <p className="text-center text-gray-500 py-4 border border-gray-200 rounded-lg">
                      Nenhum aluno nesta aula
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {aulaSelecionada.alunos.map((aluno) => (
                        <div
                          key={aluno.id}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-300 flex items-center">
                              {aluno.foto_perfil ? (
                                <img
                                  src={`data:image/webp;base64,${aluno.foto_perfil}`}
                                  alt={aluno.nome_completo}
                                  className="w-full h-auto object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 font-bold">
                                  {aluno.nome_completo.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <p className="font-semibold">
                              {aluno.nome_completo}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoverAluno(aluno.id)}
                            disabled={removendoAluno === aluno.id}
                            className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 text-sm"
                          >
                            {removendoAluno === aluno.id
                              ? "Removendo..."
                              : "Remover"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 p-4 flex-shrink-0 flex justify-end gap-2 border-t">
                {modoEdicao ? (
                  <>
                    <button
                      onClick={() => setModoEdicao(false)}
                      className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      disabled={salvando}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSalvar}
                      disabled={salvando}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                    >
                      {salvando ? "Salvando..." : "Salvar"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleVoltar}
                      className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={() => setModoEdicao(true)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Editar
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Selecionar Professor */}
      {mostrarListaProfessores && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="bg-blue-600 text-white p-6 rounded-t-lg sticky top-0 z-10">
              <h2 className="text-2xl font-bold">Trocar Professor</h2>
            </div>

            <div className="p-6 border-b">
              <input
                type="text"
                value={buscaProfessor}
                onChange={(e) => setBuscaProfessor(e.target.value)}
                placeholder="Buscar professor por nome..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              {professoresFiltrados.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Nenhum professor encontrado
                </p>
              ) : (
                <div className="space-y-3">
                  {professoresFiltrados.map((prof) => (
                    <div
                      key={prof.id}
                      onClick={() => {
                        setProfessorEdit(prof);
                        setMostrarListaProfessores(false);
                        setBuscaProfessor("");
                      }}
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-300 flex items-center">
                        {prof.foto_perfil ? (
                          <img
                            src={`data:image/webp;base64,${prof.foto_perfil}`}
                            alt={prof.nome_completo}
                            className="w-full h-auto object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xl font-bold">
                            {prof.nome_completo.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{prof.nome_completo}</h3>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-b-lg flex justify-end">
              <button
                onClick={() => {
                  setMostrarListaProfessores(false);
                  setBuscaProfessor("");
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar Alunos */}
      {mostrarListaAlunos && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="bg-green-600 text-white p-6 rounded-t-lg sticky top-0 z-10">
              <h2 className="text-2xl font-bold">Adicionar Alunos</h2>
            </div>

            <div className="p-6 border-b">
              <input
                type="text"
                value={buscaAluno}
                onChange={(e) => setBuscaAluno(e.target.value)}
                placeholder="Buscar aluno por nome..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              {adicionandoAluno ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
              ) : alunosFiltrados.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  {buscaAluno
                    ? "Nenhum aluno encontrado"
                    : "Todos os alunos já estão nesta aula"}
                </p>
              ) : (
                <div className="space-y-3">
                  {alunosFiltrados.map((aluno) => (
                    <div
                      key={aluno.id}
                      onClick={() => handleAdicionarAluno(aluno)}
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-green-50 cursor-pointer transition-colors"
                    >
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-300 flex items-center">
                        {aluno.foto_perfil ? (
                          <img
                            src={`data:image/webp;base64,${aluno.foto_perfil}`}
                            alt={aluno.nome_completo}
                            className="w-full h-auto object-center"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xl font-bold">
                            {aluno.nome_completo.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{aluno.nome_completo}</h3>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-b-lg flex justify-end">
              <button
                onClick={() => {
                  setMostrarListaAlunos(false);
                  setBuscaAluno("");
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
