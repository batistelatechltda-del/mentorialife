"use client";
import LifeAreasEmbed from "@/components/lifeAreasEmbed";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

function Page() {
  const router = useRouter();
  const starsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (starsRef.current) {
      starsRef.current.innerHTML = "";
      for (let i = 0; i < 150; i++) {
        const star = document.createElement("div");
        star.className = "absolute bg-white rounded-full animate-pulse";
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.width = `${Math.random() * 3 + 1}px`;
        star.style.height = star.style.width;
        star.style.opacity = `${Math.random() * 0.8 + 0.2}`;
        star.style.animationDelay = `${Math.random() * 3}s`;
        starsRef.current.appendChild(star);
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col px-6 bg-black from-slate-950 bg-gradient-to-b">
      <div
        ref={starsRef}
        className="fixed inset-0 overflow-hidden pointer-events-none"
        style={{ zIndex: 0 }}
      />
      <div>
        {/* Agora volta sempre para o dashboard */}
        <button onClick={() => router.push("/dashboard")} className="cursor-pointer">
          <ArrowLeft className="w-5 h-5 my-5" />
        </button>
      </div>
      <LifeAreasEmbed />
    </div>
  );
}

export default Page;
