import Dashboard from "@/components/dashboard/home";
import { cookies } from "next/headers";
async function getConversation() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL_SERVER}/api/client/conversation/get/all`,
      {
        headers: {
          authorization: `${token}`,
        },
      }
    );

    const data = await res.json();
    return data?.data == null ? [] : data?.data || [];
  } catch (err) {
    console.log(err);
    return [];
  }
}
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
    return data?.data == null ? {} : data?.data || {};
  } catch (err) {
    console.log(err);
    return [];
  }
}

async function page() {
  const conversation: any = await getConversation();
  const sidebarData: any = await getSidebarData();
  return <Dashboard conversation={conversation} sidebarData={sidebarData} />;
}

export default page;
