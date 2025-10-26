import { useState, useEffect } from "react";
import api from "../services/api_connection";
import { useToast } from "../hooks/useToast";
import ModalAluno from "./modais/Modal_aluno";
import ModalAdicionarAluno from "./modais/Modal_adicionar_aluno";

interface Aluno {
  id: number;
  nome_completo: string;
  data_nasc: string;
  cpf: string;
  telefone: string;
  preferencia_pagamento: string;
  dia_cobranca: number;
  foto_perfil: string;
  pais: string;
  situacao: boolean;
  email?: string;
  observacao?: string;
}

interface Mensalidade {
  id: number;
  aluno_id: number;
  data: string;
  status: string;
  valor: number;
}

interface ContadoresMensalidade {
  pagas: number;
  pendentes: number;
  atrasadas: number;
}

export default function Alunos() {
  const toast = useToast();

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busca, setBusca] = useState("");
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
  const [modalAlunoAberto, setModalAlunoAberto] = useState(false);
  const [modalAdicionarAberto, setModalAdicionarAberto] = useState(false);
  const [idiomas, setIdiomas] = useState<Record<number, string>>({});

  // Estado para armazenar contadores de mensalidades por aluno
  const [contadoresMensalidades, setContadoresMensalidades] = useState<
    Record<number, ContadoresMensalidade>
  >({});

  // Função para formatar mensagens de erro
  const formatarMensagemErro = (mensagem: string): string => {
    let mensagemFormatada = mensagem.replace(/Value error,\s*/gi, "");

    if (mensagemFormatada.includes(",")) {
      mensagemFormatada = mensagemFormatada
        .split(",")
        .map((erro) => `Erro: ${erro.trim()}`)
        .join("\n");
    } else {
      mensagemFormatada = `Erro: ${mensagemFormatada}`;
    }
    return mensagemFormatada;
  };

  // Carregar mensalidades de todos os alunos
  const carregarMensalidades = async (alunos: Aluno[]) => {
    try {
      const response = await api.get("/mensalidades");
      const todasMensalidades: Mensalidade[] = response.data || [];

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      // Criar contadores para cada aluno
      const contadores: Record<number, ContadoresMensalidade> = {};

      alunos.forEach((aluno) => {
        contadores[aluno.id] = {
          pagas: 0,
          pendentes: 0,
          atrasadas: 0,
        };
      });

      // Contar mensalidades
      todasMensalidades.forEach((mensalidade) => {
        if (contadores[mensalidade.aluno_id]) {
          const dataMensalidade = new Date(mensalidade.data);
          dataMensalidade.setHours(0, 0, 0, 0);

          const status = mensalidade.status.toLowerCase();

          if (status === "pago") {
            contadores[mensalidade.aluno_id].pagas++;
          } else if (status === "atrasado" || dataMensalidade < hoje) {
            contadores[mensalidade.aluno_id].atrasadas++;
          } else {
            contadores[mensalidade.aluno_id].pendentes++;
          }
        }
      });

      setContadoresMensalidades(contadores);
    } catch (err) {
      console.error("Erro ao carregar mensalidades:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await api.get("/alunos");

        // Ordena alfabeticamente pelo nome
        const alunosOrdenados = (response.data.items || []).sort(
          (a: Aluno, b: Aluno) => {
            // Primeiro, prioriza quem tem situacao = true
            if (a.situacao !== b.situacao) {
              return a.situacao ? -1 : 1;
            }
            // Se a situacao for igual, ordena alfabeticamente
            return a.nome_completo.localeCompare(b.nome_completo, "pt", {
              sensitivity: "base",
            });
          }
        );

        setAlunos(alunosOrdenados);

        // Carregar mensalidades após carregar alunos
        await carregarMensalidades(alunosOrdenados);
      } catch (err: any) {
        console.error("Erro ao buscar alunos:", err);
        let mensagemErro = "Erro ao carregar alunos";
        if (err.response?.data) {
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

  useEffect(() => {
    const carregarIdiomas = async () => {
      try {
        const response = await api.get("/idiomas");
        const idiomasMap: Record<number, string> = {};
        response.data.forEach((idioma: any) => {
          idiomasMap[idioma.id] = idioma.nome_idioma;
        });
        setIdiomas(idiomasMap);
      } catch (err) {
        console.error("Erro ao carregar idiomas:", err);
      }
    };
    carregarIdiomas();
  }, []);

  const abrirModal = (aluno: Aluno) => {
    setAlunoSelecionado(aluno);
    setModalAlunoAberto(true);
  };

  const fecharModal = () => {
    setModalAlunoAberto(false);
    setAlunoSelecionado(null);
    // Recarregar mensalidades ao fechar o modal
    carregarMensalidades(alunos);
  };

  const handleAtualizarAluno = (alunoAtualizado: Aluno) => {
    const alunosAtualizados = alunos.map((aluno) =>
      aluno.id === alunoAtualizado.id ? alunoAtualizado : aluno
    );
    setAlunos(alunosAtualizados);
    setAlunoSelecionado(alunoAtualizado);
  };

  const handleAlunoAdicionado = (novoAluno: Aluno) => {
    const alunosAtualizados = [...alunos, novoAluno].sort((a, b) => {
      if (a.situacao !== b.situacao) {
        return a.situacao ? -1 : 1;
      }
      return a.nome_completo.localeCompare(b.nome_completo, "pt", {
        sensitivity: "base",
      });
    });
    setAlunos(alunosAtualizados);
    carregarMensalidades(alunosAtualizados);
  };

  const alunosFiltrados = alunos.filter((aluno) =>
    aluno.nome_completo.toLowerCase().includes(busca.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-gray-500">Carregando alunos...</div>
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
          placeholder="Buscar aluno pelo nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="flex-1 max-w-md px-4 py-2 rounded-lg border border-gray-300 
          focus:outline-none focus:ring-2 focus:ring-blue-500 
          focus:border-transparent shadow-xl"
        />
        <button
          onClick={() => setModalAdicionarAberto(true)}
          className="px-6 py-2 bg-[#1a472f] text-white rounded-lg 
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
          Novo Aluno
        </button>
      </div>

      {busca && (
        <p className="mb-4 text-sm text-gray-600">
          {alunosFiltrados.length} aluno(s) encontrado(s)
        </p>
      )}

      {alunosFiltrados.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">👨‍🎓</div>
          <p className="text-gray-500 text-lg">
            {busca
              ? `Nenhum aluno encontrado com "${busca}"`
              : "Nenhum aluno cadastrado"}
          </p>
          {!busca && (
            <button
              onClick={() => setModalAdicionarAberto(true)}
              className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg 
              hover:bg-green-700 transition-colors"
            >
              Cadastrar Primeiro Aluno
            </button>
          )}
        </div>
      ) : (
        <div className="w-full grid grid-cols-2 gap-6">
          {alunosFiltrados.map((aluno) => {
            const contadores = contadoresMensalidades[aluno.id] || {
              pagas: 0,
              pendentes: 0,
              atrasadas: 0,
            };
            const totalMensalidades =
              contadores.pagas + contadores.pendentes + contadores.atrasadas;

            return (
              <div
                key={aluno.id}
                onClick={() => abrirModal(aluno)}
                className="bg-[#1a472f] rounded-lg shadow-lg p-6 hover:shadow-xl 
                transition-shadow cursor-pointer text-white"
              >
                <div className="flex justify-between mb-4">
                  <div className="flex items-left gap-5">
                    {/* Foto de perfil */}
                    <div className="w-24 h-24 overflow-hidden rounded-full flex items-center justify-center border-gray-400 border-2 shadow-xl flex-shrink-0 ">
                      <img
                        src={`data:image/webp;base64,${aluno.foto_perfil}`}
                        alt={aluno.nome_completo}
                        className="w-full h-auto object-center"
                        loading="lazy"
                      />
                    </div>
                    <div className="flex flex-col justify-start">
                      {/* Nome completo */}
                      <h3 className="text-xl font-bold mb-2">
                        {aluno.nome_completo}
                      </h3>

                      {/* Observação */}
                      <p className="font-medium text-gray-200/80">
                        Observação:{" "}
                        <span className="font-light text-white/60 break-all">
                          {aluno.observacao?.trim() || "Nenhuma observação."}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Situação */}
                  <span
                    className={`px-4 py-1.5 rounded-full text-sm font-medium h-fit ${
                      aluno.situacao
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {aluno.situacao ? "Ativo" : "Inativo"}
                  </span>
                </div>

                {/* Contadores de Mensalidades */}
                {totalMensalidades > 0 && (
                  <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-600">
                    <div className="text-center">
                      <p className="text-xs text-gray-300">Pagas</p>
                      <p className="text-lg font-bold text-green-400">
                        {contadores.pagas}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-300">Pendentes</p>
                      <p className="text-lg font-bold text-yellow-400">
                        {contadores.pendentes}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-300">Atrasadas</p>
                      <p className="text-lg font-bold text-red-400">
                        {contadores.atrasadas}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Aluno */}
      {modalAlunoAberto && alunoSelecionado && (
        <ModalAluno
          aluno={alunoSelecionado}
          idiomas={idiomas}
          onClose={fecharModal}
          onUpdate={handleAtualizarAluno}
        />
      )}

      {/* Modal Adicionar Aluno */}
      {modalAdicionarAberto && (
        <ModalAdicionarAluno
          onClose={() => setModalAdicionarAberto(false)}
          onAlunoAdicionado={handleAlunoAdicionado}
        />
      )}
    </div>
  );
}
