import { useState, useEffect, useRef } from "react";
import api from "../../services/api_connection";
import { useToast } from "../../hooks/useToast";

interface Professor {
  id: number;
  nome_completo: string;
  foto_perfil: string;
  id_idioma: number;
  situacao: boolean;
}

interface Aluno {
  id: number;
  nome_completo: string;
  foto_perfil: string;
  situacao: boolean;
}

interface Idioma {
  id: number;
  nome_idioma: string;
}

interface ModalAdicionarAulaProps {
  onClose: () => void;
  onAulaAdicionada: () => void;
}

export default function ModalAdicionarAula({
  onClose,
  onAulaAdicionada,
}: ModalAdicionarAulaProps) {
  const toast = useToast();
  const mouseDownInsideModal = useRef(false);

  // Estados principais
  const [professorSelecionado, setProfessorSelecionado] =
    useState<Professor | null>(null);
  const [dataAula, setDataAula] = useState("");
  const [horaAula, setHoraAula] = useState("");
  const [valorProfessor, setValorProfessor] = useState(40);
  const [valorEscola, setValorEscola] = useState(40);
  const [repetirDia, setRepetirDia] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [aulaCriada, setAulaCriada] = useState(false);
  const [idsAulasCriadas, setIdsAulasCriadas] = useState<number[]>([]);

  // Estados dos modais internos
  const [mostrarListaProfessores, setMostrarListaProfessores] = useState(false);
  const [mostrarListaAlunos, setMostrarListaAlunos] = useState(false);

  // Dados carregados
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [idiomas, setIdiomas] = useState<Idioma[]>([]);
  const [carregando, setCarregando] = useState(false);

  // Busca
  const [buscaProfessor, setBuscaProfessor] = useState("");
  const [buscaAluno, setBuscaAluno] = useState("");

  // Carregar dados
  useEffect(() => {
    const carregarDados = async () => {
      setCarregando(true);
      try {
        const [resProfessores, resAlunos, resIdiomas] = await Promise.all([
          api.get("/professores"),
          api.get("/alunos"),
          api.get("/idiomas"),
        ]);

        setProfessores(
          (resProfessores.data.items || resProfessores.data || []).filter(
            (p: Professor) => p.situacao
          )
        );
        setAlunos(
          (resAlunos.data.items || resAlunos.data || []).filter(
            (a: Aluno) => a.situacao
          )
        );
        setIdiomas(resIdiomas.data || []);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        toast.error("Erro ao carregar dados.");
      } finally {
        setCarregando(false);
      }
    };
    carregarDados();
  }, []);

  // Filtrar professores
  const professoresFiltrados = professores.filter((prof) =>
    prof.nome_completo.toLowerCase().includes(buscaProfessor.toLowerCase())
  );

  // Filtrar alunos
  const alunosFiltrados = alunos.filter((aluno) =>
    aluno.nome_completo.toLowerCase().includes(buscaAluno.toLowerCase())
  );

  // Obter nome do idioma
  const getIdiomaName = (idIdioma: number): string => {
    return idiomas.find((i) => i.id === idIdioma)?.nome_idioma || "N/A";
  };

  // Criar aula
  const handleCriarAula = async () => {
    // Validações
    if (!professorSelecionado) {
      toast.error("Selecione um professor.");
      return;
    }
    if (!dataAula || !horaAula) {
      toast.error("Preencha a data e hora da aula.");
      return;
    }

    // Confirmação se repetir dia
    if (repetirDia) {
      const confirmar = window.confirm(
        "Esta aula será inserida no mesmo dia da semana e horário pelos próximos 3 meses. Tem certeza que deseja repetir o dia?"
      );
      if (!confirmar) return;
    }

    setSalvando(true);
    try {
      const idsAulas: number[] = [];

      if (repetirDia) {
        // Criar aulas para os próximos 3 meses (mesma hora, mesmo dia da semana)
        const dataInicial = new Date(`${dataAula}T${horaAula}`);
        const datasParaCriar: Date[] = [dataInicial];

        // Calcular as próximas 12 semanas (aproximadamente 3 meses)
        for (let i = 1; i <= 12; i++) {
          const proximaData = new Date(dataInicial);
          proximaData.setDate(dataInicial.getDate() + i * 7); // Adiciona 7 dias por semana
          datasParaCriar.push(proximaData);
        }

        // Criar todas as aulas
        let aulasComSucesso = 0;
        let aulasComErro = 0;

        for (const data of datasParaCriar) {
          try {
            // Formatar data manualmente para evitar conversão de timezone
            const ano = data.getFullYear();
            const mes = String(data.getMonth() + 1).padStart(2, "0");
            const dia = String(data.getDate()).padStart(2, "0");
            const hora = String(data.getHours()).padStart(2, "0");
            const minuto = String(data.getMinutes()).padStart(2, "0");
            const segundo = String(data.getSeconds()).padStart(2, "0");

            const dataHoraISO = `${ano}-${mes}-${dia}T${hora}:${minuto}:${segundo}-03:00`;

            const dadosAula = {
              professor_id: professorSelecionado.id,
              data_aula: dataHoraISO,
              idioma: getIdiomaName(professorSelecionado.id_idioma),
              valor_professor: valorProfessor,
              valor_escola: valorEscola,
              status: true,
              repetir_dia: false,
            };

            const response = await api.post("/aulas", dadosAula);

            if (response.data.id) {
              idsAulas.push(response.data.id);
              aulasComSucesso++;
            }
          } catch (err) {
            console.error("Erro ao criar aula na data:", data, err);
            aulasComErro++;
          }
        }

        setIdsAulasCriadas(idsAulas);
        setAulaCriada(true);
        if (onAulaAdicionada) onAulaAdicionada();

        if (aulasComErro > 0) {
          toast.warning(
            `${aulasComSucesso} aulas criadas com sucesso. ${aulasComErro} falharam.`
          );
        } else {
          toast.success(
            `${aulasComSucesso} aulas criadas com sucesso para os próximos 3 meses! Agora você pode adicionar alunos.`,
            5000
          );
        }

        console.log("IDs das aulas criadas:", idsAulas);
      } else {
        // Criar apenas uma aula
        const dataHoraISO = `${dataAula}T${horaAula}:00-03:00`;

        const dadosAula = {
          professor_id: professorSelecionado.id,
          data_aula: dataHoraISO,
          idioma: getIdiomaName(professorSelecionado.id_idioma),
          valor_professor: valorProfessor,
          valor_escola: valorEscola,
          status: true,
          repetir_dia: false,
        };

        const response = await api.post("/aulas", dadosAula);

        if (response.data.id) {
          idsAulas.push(response.data.id);
        }

        setIdsAulasCriadas(idsAulas);
        setAulaCriada(true);
        if (onAulaAdicionada) onAulaAdicionada();

        toast.success(
          "Aula criada com sucesso! Agora você pode adicionar alunos."
        );
      }
    } catch (err: any) {
      console.error("Erro ao criar aula:", err);
      console.error("Resposta do erro:", err.response?.data);

      let mensagemErro = "Erro ao criar aula. Tente novamente.";

      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          mensagemErro = err.response.data.detail
            .map((error: any) => {
              const campo = error.loc?.join(" -> ") || "campo";
              return `${campo}: ${error.msg}`;
            })
            .join("\n");
        } else if (typeof err.response.data.detail === "string") {
          mensagemErro = err.response.data.detail;
        }
      }

      toast.error(mensagemErro);
    } finally {
      setSalvando(false);
    }
  };

  // Adicionar aluno à aula
  const handleAdicionarAluno = async (aluno: Aluno) => {
    if (!aulaCriada) {
      toast.error("Primeiro crie a aula, para então adicionar alunos a ela.");
      return;
    }

    const mensagemConfirmacao = repetirDia
      ? `Adicionar ${aluno.nome_completo} a esta aula e todas as próximas aulas cadastradas nesse mesmo horário e dia da semana pelos próximos 3 meses?`
      : `Adicionar ${aluno.nome_completo} a esta aula?`;

    const confirmar = window.confirm(mensagemConfirmacao);
    if (!confirmar) return;

    try {
      // Adicionar aluno a todas as aulas criadas
      const promises = idsAulasCriadas.map((idAula) =>
        api.post(`/aulas/${idAula}/alunos/${aluno.id}`)
      );

      await Promise.all(promises);

      toast.success(
        repetirDia
          ? `${aluno.nome_completo} adicionado(a) a todas as aulas!`
          : `${aluno.nome_completo} adicionado(a) à aula!`
      );

      setMostrarListaAlunos(false);
      // NÃO chamar onAulaAdicionada() aqui também
    } catch (err: any) {
      console.error("Erro ao adicionar aluno:", err);
      let mensagemErro = "Erro ao adicionar aluno. Tente novamente.";
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === "string") {
          mensagemErro = err.response.data.detail;
        }
      }
      toast.error(mensagemErro);
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

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onMouseDown={handleBackdropMouseDown}
        onMouseUp={handleBackdropMouseUp}
      >
        <div
          className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[96vh] overflow-y-auto"
          onMouseDown={handleModalMouseDown}
        >
          {/* Header */}
          <div className="bg-[#1a472f] text-white p-6 rounded-t-lg">
            <h2 className="text-2xl font-bold">Adicionar Aula</h2>
            <p className="text-gray-300 text-sm mt-1">
              Preencha os dados da nova aula
            </p>
          </div>

          {/* Conteúdo */}
          <div className="p-6 space-y-4">
            {/* Selecionar Professor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Professor *
              </label>
              {professorSelecionado ? (
                <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-300">
                      {professorSelecionado.foto_perfil ? (
                        <img
                          src={`data:image/webp;base64,${professorSelecionado.foto_perfil}`}
                          alt={professorSelecionado.nome_completo}
                          className="w-full h-auto object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 font-bold">
                          {professorSelecionado.nome_completo
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">
                        {professorSelecionado.nome_completo}
                      </p>
                      <p className="text-sm text-gray-500">
                        {getIdiomaName(professorSelecionado.id_idioma)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setProfessorSelecionado(null)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setMostrarListaProfessores(true)}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-gray-600 font-medium"
                >
                  Selecionar Professor
                </button>
              )}
            </div>

            {/* Data e Hora */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data *
                </label>
                <input
                  type="date"
                  value={dataAula}
                  onChange={(e) => setDataAula(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={aulaCriada}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora *
                </label>
                <input
                  type="time"
                  value={horaAula}
                  onChange={(e) => setHoraAula(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={aulaCriada}
                />
              </div>
            </div>

            {/* Valores */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor Professor *
                </label>
                <input
                  type="number"
                  value={valorProfessor}
                  onChange={(e) => setValorProfessor(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={aulaCriada}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor Escola *
                </label>
                <input
                  type="number"
                  value={valorEscola}
                  onChange={(e) => setValorEscola(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={aulaCriada}
                />
              </div>
            </div>

            {/* Repetir Dia */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="repetir_dia"
                checked={repetirDia}
                onChange={(e) => setRepetirDia(e.target.checked)}
                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                disabled={aulaCriada}
              />
              <label
                htmlFor="repetir_dia"
                className="text-sm font-medium text-gray-700"
              >
                Repetir dia da semana pelos próximos 3 meses
              </label>
            </div>

            {/* Adicionar Alunos */}
            <div>
              <button
                onClick={() => {
                  if (!aulaCriada) {
                    toast.error(
                      "Primeiro crie a aula, para então adicionar alunos a ela."
                    );
                    return;
                  }
                  setMostrarListaAlunos(true);
                }}
                className={`w-full px-4 py-3 border-2 border-dashed rounded-lg font-medium transition-colors ${
                  aulaCriada
                    ? "border-blue-300 hover:border-blue-500 hover:bg-blue-50 text-blue-600"
                    : "border-gray-200 text-gray-400 cursor-not-allowed opacity-50"
                }`}
              >
                Adicionar Alunos à Aula
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-4 rounded-b-lg flex justify-end gap-2">
            <button
              onClick={() => {
                // Chama onAulaAdicionada apenas ao fechar
                if (aulaCriada) {
                  onAulaAdicionada();
                }
                onClose();
              }}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              {aulaCriada ? "Fechar" : "Cancelar"}
            </button>
            {!aulaCriada && (
              <button
                onClick={handleCriarAula}
                disabled={salvando}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
              >
                {salvando ? "Criando..." : "Criar Aula"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal Lista de Professores */}
      {mostrarListaProfessores && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="bg-[#1a472f] text-white p-6 rounded-t-lg sticky top-0 z-10">
              <h2 className="text-2xl font-bold">Selecionar Professor</h2>
            </div>

            <div className="p-6 border-b">
              <input
                type="text"
                value={buscaProfessor}
                onChange={(e) => setBuscaProfessor(e.target.value)}
                placeholder="Buscar professor por nome..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              {carregando ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
              ) : professoresFiltrados.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Nenhum professor encontrado
                </p>
              ) : (
                <div className="space-y-3">
                  {professoresFiltrados.map((prof) => (
                    <div
                      key={prof.id}
                      onClick={() => {
                        setProfessorSelecionado(prof);
                        setMostrarListaProfessores(false);
                        setBuscaProfessor("");
                      }}
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-green-50 cursor-pointer transition-colors"
                    >
                      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-300">
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
                        <p className="text-sm text-gray-500">
                          {getIdiomaName(prof.id_idioma)}
                        </p>
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

      {/* Modal Lista de Alunos */}
      {mostrarListaAlunos && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="bg-blue-600 text-white p-6 rounded-t-lg sticky top-0 z-10">
              <h2 className="text-2xl font-bold">Adicionar Alunos</h2>
            </div>

            <div className="p-6 border-b">
              <input
                type="text"
                value={buscaAluno}
                onChange={(e) => setBuscaAluno(e.target.value)}
                placeholder="Buscar aluno por nome..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              {carregando ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : alunosFiltrados.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Nenhum aluno encontrado
                </p>
              ) : (
                <div className="space-y-3">
                  {alunosFiltrados.map((aluno) => (
                    <div
                      key={aluno.id}
                      onClick={() => handleAdicionarAluno(aluno)}
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-300">
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
