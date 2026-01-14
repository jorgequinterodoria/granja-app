import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

export default function PigList({ onSelectPig }) {
    const pigs = useLiveQuery(
        () => db.pigs.toArray()
    );

    if (!pigs) return null;

    if (pigs.length === 0) {
        return (
            <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-100 mt-8">
                <p className="text-slate-500">No hay cerdos registrados aún.</p>
            </div>
        );
    }

    // Sort by updated_at desc (newest first)
    const sortedPigs = [...pigs].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    return (
        <div className="mt-12">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 px-2">Animales Registrados ({pigs.length})</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedPigs.map(pig => (
                    <div
                        key={pig.id}
                        onClick={() => onSelectPig && onSelectPig(pig.id)}
                        className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer relative overflow-hidden active:scale-95 transform"
                    >

                        {/* Status Stripe */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${pig.syncStatus === 'synced' ? 'bg-green-400' : 'bg-yellow-400'}`}></div>

                        <div className="flex justify-between items-start mb-3 pl-3">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                    {pig.numero_arete}
                                    {pig.nombre && <span className="text-sm font-normal text-slate-500">({pig.nombre})</span>}
                                </h3>
                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{pig.etapa}</span>
                            </div>
                            <div className="text-right">
                                <span className={`text-xs px-2 py-1 rounded-full ${pig.sexo === 'Macho' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                                    {pig.sexo}
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-between items-end pl-3 pt-2 border-t border-slate-50">
                            <div>
                                <p className="text-xs text-slate-400">Peso Actual</p>
                                <p className="font-semibold text-slate-700">{pig.peso} kg</p>
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-1" title={pig.syncStatus === 'synced' ? "Sincronizado" : "Pendiente de subir"}>
                                {pig.syncStatus === 'synced' ? (
                                    <>☁️ Sincronizado</>
                                ) : (
                                    <span className="text-yellow-600">⏳ Pendiente</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
