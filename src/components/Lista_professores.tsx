import { useState, useEffect } from "react";
import api from "../services/api_connection";
import { useToast } from "../hooks/useToast";
import ModalProfessor from "./modais/Modal_professor";
import {
  ModalAdicionarIdioma,
  ModalExcluirIdioma,
} from "./modais/Modal_idiomas";
import ModalAdicionarProfessor from "./modais/Modal_adicionar_professor";

interface Professor {
  id: number;
  id_idioma: number;
  nome_completo: string;
  data_nasc: string;
  cpf: string;
  telefone: string;
  pdf_contrato: string;
  mei: string;
  nacionalidade: string;
  foto_perfil: string;
  situacao: boolean;
}

interface Idioma {
  id: number;
  nome_idioma: string;
}

interface Aluno {
  id: number;
  situacao: boolean;
}

export default function Professores() {
  const toast = useToast();

  const [professores, setProfessores] = useState<Professor[]>([]);
  const [idiomas, setIdiomas] = useState<Record<number, string>>({});
  const [idiomasLista, setIdiomasLista] = useState<Idioma[]>([]);
  const [alunosPorProfessor, setAlunosPorProfessor] = useState<
    Record<number, number>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busca, setBusca] = useState("");
  const [professorSelecionado, setProfessorSelecionado] =
    useState<Professor | null>(null);
  const [modalProfessorAberto, setModalProfessorAberto] = useState(false);
  const [modalAdicionarProfessorAberto, setModalAdicionarProfessorAberto] =
    useState(false);
  const [modalIdiomaAberto, setModalIdiomaAberto] = useState(false);
  const [modalExcluirIdiomaAberto, setModalExcluirIdiomaAberto] =
    useState(false);
  const [idiomaParaExcluir, setIdiomaParaExcluir] = useState<Idioma | null>(
    null
  );

  // Função para formatar mensagens de erro
  const formatarMensagemErro = (mensagem: string): string => {
    // Remove "Value error, " do início de cada erro
    let mensagemFormatada = mensagem.replace(/Value error,\s*/gi, "");

    // Se tiver múltiplos erros separados por vírgula, adiciona "Erro: " e quebra de linha
    if (mensagemFormatada.includes(",")) {
      mensagemFormatada = mensagemFormatada
        .split(",")
        .map((erro) => `Erro: ${erro.trim()}`)
        .join("\n");
    } else {
      // Se for apenas um erro
      mensagemFormatada = `Erro: ${mensagemFormatada}`;
    }
    return mensagemFormatada;
  };

  const carregarIdiomas = async () => {
    try {
      const response = await api.get<Idioma[]>("/idiomas/");
      const idiomasMap = response.data.reduce((acc, idioma) => {
        acc[idioma.id] = idioma.nome_idioma;
        return acc;
      }, {} as Record<number, string>);

      setIdiomas(idiomasMap);
      setIdiomasLista(response.data);
    } catch (err: any) {
      console.error("Erro ao carregar idiomas:", err);
      const mensagemErro = formatarMensagemErro(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message ||
          "Erro ao carregar idiomas"
      );
      toast.error(mensagemErro);
    }
  };

  const carregarProfessores = async () => {
    try {
      const response = await api.get("/professores");
      const professoresOrdenados = (response.data.items || []).sort(
        (a: Professor, b: Professor) => {
          // Primeiro, prioriza quem tem situacao = true
          if (a.situacao !== b.situacao) {
            return a.situacao ? -1 : 1; // false vai pro final
          }
          // Se a situacao for igual, ordena alfabeticamente
          return a.nome_completo.localeCompare(b.nome_completo, "pt", {
            sensitivity: "base",
          });
        }
      );
      setProfessores(professoresOrdenados);

      // Recarrega quantidade de alunos
      const alunosPromises = professoresOrdenados.map(
        async (professor: Professor) => {
          try {
            const alunosResponse = await api.get<Aluno[]>(
              `/professores/${professor.id}/alunos`
            );
            const alunosAtivos = alunosResponse.data.filter(
              (aluno) => aluno.situacao
            ).length;
            return { idProfessor: professor.id, quantidade: alunosAtivos };
          } catch (err) {
            console.error(
              `Erro ao buscar alunos do professor ${professor.id}:`,
              err
            );
            return { idProfessor: professor.id, quantidade: 0 };
          }
        }
      );

      const alunosData = await Promise.all(alunosPromises);
      const alunosMap = alunosData.reduce(
        (acc, { idProfessor, quantidade }) => {
          acc[idProfessor] = quantidade;
          return acc;
        },
        {} as Record<number, number>
      );

      setAlunosPorProfessor(alunosMap);
    } catch (err: any) {
      console.error("Erro ao carregar professores:", err);
      const mensagemErro = formatarMensagemErro(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message ||
          "Erro ao carregar professores"
      );
      toast.error(mensagemErro);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [idiomasResponse, professoresResponse] = await Promise.all([
          api.get<Idioma[]>("/idiomas/"),
          api.get("/professores"),
        ]);

        // Cria um mapa de id -> nome_idioma para busca rápida
        const idiomasMap = idiomasResponse.data.reduce((acc, idioma) => {
          acc[idioma.id] = idioma.nome_idioma;
          return acc;
        }, {} as Record<number, string>);

        setIdiomas(idiomasMap);
        setIdiomasLista(idiomasResponse.data);

        // Ordena alfabeticamente pelo nome
        const professoresOrdenados = (
          professoresResponse.data.items || []
        ).sort((a: Professor, b: Professor) => {
          // Primeiro, prioriza quem tem situacao = true
          if (a.situacao !== b.situacao) {
            return a.situacao ? -1 : 1; // false vai pro final
          }
          // Se a situacao for igual, ordena alfabeticamente
          return a.nome_completo.localeCompare(b.nome_completo, "pt", {
            sensitivity: "base",
          });
        });

        setProfessores(professoresOrdenados);

        const alunosPromises = professoresOrdenados.map(
          async (professor: Professor) => {
            try {
              const response = await api.get<Aluno[]>(
                `/professores/${professor.id}/alunos`
              );
              const alunosAtivos = response.data.filter(
                (aluno) => aluno.situacao
              ).length;
              return { idProfessor: professor.id, quantidade: alunosAtivos };
            } catch (err) {
              console.error(
                `Erro ao buscar alunos do professor ${professor.id}:`,
                err
              );
              return { idProfessor: professor.id, quantidade: 0 };
            }
          }
        );

        const alunosData = await Promise.all(alunosPromises);
        const alunosMap = alunosData.reduce(
          (acc, { idProfessor, quantidade }) => {
            acc[idProfessor] = quantidade;
            return acc;
          },
          {} as Record<number, number>
        );

        setAlunosPorProfessor(alunosMap);
      } catch (err: any) {
        console.error("Erro ao buscar professores:", err);
        let mensagemErro = "Erro ao carregar professores";
        if (err.response?.data) {
          // Se for array de erros de validação
          if (Array.isArray(err.response.data.detail)) {
            mensagemErro = err.response.data.detail
              .map((error: any) => error.msg || JSON.stringify(error))
              .join(", ");
          } else if (typeof err.response.data.detail === "string") {
            mensagemErro = err.response.data.detail;
          } else if (err.response.data.message) {
            mensagemErro = err.response.data.message;
          }
        } else if (err.message) {
          mensagemErro = err.message;
        }
        mensagemErro = formatarMensagemErro(mensagemErro);
        setError(mensagemErro);
        toast.error(mensagemErro);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const abrirModal = (professor: Professor) => {
    setProfessorSelecionado(professor);
    setModalProfessorAberto(true);
  };

  const fecharModal = () => {
    setModalProfessorAberto(false);
    setProfessorSelecionado(null);
  };

  const handleAtualizarProfessor = (professorAtualizado: Professor) => {
    const professoresAtualizados = professores.map((prof) =>
      prof.id === professorAtualizado.id ? professorAtualizado : prof
    );
    setProfessores(professoresAtualizados);
    setProfessorSelecionado(professorAtualizado);
  };

  // Retorna os professores filtrados
  const professoresFiltrados = professores.filter((professor) =>
    professor.nome_completo.toLowerCase().includes(busca.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-gray-500">Carregando professores...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header com busca e botão adicionar */}
      <div className="mb-6 flex items-center gap-4">
        <input
          type="text"
          placeholder="Buscar professor pelo nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="flex-1 max-w-md px-4 py-2 rounded-lg border border-gray-300 
          focus:outline-none focus:ring-2 focus:ring-blue-500 
          focus:border-transparent shadow-xl"
        />
        <button
          onClick={() => setModalAdicionarProfessorAberto(true)}
          className="px-6 py-2 bg-[#363a50] text-white rounded-lg 
          hover:bg-green-700 transition-colors shadow-lg flex items-center gap-2 font-medium"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Novo Professor
        </button>
      </div>

      {busca && (
        <p className="mb-4 text-sm text-gray-600">
          {professoresFiltrados.length} professor(es) encontrado(s)
        </p>
      )}

      {professoresFiltrados.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">👨‍🏫</div>
          <p className="text-gray-500 text-lg">
            {busca
              ? `Nenhum professor encontrado com "${busca}"`
              : "Nenhum professor cadastrado"}
          </p>
          {!busca && (
            <button
              onClick={() => setModalAdicionarProfessorAberto(true)}
              className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg 
              hover:bg-green-700 transition-colors"
            >
              Cadastrar Primeiro Professor
            </button>
          )}
        </div>
      ) : (
        <div className="w-full grid grid-cols-2 gap-6">
          {professoresFiltrados.map((professor) => (
            <div
              key={professor.id}
              onClick={() => abrirModal(professor)}
              className="bg-[#232838] rounded-lg shadow-lg p-6 hover:shadow-xl 
              transition-shadow cursor-pointer text-white"
            >
              <div className="flex justify-between">
                <div className="flex items-left gap-5">
                  <div className="w-28 h-28 mb-4 overflow-hidden rounded-full flex items-center justify-center border-gray-400 border-2 shadow-xl">
                    <img
                      src={`data:image/webp;base64,${professor.foto_perfil}`}
                      alt={professor.nome_completo}
                      className="h-auto w-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  <div className="flex flex-col text-[#e7e7e7]">
                    {/* Nome do professor */}
                    <h3 className="text-xl font-bold mb-2">
                      {professor.nome_completo}
                    </h3>
                    {/* Matérias do professor */}
                    <h3 className="text-sm font- mb-2">
                      Professor(a) de {idiomas[professor.id_idioma]}
                    </h3>
                    {/* Quantidade de alunos ativos */}
                    {alunosPorProfessor[professor.id] ? (
                      <div className="text-sm text-gray-400">
                        {alunosPorProfessor[professor.id] === 1 ? (
                          <p>Possui 1 aluno ativo</p>
                        ) : (
                          <p>
                            Possui {alunosPorProfessor[professor.id]} alunos
                            ativos
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        <p>Não possui alunos ativos no momento</p>
                      </div>
                    )}
                  </div>
                </div>
                {/* Indicador de situação */}
                <span
                  className={`mt-2 px-4 py-1.5 rounded-full text-sm font-medium h-2/3 ${
                    professor.situacao
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {professor.situacao ? "Ativo" : "Inativo"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modais */}
      {modalProfessorAberto && professorSelecionado && (
        <ModalProfessor
          professor={professorSelecionado}
          idiomas={idiomas}
          idiomasLista={idiomasLista}
          onClose={fecharModal}
          onUpdate={handleAtualizarProfessor}
          onAbrirModalIdioma={() => setModalIdiomaAberto(true)}
          onAbrirModalExcluirIdioma={(idioma) => {
            setIdiomaParaExcluir(idioma);
            setModalExcluirIdiomaAberto(true);
          }}
        />
      )}

      {modalAdicionarProfessorAberto && (
        <ModalAdicionarProfessor
          idiomasLista={idiomasLista}
          onClose={() => setModalAdicionarProfessorAberto(false)}
          onSuccess={carregarProfessores}
          onAbrirModalIdioma={() => setModalIdiomaAberto(true)}
          onAbrirModalExcluirIdioma={(idioma) => {
            setIdiomaParaExcluir(idioma);
            setModalExcluirIdiomaAberto(true);
          }}
        />
      )}

      {modalIdiomaAberto && (
        <ModalAdicionarIdioma
          onClose={() => setModalIdiomaAberto(false)}
          onSuccess={carregarIdiomas}
        />
      )}

      {modalExcluirIdiomaAberto && idiomaParaExcluir && (
        <ModalExcluirIdioma
          idioma={idiomaParaExcluir}
          onClose={() => {
            setModalExcluirIdiomaAberto(false);
            setIdiomaParaExcluir(null);
          }}
          onSuccess={carregarIdiomas}
        />
      )}
    </div>
  );
}
