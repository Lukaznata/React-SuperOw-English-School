// Bibliotecas
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Contextos
import { AuthProvider } from "./contexts/AuthContext";
import { CarteiraProvider } from "./contexts/CarteiraContext";
import { ToastProvider } from "./contexts/ToastContext";

// Componentes
import ProtectedRoute from "./components/Rota_protegida";

// Pages
import Header from "./components/layout/Header";
import Caixa from "./pages/Caixa";
import Aulas from "./pages/Aulas";
import Alunos from "./pages/Alunos";
import Afazeres from "./pages/Afazeres";
import Professores from "./pages/Professores";
import Login from "./pages/login";
import Erro404 from "./pages/PaginaNaoEncontrada";

// Estilos
import "./index.css";
import "./App.css";
import { ToastContainer } from "./components/Toast";

// Componente Layout para evitar repetição
const LayoutWithHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-[#e6e5e1]">
    <Header />
    <main className="h-[80%]">{children}</main>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <CarteiraProvider>
        <ToastProvider>
          <ToastContainer />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />

              {/* Rotas protegidas */}
              <Route
                path="/caixa"
                element={
                  <ProtectedRoute>
                    <LayoutWithHeader>
                      <Caixa />
                    </LayoutWithHeader>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/aulas"
                element={
                  <ProtectedRoute>
                    <LayoutWithHeader>
                      <Aulas />
                    </LayoutWithHeader>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/alunos"
                element={
                  <ProtectedRoute>
                    <LayoutWithHeader>
                      <Alunos />
                    </LayoutWithHeader>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/afazeres"
                element={
                  <ProtectedRoute>
                    <LayoutWithHeader>
                      <Afazeres />
                    </LayoutWithHeader>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/professores"
                element={
                  <ProtectedRoute>
                    <LayoutWithHeader>
                      <Professores />
                    </LayoutWithHeader>
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Erro404 />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </CarteiraProvider>
    </AuthProvider>
  );
}

export default App;
