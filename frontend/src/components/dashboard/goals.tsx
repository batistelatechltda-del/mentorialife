"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Check, Calendar, Trash2 } from "lucide-react"; // Ícones
import { API } from "@/services";
import AddGoalModal from "./form/goal-form";
import { motion } from "framer-motion"; // Para animação

interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

const GoalsPage = ({ initialGoals }: any) => {
  const router = useRouter();

  const [goals, setGoals] = useState<Goal[]>(initialGoals);

  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    completionRate: 0,
  });

  const calculateStats = (goalsList: Goal[]) => {
    const total = goalsList.length;
    const completed = goalsList.filter((goal) => goal.is_completed).length;
    const pending = total - completed;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    setStats({
      total,
      completed,
      pending,
      completionRate,
    });
  };

  useEffect(() => {
    calculateStats(goals);
  }, [goals]);

  const handleAddGoal = () => {
    setIsModalOpen(true);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDeleteGoal = async (goalId: string) => {
    await API.deleteGoal(goalId);
    const updatedGoals = goals.filter((goal) => goal.id !== goalId);
    setGoals(updatedGoals);
  };

  const handleToggleGoalCompletion = async (
    goalId: string,
    isCompleted: boolean
  ) => {
    await API.updateGoals(goalId, { is_completed: !isCompleted });

    const updatedGoals = goals.map((goal) => {
      if (goal.id === goalId) {
        return { ...goal, is_completed: !isCompleted };
      }
      return goal;
    });
    setGoals(updatedGoals);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No due date";

    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isOverdue = (dateString: string | null) => {
    if (!dateString) return false;

    const dueDate = new Date(dateString);
    const today = new Date();
    return (
      dueDate < today &&
      dueDate.setHours(0, 0, 0, 0) < today.setHours(0, 0, 0, 0)
    );
  };

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

  // Função para gerar a mensagem motivacional baseada no progresso
  const getMotivationalMessage = (completionRate: number) => {
    const messages = {
      "0-25": [
        "Comece agora e faça acontecer! 💥",
        "O primeiro passo já foi dado, agora é seguir em frente! 🚀",
        "Cada início é um passo para o sucesso. Vamos lá! 💪",
        "Não pare! O começo é sempre o mais difícil! 🔥",
        "Você começou com o pé direito. Agora, só falta continuar! ⚡",
        "A jornada começa agora. Vá em frente! 🌟",
        "Está só começando, mas já está indo muito bem! 💥",
      ],
      "25-50": [
        "Você está indo bem! Mantenha o foco! 🔥",
        "A metade do caminho está feita. Não pare agora! 💯",
        "Já percorreu uma boa parte! Continue com tudo! 🚀",
        "Quase lá! Seu progresso está impressionante! 🙌",
        "Excelente progresso! Agora acelere mais! 🔥",
        "Nada pode parar você agora. Continue assim! 💪",
        "Você está avançando muito bem! O objetivo está próximo! 🌟",
      ],
      "50-75": [
        "Bom progresso! Vamos acelerar! 🚀",
        "Metade do caminho foi percorrida, agora é só dar o gás! 💨",
        "Está quase lá! Acelere e vá com tudo! 💪",
        "Você está indo muito bem, agora vamos para a reta final! 🏁",
        "Seu progresso é impressionante! Vamos acelerar ainda mais! 💥",
        "Já passou da metade, agora é só aumentar a velocidade! 🔥",
        "A metade do trabalho está feito, agora só falta dar o toque final! 🚀",
      ],
      "75-100": [
        "Quase lá, continue assim! 💪",
        "O fim está próximo! Só mais um empurrão! 🚀",
        "Você está quase lá, não pare agora! 💥",
        "Está na reta final! Só falta um último esforço! 💪",
        "Continue assim, você está prestes a alcançar seu objetivo! 🌟",
        "Faltam poucos passos! Vai com tudo! 💯",
        "Quase lá! Agora é só dar aquele último gás! 🏆",
      ],
      "100": [
        "Mandou bem, rei 🏆",
        "Você conseguiu! Parabéns! 🎉",
        "Objetivo alcançado! Você é incrível! 💪",
        "Meta cumprida! Agora, comemore! 🥳",
        "Fez acontecer! Parabéns pelo esforço e sucesso! 🌟",
        "Você conquistou tudo! Muito bem! 🔥",
        "Objetivo cumprido com sucesso! Você é uma lenda! 🏆",
      ],
    };

    const range = completionRate <= 25
      ? "0-25"
      : completionRate <= 50
      ? "25-50"
      : completionRate <= 75
      ? "50-75"
      : completionRate < 100
      ? "75-100"
      : "100";

    const lastRange = localStorage.getItem("lastRange");
    if (lastRange !== range) {
      const randomMessage =
        messages[range][Math.floor(Math.random() * messages[range].length)];
      
      localStorage.setItem("motivationalMessage", randomMessage);
      localStorage.setItem("lastRange", range);
    }

    return localStorage.getItem("motivationalMessage") || "Continue assim!";
  };

  return (
    <div className="min-h-screen bg-black from-slate-950 bg-gradient-to-b">
      <div
        ref={starsRef}
        className="fixed inset-0 overflow-hidden pointer-events-none"
        style={{ zIndex: 0 }}
      />
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={18} className="mr-2" />
            <span>Back</span>
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            My Goals
          </h1>
          <button
            onClick={handleAddGoal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
          >
            <Plus size={16} />
            Add Goal
          </button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Goals
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.total}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Completed
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.completed}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
            <p className="text-2xl font-bold text-orange-500 dark:text-orange-400">
              {stats.pending}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Completion
            </p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {Math.round(stats.completionRate)}%
            </p>
          </div>
        </div>

        {/* Barra de Progresso Personalizada */}
        <div className="space-y-4">
          <div className="text-center mb-6">
            <motion.div
              className="bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden"
              style={{ width: "100%" }}
              initial={{ width: 0 }}
              animate={{ width: `${stats.completionRate}%` }}
            >
              <div
                className="bg-green-500 h-6"
                style={{
                  width: `${stats.completionRate}%`,
                  transition: "width 0.5s ease-in-out",
                }}
              />
            </motion.div>
            <p className="mt-1 text-lg text-green-600 dark:text-green-400">
              {getMotivationalMessage(stats.completionRate)}
            </p>
          </div>

          {/* Renderizando as Metas */}
          {goals.length > 0 ? (
            goals.map((goal) => (
              <div
                key={goal.id}
                className={`bg-white dark:bg-gray-800 p-4 rounded shadow border-l-4 ${
                  goal.is_completed
                    ? "border-green-500"
                    : isOverdue(goal.due_date)
                    ? "border-red-500"
                    : "border-blue-500"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() =>
                        handleToggleGoalCompletion(goal.id, goal.is_completed)
                      }
                      className={`mt-1 w-5 h-5 rounded-full cursor-pointer flex-shrink-0 flex items-center justify-center border ${
                        goal.is_completed
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-gray-400 dark:border-gray-500"
                      }`}
                    >
                      {goal.is_completed && <Check size={12} />}
                    </button>
                    <div>
                      <h3
                        className={`font-medium ${
                          goal.is_completed
                            ? "text-gray-500 dark:text-gray-400 line-through"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {goal.title}
                      </h3>
                      {goal.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {goal.description}
                        </p>
                      )}
                      <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <Calendar size={12} className="mr-1" />
                        <span
                          className={
                            isOverdue(goal.due_date) && !goal.is_completed
                              ? "text-red-500 dark:text-red-400"
                              : ""
                          }
                        >
                          {formatDate(goal.due_date)}
                          {isOverdue(goal.due_date) && !goal.is_completed && " (Overdue)"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded shadow">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No goals yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Start by adding your first goal.
              </p>
              <button
                onClick={handleAddGoal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
              >
                <Plus size={16} />
                Add Goal
              </button>
            </div>
          )}
        </div>
      </main>
      <AddGoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddGoal={handleAddGoal}
        setGoals={setGoals}
      />
    </div>
  );
};

export default GoalsPage;
