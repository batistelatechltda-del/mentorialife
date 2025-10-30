import GoalsPage from "@/components/dashboard/goals";
import { cookies } from "next/headers";

async function getGoals() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL_SERVER}/api/client/goal/get-all`,
      {
        headers: {
          authorization: `${token}`,
        },
      }
    );

    const data = await res.json();
    console.log("data?.data", data?.data);
    return data?.data == null ? [] : data?.data || [];
  } catch (err) {
    console.log(err);
    return [];
  }
}

async function page() {
  const goals: any = await getGoals();
  return <GoalsPage initialGoals={goals} />;
}

export default page;
