import Calendar from "@/components/dashboard/calender";
import { cookies } from "next/headers";

async function getCalender() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL_SERVER}/api/client/calendar-event/get-all`,
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

async function page() {
  const events: any = await getCalender();
  return <Calendar initEvents={events} />;
}

export default page;
