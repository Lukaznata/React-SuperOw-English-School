import { useState, useEffect, useRef } from "react";
import api from "../services/api_connection";
import { useCarteira } from "../contexts/CarteiraContext";

interface SaldoCarteiraProps {
  className?: string;
}

export default function SaldoCarteira({ className = "" }: SaldoCarteiraProps) {
  const [saldoAtual, setSaldoAtual] = useState<number>(0);
  const [saldoAnimado, setSaldoAnimado] = useState<number>(0);
  const [error, setError] = useState("");
  const [carteiraNaoEncontrada, setCarteiraNaoEncontrada] = useState(false);
  const [criandoCarteira, setCriandoCarteira] = useState(false);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const { versaoCarteira } = useCarteira();

  const fetchSaldo = async () => {
    try {
      setCarteiraNaoEncontrada(false);
      setError("");
      const response = await api.get("/carteiras/minha");
      const saldo = parseFloat(response.data.saldo_atual);
      setSaldoAtual(isNaN(saldo) ? 0 : saldo);
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "";
      if (
        typeof detail === "string" &&
        detail.includes("Carteira não encontrada para este administrador")
      ) {
        setCarteiraNaoEncontrada(true);
      } else {
        setError("Erro ao carregar saldo");
      }
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSaldo();
    // eslint-disable-next-line
  }, [versaoCarteira]);

  useEffect(() => {
    if (saldoAtual === 0 && saldoAnimado === 0) return;

    const incrementos = 60; // frames da animação
    const incrementoPorFrame = (saldoAtual - saldoAnimado) / incrementos;
    let frameAtual = 0;

    const animar = () => {
      frameAtual++;

      if (frameAtual <= incrementos) {
        setSaldoAnimado((prev) => {
          const novoValor = prev + incrementoPorFrame;
          // Garante que não ultrapasse o valor final
          if (incrementoPorFrame > 0) {
            return Math.min(novoValor, saldoAtual);
          } else {
            return Math.max(novoValor, saldoAtual);
          }
        });

        animationFrameRef.current = requestAnimationFrame(animar);
      } else {
        setSaldoAnimado(saldoAtual);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animar);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [saldoAtual]);

  const handleCriarCarteira = async () => {
    setCriandoCarteira(true);
    try {
      await api.post("/carteiras/");
      setCarteiraNaoEncontrada(false);
      fetchSaldo();
    } catch (err) {
      setError("Erro ao criar carteira");
    } finally {
      setCriandoCarteira(false);
    }
  };

  if (carteiraNaoEncontrada) {
    return (
      <div className={className}>
        <div className="text-red-500 mb-2">
          Carteira não encontrada para este administrador.
        </div>
        <button
          onClick={handleCriarCarteira}
          disabled={criandoCarteira}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          {criandoCarteira ? "Criando..." : "Criar Carteira"}
        </button>
      </div>
    );
  }

  if (error) {
    return <div className={`${className} text-red-500`}>{error}</div>;
  }

  const corSaldo =
    saldoAnimado > 0
      ? "text-green-600"
      : saldoAnimado < 0
      ? "text-red-600"
      : "text-gray-900";
  const saldoFormatado = saldoAnimado.toFixed(2).replace(".", ",");

  return (
    <div className={className}>
      <h2 className="text-base text-gray-600">Saldo Atual:</h2>
      <p
        className={`text-base font-bold ${corSaldo} transition-colors duration-700`}
      >
        R$ {saldoFormatado}
      </p>
    </div>
  );
}
