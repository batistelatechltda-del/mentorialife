// page.tsx - Componente de Servidor

import { cookies } from "next/headers"; // Usando cookies no servidor
import Dashboard from "@/components/dashboard/home";

// Função assíncrona para obter a conversa
async function getConversation() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL_SERVER}/api/client/conversation/get/all`,
      {
        headers: {
          authorization: `${token}`, // Envia o token de autenticação
        },
      }
    );
    const data = await res.json();
    return data?.data || [];
  } catch (err) {
    console.log(err);
    return [];
  }
}

// Função assíncrona para obter os dados do sidebar
async function getSidebarData() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL_SERVER}/api/client/conversation/todo/get-all`,
      {
        headers: {
          authorization: `${token}`,
        },
      }
    );
    const data = await res.json();
    return data?.data || {};
  } catch (err) {
    console.log(err);
    return [];
  }
}

// Componente de Servidor para a Página
const Page = async () => {
  const conversation = await getConversation(); // Busca a conversa
  const sidebarData = await getSidebarData(); // Busca os dados do sidebar

  return <Dashboard conversation={conversation} sidebarData={sidebarData} />;
};

export default Page;
