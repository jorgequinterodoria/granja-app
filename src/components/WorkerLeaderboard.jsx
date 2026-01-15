import { useGamification } from "../hooks/useGamification";

export default function WorkerLeaderboard() {
    const { weeklyPoints } = useGamification();

    return (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>

            <div className="relative z-10 flex items-center justify-between">
                <div>
                    <h3 className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-1">Tu Desempeño Semanal</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black">{weeklyPoints}</span>
                        <span className="text-indigo-200 font-medium">Puntos</span>
                    </div>
                </div>
                <div className="text-5xl">
                    🏆
                </div>
            </div>

            <div className="mt-4 bg-white/20 rounded-full h-2 w-full overflow-hidden">
                <div
                    className="bg-yellow-400 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((weeklyPoints / 500) * 100, 100)}%` }} // Goal: 500 pts
                ></div>
            </div>
            <p className="text-[10px] text-indigo-200 mt-2 text-right">Meta semanal: 500 pts</p>
        </div>
    );
}
