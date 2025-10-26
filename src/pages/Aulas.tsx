import { useState, useEffect } from "react";
import api from "../services/api_connection";
import { useToast } from "../hooks/useToast";
import ModalAdicionarAula from "../components/modais/Modal_adicionar_aula";
import ModalAulas from "../components/modais/Modal_aulas";
import ModalAulasMesProfessor from "../components/modais/Modal_aulas_mes_professor";

type VisualizacaoTipo = "semana" | "mes";
type FiltroTipo = "geral" | "professor" | "aluno";

interface Aula {
  id: number;
  professor_id: number;
  data_aula: string;
  idioma: string;
  status: boolean;
  valor_professor: number;
  valor_escola: number;
}

interface TotaisMes {
  mes: number;
  ano: number;
  nomeMes: string;
  qtdAulas: number;
  totalProfessor: number;
  totalEscola: number;
}

interface Professor {
  id: number;
  nome_completo: string;
  foto_perfil: string;
  situacao: boolean;
}

interface Aluno {
  id: number;
  nome_completo: string;
  foto_perfil: string;
  situacao: boolean;
}

export default function Aulas() {
  const toast = useToast();
  const [visualizacao, setVisualizacao] = useState<VisualizacaoTipo>("semana");
  const [dataAtual, setDataAtual] = useState(new Date());
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [mostrarModalAdicionar, setMostrarModalAdicionar] = useState(false);

  // Estados para Modal de Aulas
  const [mostrarModalAulas, setMostrarModalAulas] = useState(false);
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null);
  const [horarioSelecionado, setHorarioSelecionado] = useState<string>("");

  // Estados para visualização de mês
  const [anoSelecionado, setAnoSelecionado] = useState(
    new Date().getFullYear()
  );

  // Estados para Filtros
  const [filtroAtivo, setFiltroAtivo] = useState<FiltroTipo>("geral");
  const [mostrarMenuFiltro, setMostrarMenuFiltro] = useState(false);
  const [mostrarListaProfessores, setMostrarListaProfessores] = useState(false);
  const [mostrarListaAlunos, setMostrarListaAlunos] = useState(false);
  const [professorSelecionado, setProfessorSelecionado] =
    useState<Professor | null>(null);
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [buscaFiltro, setBuscaFiltro] = useState("");
  const [aulasFiltradas, setAulasFiltradas] = useState<Aula[]>([]);

  // Estados para Modal Mês Professor
  const [mostrarModalMesProfessor, setMostrarModalMesProfessor] =
    useState(false);
  const [mesSelecionado, setMesSelecionado] = useState<number>(0);
  const [anoMesSelecionado, setAnoMesSelecionado] = useState<number>(0);

  // Estados para Modal de Edição em Massa
  const [mostrarModalEdicaoMassa, setMostrarModalEdicaoMassa] = useState(false);
  const [aulasProfesorFuturas, setAulasProfesorFuturas] = useState<Aula[]>([]);

  // Função para obter o início da semana (segunda-feira)
  const getInicioSemana = (date: Date): Date => {
    const dia = date.getDay();
    const diff = dia === 0 ? -6 : 1 - dia;
    const inicioSemana = new Date(date);
    inicioSemana.setDate(date.getDate() + diff);
    inicioSemana.setHours(0, 0, 0, 0);
    return inicioSemana;
  };

  // Função para obter o fim da semana (domingo)
  const getFimSemana = (date: Date): Date => {
    const inicioSemana = getInicioSemana(date);
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6);
    fimSemana.setHours(23, 59, 59, 999);
    return fimSemana;
  };

  // Gera array de dias da semana
  const getDiasSemana = (): Date[] => {
    const inicioSemana = getInicioSemana(dataAtual);
    const dias: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const dia = new Date(inicioSemana);
      dia.setDate(inicioSemana.getDate() + i);
      dias.push(dia);
    }
    return dias;
  };

  // Função auxiliar: verifica quais aulas o aluno está matriculado
  const filtrarAulasPorAluno = async (
    aulas: Aula[],
    alunoId: number
  ): Promise<Aula[]> => {
    const aulasComAluno: Aula[] = [];

    // Faz as requisições em paralelo, mas de forma controlada
    const promises = aulas.map(async (aula) => {
      try {
        const response = await api.get(`/aulas/${aula.id}/alunos`);
        const alunosDaAula = response.data.items || response.data || [];

        const temAluno = alunosDaAula.some((a: any) => a.id === alunoId);
        if (temAluno) aulasComAluno.push(aula);
      } catch (err) {
        console.error(`Erro ao buscar alunos da aula ${aula.id}:`, err);
      }
    });

    await Promise.all(promises);
    return aulasComAluno;
  };

  // Gera array de horários (07:00 às 21:00, intervalos de 30min)
  const getHorarios = (): string[] => {
    const horarios: string[] = [];
    for (let hora = 7; hora <= 20; hora++) {
      horarios.push(`${hora.toString().padStart(2, "0")}:00`);
      horarios.push(`${hora.toString().padStart(2, "0")}:30`);
    }
    horarios.push("21:00");
    return horarios;
  };

  // Carregar aulas
  const carregarAulas = async () => {
    setCarregando(true);
    try {
      const response = await api.get("/aulas");
      setAulas(response.data.items || response.data || []);
    } catch (err: any) {
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
          (p: Professor) => p.situacao
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
          (a: Aluno) => a.situacao
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

  useEffect(() => {
    const filtrar = async () => {
      setCarregando(true);
      try {
        const filtradas = await getAulasFiltradas();
        setAulasFiltradas(filtradas);
      } finally {
        setCarregando(false);
      }
    };
    filtrar();
  }, [filtroAtivo, professorSelecionado, alunoSelecionado, aulas]);

  // Converter string de data para Date
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

  // Filtrar aulas com base no filtro ativo
  const getAulasFiltradas = async (): Promise<Aula[]> => {
    let aulasFiltradas = [...aulas];

    if (filtroAtivo === "professor" && professorSelecionado) {
      aulasFiltradas = aulasFiltradas.filter(
        (aula) => aula.professor_id === professorSelecionado.id
      );
    } else if (filtroAtivo === "aluno" && alunoSelecionado) {
      // Precisamos verificar se o aluno está na aula
      aulasFiltradas = await filtrarAulasPorAluno(
        aulasFiltradas,
        alunoSelecionado.id
      );
    }

    return aulasFiltradas;
  };

  // Contar aulas por dia (com filtro)
  const contarAulasPorDia = (dia: Date): number => {
    return aulasFiltradas.filter((aula) => {
      const dataAula = parseDataAula(aula.data_aula);
      if (!dataAula) return false;

      return (
        dataAula.getDate() === dia.getDate() &&
        dataAula.getMonth() === dia.getMonth() &&
        dataAula.getFullYear() === dia.getFullYear()
      );
    }).length;
  };

  // Obter aulas para um horário específico (com filtro)
  const getAulasNoHorario = (dia: Date, horario: string): Aula[] => {
    return aulasFiltradas.filter((aula) => {
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
  };

  // Navegar semana/mês
  const navegarAnterior = () => {
    if (visualizacao === "semana") {
      const novaData = new Date(dataAtual);
      novaData.setDate(dataAtual.getDate() - 7);
      setDataAtual(novaData);
    } else {
      const novaData = new Date(dataAtual);
      novaData.setMonth(dataAtual.getMonth() - 1);
      setDataAtual(novaData);
    }
  };

  const navegarProximo = () => {
    if (visualizacao === "semana") {
      const novaData = new Date(dataAtual);
      novaData.setDate(dataAtual.getDate() + 7);
      setDataAtual(novaData);
    } else {
      const novaData = new Date(dataAtual);
      novaData.setMonth(dataAtual.getMonth() + 1);
      setDataAtual(novaData);
    }
  };

  const voltarHoje = () => {
    setDataAtual(new Date());
  };

  // Formatar data
  const formatarDiaSemana = (date: Date): string => {
    return date.toLocaleDateString("pt-BR", { weekday: "short" }).toUpperCase();
  };

  const formatarDiaMes = (date: Date): string => {
    return date.getDate().toString().padStart(2, "0");
  };

  const formatarPeriodoSemana = (): string => {
    const inicio = getInicioSemana(dataAtual);
    const fim = getFimSemana(dataAtual);
    return `${inicio.getDate().toString().padStart(2, "0")}/${(
      inicio.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")} - ${fim.getDate().toString().padStart(2, "0")}/${(
      fim.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${fim.getFullYear()}`;
  };

  // Verificar se é hoje
  const ehHoje = (date: Date): boolean => {
    const hoje = new Date();
    return (
      date.getDate() === hoje.getDate() &&
      date.getMonth() === hoje.getMonth() &&
      date.getFullYear() === hoje.getFullYear()
    );
  };

  // Handler para clicar em um horário
  const handleClicarHorario = (dia: Date, horario: string) => {
    const aulasNoHorario = getAulasNoHorario(dia, horario);

    if (aulasNoHorario.length > 0) {
      setDiaSelecionado(dia);
      setHorarioSelecionado(horario);
      setMostrarModalAulas(true);
    }
  };

  // Handlers de Filtro
  const handleSelecionarFiltro = (tipo: FiltroTipo) => {
    if (tipo === "geral") {
      setFiltroAtivo("geral");
      setProfessorSelecionado(null);
      setAlunoSelecionado(null);
      setMostrarMenuFiltro(false);
    } else if (tipo === "professor") {
      setMostrarListaProfessores(true);
      setMostrarMenuFiltro(false);
    } else if (tipo === "aluno") {
      setMostrarListaAlunos(true);
      setMostrarMenuFiltro(false);
    }
  };

  const handleSelecionarProfessor = (professor: Professor) => {
    setProfessorSelecionado(professor);
    setAlunoSelecionado(null);
    setFiltroAtivo("professor");
    setMostrarListaProfessores(false);
    setBuscaFiltro("");
  };

  const handleSelecionarAluno = (aluno: Aluno) => {
    setAlunoSelecionado(aluno);
    setProfessorSelecionado(null);
    setFiltroAtivo("aluno");
    setMostrarListaAlunos(false);
    setBuscaFiltro("");
  };

  // Calcular totais da semana (com filtro)
  const calcularTotaisSemana = () => {
    const inicioSemana = getInicioSemana(dataAtual);
    const fimSemana = getFimSemana(dataAtual);

    const aulasDaSemana = aulasFiltradas.filter((aula) => {
      const dataAula = parseDataAula(aula.data_aula);
      if (!dataAula) return false;
      return dataAula >= inicioSemana && dataAula <= fimSemana;
    });

    const totalProfessor = aulasDaSemana.reduce(
      (sum, aula) => sum + (Number(aula.valor_professor) || 0),
      0
    );
    const totalEscola = aulasDaSemana.reduce(
      (sum, aula) => sum + (Number(aula.valor_escola) || 0),
      0
    );

    return {
      qtdAulas: aulasDaSemana.length,
      totalProfessor,
      totalEscola,
    };
  };

  // Calcular totais por mês (com filtro)
  const calcularTotaisPorMes = (): TotaisMes[] => {
    const meses = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];

    const totaisPorMes: { [key: string]: TotaisMes } = {};

    aulasFiltradas.forEach((aula) => {
      const dataAula = parseDataAula(aula.data_aula);
      if (!dataAula) return;

      const ano = dataAula.getFullYear();
      if (ano !== anoSelecionado) return;

      const mes = dataAula.getMonth();
      const chave = `${ano}-${mes}`;

      if (!totaisPorMes[chave]) {
        totaisPorMes[chave] = {
          mes,
          ano,
          nomeMes: meses[mes],
          qtdAulas: 0,
          totalProfessor: 0,
          totalEscola: 0,
        };
      }

      totaisPorMes[chave].qtdAulas++;
      totaisPorMes[chave].totalProfessor += Number(aula.valor_professor) || 0;
      totaisPorMes[chave].totalEscola += Number(aula.valor_escola) || 0;
    });

    return Object.values(totaisPorMes).sort((a, b) => a.mes - b.mes);
  };

  // Calcular totais do ano (com filtro)
  const calcularTotaisAno = () => {
    const aulasDoAno = aulasFiltradas.filter((aula) => {
      const dataAula = parseDataAula(aula.data_aula);
      if (!dataAula) return false;
      return dataAula.getFullYear() === anoSelecionado;
    });

    const totalProfessor = aulasDoAno.reduce(
      (sum, aula) => sum + (Number(aula.valor_professor) || 0),
      0
    );
    const totalEscola = aulasDoAno.reduce(
      (sum, aula) => sum + (Number(aula.valor_escola) || 0),
      0
    );

    return {
      qtdAulas: aulasDoAno.length,
      totalProfessor,
      totalEscola,
    };
  };

  // Handler para clicar no card do mês (apenas para professor)
  const handleClicarMes = (mes: number, ano: number) => {
    if (filtroAtivo === "professor" && professorSelecionado) {
      setMesSelecionado(mes);
      setAnoMesSelecionado(ano);
      setMostrarModalMesProfessor(true);
    }
  };

  // Filtrar professores/alunos para busca
  const professoresFiltrados = professores.filter((prof) =>
    prof.nome_completo.toLowerCase().includes(buscaFiltro.toLowerCase())
  );

  const alunosFiltrados = alunos.filter((aluno) =>
    aluno.nome_completo.toLowerCase().includes(buscaFiltro.toLowerCase())
  );

  const totaisSemana = calcularTotaisSemana();
  const totaisMes = calcularTotaisPorMes();
  const totaisAno = calcularTotaisAno();
  const diasSemana = getDiasSemana();
  const horarios = getHorarios();

  // Nome do filtro ativo
  const getNomeFiltroAtivo = (): string => {
    if (filtroAtivo === "geral") return "Geral";
    if (filtroAtivo === "professor" && professorSelecionado)
      return `Prof. ${professorSelecionado.nome_completo}`;
    if (filtroAtivo === "aluno" && alunoSelecionado)
      return `Aluno ${alunoSelecionado.nome_completo}`;
    return "Geral";
  };

  // Carregar aulas futuras do professor selecionado
  const carregarAulasFuturasProfessor = () => {
    if (!professorSelecionado) return;

    const hoje = new Date();
    hoje.setHours(hoje.getHours());

    const aulasFuturas = aulas.filter((aula) => {
      if (aula.professor_id !== professorSelecionado.id) return false;

      const dataAula = parseDataAula(aula.data_aula);
      if (!dataAula) return false;

      return dataAula > hoje;
    });

    setAulasProfesorFuturas(aulasFuturas);
  };

  // Abrir modal de edição em massa
  const handleAbrirEdicaoMassa = () => {
    carregarAulasFuturasProfessor();
    setMostrarModalEdicaoMassa(true);
  };

  // Função auxiliar para converter data para formato ISO
  const converterParaISO = (dataStr: string): string => {
    try {
      const [datePart, timePart] = dataStr.split(" ");
      const [dia, mes, ano] = datePart.split("/");
      const [hora, minuto] = timePart.split(":");

      // Criar data no formato ISO: YYYY-MM-DDTHH:mm:ss
      return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(
        2,
        "0"
      )}T${hora.padStart(2, "0")}:${minuto.padStart(2, "0")}:00`;
    } catch (err) {
      console.error("Erro ao converter data:", dataStr, err);
      return "";
    }
  };

  // Função auxiliar para delay
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  // Trocar professor das aulas futuras
  const handleTrocarProfessorAulasFuturas = async (
    novoProfessor: Professor
  ) => {
    if (aulasProfesorFuturas.length === 0) {
      toast.error("Não há aulas futuras para trocar o professor.");
      return;
    }

    const confirmar = window.confirm(
      `Tem certeza que deseja trocar ${aulasProfesorFuturas.length} aula(s) futura(s) de ${professorSelecionado?.nome_completo} para ${novoProfessor.nome_completo}?`
    );

    if (!confirmar) return;

    setCarregando(true);
    let sucessos = 0;
    let erros = 0;

    for (const aula of aulasProfesorFuturas) {
      try {
        const dataISO = converterParaISO(aula.data_aula);

        if (!dataISO) {
          console.error(
            `Data inválida para aula ${aula.id}: ${aula.data_aula}`
          );
          erros++;
          continue;
        }

        const dadosAtualizados = {
          professor_id: novoProfessor.id,
          data_aula: dataISO, // Formato ISO: 2025-10-23T14:30:00
          idioma: aula.idioma || "Inglês",
          valor_professor: aula.valor_professor,
          valor_escola: aula.valor_escola,
          status: aula.status,
          repetir_dia: false,
        };

        await api.put(`/aulas/${aula.id}`, dadosAtualizados);
        sucessos++;

        // Delay de 200ms (meio segundo) entre requisições
        await delay(200);
      } catch (err) {
        console.error(`Erro ao atualizar aula ${aula.id}:`, err);
        erros++;
      }
    }

    setCarregando(false);

    if (erros > 0) {
      toast.warning(
        `${sucessos} aula(s) atualizada(s) com sucesso. ${erros} falharam.`
      );
    } else {
      toast.success(`${sucessos} aula(s) atualizada(s) com sucesso!`);
    }

    setMostrarModalEdicaoMassa(false);
    carregarAulas();
  };

  // Excluir aulas futuras do professor (também com delay)
  const handleExcluirAulasFuturas = async () => {
    if (aulasProfesorFuturas.length === 0) {
      toast.error("Não há aulas futuras para excluir.");
      return;
    }

    const confirmar = window.confirm(
      `Tem certeza que deseja excluir ${aulasProfesorFuturas.length} aula(s) futura(s) de ${professorSelecionado?.nome_completo}?`
    );

    if (!confirmar) return;

    setCarregando(true);
    let sucessos = 0;
    let erros = 0;

    for (const aula of aulasProfesorFuturas) {
      try {
        await api.delete(`/aulas/${aula.id}`);
        sucessos++;

        // Delay de 200ms entre requisições
        await delay(200);
      } catch (err) {
        console.error(`Erro ao excluir aula ${aula.id}:`, err);
        erros++;
      }
    }

    setCarregando(false);

    if (erros > 0) {
      toast.warning(
        `${sucessos} aula(s) excluída(s) com sucesso. ${erros} falharam.`
      );
    } else {
      toast.success(`${sucessos} aula(s) excluída(s) com sucesso!`);
    }

    setMostrarModalEdicaoMassa(false);
    carregarAulas();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-6">
        {/* Cabeçalho com filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col gap-4">
            {/* Linha 1: Seletor de visualização, filtro e navegação */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              {/* Seletor de visualização */}
              <div className="flex gap-2">
                <button
                  onClick={() => setVisualizacao("semana")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    visualizacao === "semana"
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Semana
                </button>
                <button
                  onClick={() => setVisualizacao("mes")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    visualizacao === "mes"
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Mês
                </button>
              </div>

              {/* Filtro Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setMostrarMenuFiltro(!mostrarMenuFiltro)}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
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
                      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                    />
                  </svg>
                  {getNomeFiltroAtivo()}
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
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {mostrarMenuFiltro && (
                  <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-30 min-w-[200px]">
                    <button
                      onClick={() => handleSelecionarFiltro("geral")}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors"
                    >
                      Geral
                    </button>
                    <button
                      onClick={() => handleSelecionarFiltro("professor")}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors"
                    >
                      Filtrar por Professor
                    </button>
                    <button
                      onClick={() => handleSelecionarFiltro("aluno")}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors"
                    >
                      Filtrar por Aluno
                    </button>
                  </div>
                )}
              </div>

              {/* Botão Editar Aulas (só aparece com professor filtrado) */}
              {filtroAtivo === "professor" && professorSelecionado && (
                <button
                  onClick={handleAbrirEdicaoMassa}
                  className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 transition-colors font-medium flex items-center gap-2"
                  title="Editar aulas em massa do professor"
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
                  Editar Aulas
                </button>
              )}

              {/* Navegação de período */}
              {visualizacao === "semana" ? (
                <div className="flex items-center gap-4">
                  <button
                    onClick={navegarAnterior}
                    className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
                    title="Período anterior"
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
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>

                  <div className="text-center min-w-[200px]">
                    <h2 className="text-xl font-bold text-gray-800">
                      {formatarPeriodoSemana()}
                    </h2>
                  </div>

                  <button
                    onClick={navegarProximo}
                    className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
                    title="Próximo período"
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>

                  <button
                    onClick={voltarHoje}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
                  >
                    Hoje
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setAnoSelecionado(anoSelecionado - 1)}
                    className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
                    title="Ano anterior"
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
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>

                  <div className="text-center min-w-[200px]">
                    <h2 className="text-xl font-bold text-gray-800">
                      {anoSelecionado}
                    </h2>
                  </div>

                  <button
                    onClick={() => setAnoSelecionado(anoSelecionado + 1)}
                    className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
                    title="Próximo ano"
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>

                  <button
                    onClick={() => setAnoSelecionado(new Date().getFullYear())}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
                  >
                    Ano Atual
                  </button>
                </div>
              )}

              {/* Botão Adicionar Aula */}
              <button
                onClick={() => setMostrarModalAdicionar(true)}
                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                title="Adicionar nova aula"
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
                Adicionar Aula
              </button>
            </div>

            {/* Linha 2: Totais */}
            {visualizacao === "semana" ? (
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Total de Aulas</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {totaisSemana.qtdAulas}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">
                    Total Professores
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {totaisSemana.totalProfessor.toFixed(2)}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Total Escola</p>
                  <p className="text-2xl font-bold text-purple-600">
                    R$ {totaisSemana.totalEscola.toFixed(2)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">
                    Total de Aulas (Ano)
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {totaisAno.qtdAulas}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">
                    Total Professores (Ano)
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {totaisAno.totalProfessor.toFixed(2)}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">
                    Total Escola (Ano)
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    R$ {totaisAno.totalEscola.toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Visualização Mês */}
        {visualizacao === "mes" && (
          <div className="bg-white rounded-lg shadow-md p-6">
            {carregando ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : totaisMes.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p className="text-lg font-medium">
                  Nenhuma aula encontrada em {anoSelecionado}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {totaisMes.map((total) => (
                  <div
                    key={`${total.ano}-${total.mes}`}
                    onClick={() => handleClicarMes(total.mes, total.ano)}
                    className={`border border-gray-200 rounded-lg p-6 transition-shadow ${
                      filtroAtivo === "professor"
                        ? "hover:shadow-lg cursor-pointer hover:border-blue-500"
                        : ""
                    }`}
                  >
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                      {total.nomeMes} {total.ano}
                    </h3>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Total de Aulas:
                        </span>
                        <span className="text-lg font-semibold text-blue-600">
                          {total.qtdAulas}
                        </span>
                      </div>

                      {filtroAtivo !== "aluno" && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            Total Professores:
                          </span>
                          <span className="text-lg font-semibold text-green-600">
                            R$ {total.totalProfessor.toFixed(2)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Total Escola:
                        </span>
                        <span className="text-lg font-semibold text-purple-600">
                          R$ {total.totalEscola.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {filtroAtivo === "professor" && (
                      <div className="mt-4 text-center">
                        <span className="text-xs text-blue-600 font-medium">
                          Clique para ver detalhes
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Grade de Aulas - Visualização Semana */}
        {visualizacao === "semana" && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {carregando ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="sticky left-0 z-20 bg-gray-100 border-r border-gray-300 p-3 w-24">
                        <span className="text-sm font-medium text-gray-600">
                          Horário
                        </span>
                      </th>
                      {diasSemana.map((dia, index) => {
                        const qtdAulas = contarAulasPorDia(dia);
                        return (
                          <th
                            key={index}
                            className={`border-r border-gray-300 p-3 min-w-[150px] ${
                              ehHoje(dia) ? "bg-blue-50" : ""
                            }`}
                          >
                            <div className="flex flex-col items-center">
                              <span className="text-xs font-medium text-gray-500">
                                {formatarDiaSemana(dia)}
                              </span>
                              <span
                                className={`text-lg font-bold mt-1 ${
                                  ehHoje(dia)
                                    ? "bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center"
                                    : "text-gray-800"
                                }`}
                              >
                                {formatarDiaMes(dia)}
                              </span>
                              {/* Badge de quantidade de aulas */}
                              {qtdAulas > 0 && (
                                <span className="mt-2 bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded-full">
                                  {qtdAulas} {qtdAulas === 1 ? "aula" : "aulas"}
                                </span>
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {horarios.map((horario, indexHorario) => (
                      <tr
                        key={indexHorario}
                        className={
                          indexHorario % 2 === 0 ? "bg-gray-50" : "bg-white"
                        }
                      >
                        <td className="sticky left-0 z-10 bg-gray-100 border-r border-gray-300 p-3 text-sm font-medium text-gray-600">
                          {horario}
                        </td>
                        {diasSemana.map((dia, indexDia) => {
                          const aulasNoHorario = getAulasNoHorario(
                            dia,
                            horario
                          );
                          const temAulas = aulasNoHorario.length > 0;

                          return (
                            <td
                              key={indexDia}
                              onClick={() => handleClicarHorario(dia, horario)}
                              className={`border-r border-b border-gray-200 p-2 h-12 hover:bg-blue-50 cursor-pointer transition-colors ${
                                ehHoje(dia) ? "bg-blue-25" : ""
                              }`}
                            >
                              {temAulas && (
                                <div className="flex items-center justify-center h-full">
                                  <span
                                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
                                      aulasNoHorario.length === 1
                                        ? "bg-green-100 text-green-800"
                                        : aulasNoHorario.length === 2
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {aulasNoHorario.length}{" "}
                                    {aulasNoHorario.length === 1
                                      ? "aula ativa"
                                      : "aulas ativas"}
                                  </span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Adicionar Aula */}
      {mostrarModalAdicionar && (
        <ModalAdicionarAula
          onClose={() => setMostrarModalAdicionar(false)}
          onAulaAdicionada={carregarAulas}
        />
      )}

      {/* Modal Ver Aulas */}
      {mostrarModalAulas && diaSelecionado && (
        <ModalAulas
          dia={diaSelecionado}
          horario={horarioSelecionado}
          onClose={() => {
            setMostrarModalAulas(false);
            setDiaSelecionado(null);
            setHorarioSelecionado("");
          }}
          onAulaAtualizada={() => {
            carregarAulas();
          }}
        />
      )}

      {/* Modal Selecionar Professor */}
      {mostrarListaProfessores && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="bg-blue-600 text-white p-6 rounded-t-lg sticky top-0 z-10">
              <h2 className="text-2xl font-bold">Selecionar Professor</h2>
            </div>

            <div className="p-6 border-b">
              <input
                type="text"
                value={buscaFiltro}
                onChange={(e) => setBuscaFiltro(e.target.value)}
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
                      onClick={() => handleSelecionarProfessor(prof)}
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-300 flex items-center">
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
                  setBuscaFiltro("");
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Selecionar Aluno */}
      {mostrarListaAlunos && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="bg-green-600 text-white p-6 rounded-t-lg sticky top-0 z-10">
              <h2 className="text-2xl font-bold">Selecionar Aluno</h2>
            </div>

            <div className="p-6 border-b">
              <input
                type="text"
                value={buscaFiltro}
                onChange={(e) => setBuscaFiltro(e.target.value)}
                placeholder="Buscar aluno por nome..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              {alunosFiltrados.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Nenhum aluno encontrado
                </p>
              ) : (
                <div className="space-y-3">
                  {alunosFiltrados.map((aluno) => (
                    <div
                      key={aluno.id}
                      onClick={() => handleSelecionarAluno(aluno)}
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-green-50 cursor-pointer transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-300 flex items-center">
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
                  setBuscaFiltro("");
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Aulas Mês Professor */}
      {mostrarModalMesProfessor &&
        professorSelecionado &&
        mesSelecionado !== null && (
          <ModalAulasMesProfessor
            professor={professorSelecionado}
            mes={mesSelecionado}
            ano={anoMesSelecionado}
            onClose={() => {
              setMostrarModalMesProfessor(false);
              setMesSelecionado(0);
              setAnoMesSelecionado(0);
            }}
          />
        )}

      {/* Modal Edição em Massa de Aulas do Professor */}
      {mostrarModalEdicaoMassa && professorSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="bg-orange-600 text-white p-6 rounded-t-lg">
              <h2 className="text-2xl font-bold">
                Editar Aulas de {professorSelecionado.nome_completo}
              </h2>
              <p className="text-sm mt-1">Ações em massa para aulas futuras</p>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Informações */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {aulasProfesorFuturas.length} aula(s) futura(s)
                      encontrada(s)
                    </p>
                    <p className="text-sm text-gray-600">
                      Apenas aulas com data posterior a hoje serão afetadas
                    </p>
                  </div>
                </div>
              </div>

              {/* Opção 1: Excluir Aulas */}
              <div className="mb-6 border border-gray-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-red-600"
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
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Excluir Todas as Aulas Futuras
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Remove permanentemente todas as aulas futuras deste
                      professor. Esta ação não pode ser desfeita.
                    </p>
                    <button
                      onClick={handleExcluirAulasFuturas}
                      disabled={aulasProfesorFuturas.length === 0}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400"
                    >
                      Excluir {aulasProfesorFuturas.length} Aula(s)
                    </button>
                  </div>
                </div>
              </div>

              {/* Opção 2: Trocar Professor */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Trocar Professor das Aulas Futuras
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Substitui o professor atual por outro em todas as aulas
                      futuras.
                    </p>

                    {/* Lista de Professores */}
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {professores
                        .filter((p) => p.id !== professorSelecionado.id)
                        .map((prof) => (
                          <div
                            key={prof.id}
                            onClick={() =>
                              handleTrocarProfessorAulasFuturas(prof)
                            }
                            className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                          >
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-300 flex items-center">
                              {prof.foto_perfil ? (
                                <img
                                  src={`data:image/webp;base64,${prof.foto_perfil}`}
                                  alt={prof.nome_completo}
                                  className="w-full h-auto object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 font-bold">
                                  {prof.nome_completo.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold">
                                {prof.nome_completo}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-4 rounded-b-lg flex justify-end border-t">
              <button
                onClick={() => setMostrarModalEdicaoMassa(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Global - Operações em Massa */}
      {carregando && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="flex flex-col items-center gap-4">
              {/* Spinner */}
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600"></div>

              {/* Mensagem */}
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Processando...
                </h3>
                <p className="text-sm text-gray-600">
                  Por favor, aguarde enquanto processamos as aulas.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Isso pode levar alguns instantes.
                </p>
              </div>

              {/* Barra de progresso animada */}
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-orange-600 h-full rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
