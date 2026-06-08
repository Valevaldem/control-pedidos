import React, { useState, useEffect } from 'react';
import { Package, Users, FileText, Download, Plus, Trash2, Check, Clock, AlertCircle, ChevronRight, Upload, Copy, Edit2, X, Calendar, ArrowLeft, FileDown, UserCheck, Settings, Power } from 'lucide-react';
import { supabase } from './supabaseClient';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function App() {
  const [view, setView] = useState('home');
  const [subView, setSubView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [asesoras, setAsesoras] = useState([]);
  const [semanas, setSemanas] = useState([]);
  const [semanaActiva, setSemanaActiva] = useState(null);
  const [selectedAsesora, setSelectedAsesora] = useState(null);
  const [draftWeek, setDraftWeek] = useState(null);
  const [editingSemanaId, setEditingSemanaId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    try {
      const { data: asesorasData } = await supabase.from('asesoras').select('*').order('nombre');
      if (asesorasData) setAsesoras(asesorasData);

      const { data: semanasData } = await supabase.from('semanas').select('*').order('creada');
      if (semanasData) {
        setSemanas(semanasData);
        const activa = semanasData.find(w => w.activa);
        setSemanaActiva(activa || null);
      }
    } catch (e) {
      console.error('Error cargando datos:', e);
    }
    setLoading(false);
  };

  const saveAsesoras = async (newList, action) => {
    try {
      if (action.type === 'add') {
        await supabase.from('asesoras').insert([action.item]);
      } else if (action.type === 'delete') {
        await supabase.from('asesoras').delete().eq('id', action.item.id);
      } else if (action.type === 'update') {
        await supabase.from('asesoras').update({ nombre: action.item.nombre }).eq('id', action.item.id);
      }
      setAsesoras(newList);
    } catch (e) {
      showToast('Error al guardar', 'error');
    }
  };

  const saveSemanas = async (newList, changedSemana) => {
    try {
      if (changedSemana === 'all') {
        for (const s of newList) {
          await supabase.from('semanas').upsert(s);
        }
      } else if (changedSemana) {
        await supabase.from('semanas').upsert(changedSemana);
      }
      setSemanas(newList);
      const activa = newList.find(w => w.activa);
      setSemanaActiva(activa || null);
    } catch (e) {
      console.error(e);
      showToast('Error al guardar', 'error');
    }
  };

  const eliminarSemana = async (semanaId) => {
    try {
      await supabase.from('semanas').delete().eq('id', semanaId);
      const nuevaLista = semanas.filter(s => s.id !== semanaId);
      setSemanas(nuevaLista);
      const activa = nuevaLista.find(w => w.activa);
      setSemanaActiva(activa || null);
      showToast('Semana eliminada');
    } catch (e) {
      showToast('Error al eliminar', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-stone-400">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-600'}`}>
          {toast.msg}
        </div>
      )}

      {view === 'home' && <HomeView setView={setView} setSubView={setSubView} setSelectedAsesora={setSelectedAsesora} asesoras={asesoras} semanaActiva={semanaActiva} />}

      {view === 'logistica' && (
        <LogisticaView
          subView={subView}
          setSubView={setSubView}
          setView={setView}
          asesoras={asesoras}
          saveAsesoras={saveAsesoras}
          semanas={semanas}
          saveSemanas={saveSemanas}
          semanaActiva={semanaActiva}
          draftWeek={draftWeek}
          setDraftWeek={setDraftWeek}
          showToast={showToast}
          loadData={loadData}
          eliminarSemana={eliminarSemana}
          editingSemanaId={editingSemanaId}
          setEditingSemanaId={setEditingSemanaId}
        />
      )}

      {view === 'asesora' && (
        <AsesoraView
          selectedAsesora={selectedAsesora}
          setSelectedAsesora={setSelectedAsesora}
          setView={setView}
          semanaActiva={semanaActiva}
          semanas={semanas}
          saveSemanas={saveSemanas}
          showToast={showToast}
          loadData={loadData}
        />
      )}
    </div>
  );
}

function HomeView({ setView, setSubView, setSelectedAsesora, asesoras, semanaActiva }) {
  return (
    <div className="max-w-4xl mx-auto p-6 pt-12">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-stone-800 rounded-2xl mb-4">
          <Package className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-semibold text-stone-900 mb-2">Control de Pedidos Foráneos</h1>
        <p className="text-stone-500">Seguimiento semanal de entregas por paquetería</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <button
          onClick={() => { setView('logistica'); setSubView('dashboard'); }}
          className="bg-white rounded-2xl p-6 text-left hover:shadow-md transition border border-stone-200 group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center group-hover:bg-stone-800 transition">
              <FileText className="w-6 h-6 text-stone-700 group-hover:text-white transition" />
            </div>
            <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-stone-800 transition" />
          </div>
          <h2 className="text-lg font-semibold mb-1">Soy Logística</h2>
          <p className="text-sm text-stone-500">Gestiona semanas, asesoras, pedidos y descarga reportes</p>
        </button>

        <button
          onClick={() => { setView('asesora'); setSelectedAsesora(null); }}
          className="bg-white rounded-2xl p-6 text-left hover:shadow-md transition border border-stone-200 group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center group-hover:bg-stone-800 transition">
              <UserCheck className="w-6 h-6 text-stone-700 group-hover:text-white transition" />
            </div>
            <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-stone-800 transition" />
          </div>
          <h2 className="text-lg font-semibold mb-1">Soy Asesora</h2>
          <p className="text-sm text-stone-500">Da seguimiento a tus clientes foráneos de la semana</p>
        </button>
      </div>

      {semanaActiva && (
        <div className="mt-8 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <Calendar className="w-5 h-5 text-emerald-700" />
          <div className="text-sm">
            <span className="font-medium text-emerald-900">Semana activa:</span>
            <span className="text-emerald-700 ml-2">{semanaActiva.nombre}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function LogisticaView({ subView, setSubView, setView, asesoras, saveAsesoras, semanas, saveSemanas, semanaActiva, draftWeek, setDraftWeek, showToast, loadData, eliminarSemana, editingSemanaId, setEditingSemanaId }) {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setView('home')} className="flex items-center gap-2 text-stone-500 hover:text-stone-800 text-sm">
          <ArrowLeft className="w-4 h-4" /> Inicio
        </button>
        <button onClick={loadData} className="text-sm text-stone-500 hover:text-stone-800">↻ Actualizar</button>
      </div>

      <div className="flex gap-1 mb-6 border-b border-stone-200 overflow-x-auto">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: FileText },
          { id: 'asesoras', label: 'Asesoras', icon: Users },
          { id: 'nuevaSemana', label: 'Nueva semana', icon: Plus },
          { id: 'seguimiento', label: 'Seguimiento', icon: Clock },
          { id: 'gestionar', label: 'Gestionar semanas', icon: Settings },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setSubView(t.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap border-b-2 transition ${
              subView === t.id ? 'border-stone-800 text-stone-900 font-medium' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {subView === 'dashboard' && <Dashboard semanaActiva={semanaActiva} semanas={semanas} setSubView={setSubView} />}
      {subView === 'asesoras' && <GestionAsesoras asesoras={asesoras} saveAsesoras={saveAsesoras} showToast={showToast} />}
      {subView === 'nuevaSemana' && <NuevaSemana asesoras={asesoras} semanas={semanas} saveSemanas={saveSemanas} draftWeek={draftWeek} setDraftWeek={setDraftWeek} showToast={showToast} setSubView={setSubView} />}
      {subView === 'seguimiento' && <Seguimiento semanaActiva={semanaActiva} asesoras={asesoras} semanas={semanas} saveSemanas={saveSemanas} showToast={showToast} />}
      {subView === 'gestionar' && (
        <GestionarSemanas
          semanas={semanas}
          saveSemanas={saveSemanas}
          eliminarSemana={eliminarSemana}
          editingSemanaId={editingSemanaId}
          setEditingSemanaId={setEditingSemanaId}
          asesoras={asesoras}
          showToast={showToast}
        />
      )}
    </div>
  );
}

function Dashboard({ semanaActiva, semanas, setSubView }) {
  if (!semanaActiva) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-stone-200">
        <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-stone-700 mb-2">No hay semana activa</h3>
        <p className="text-stone-500 mb-6">Crea una nueva semana para empezar a registrar pedidos</p>
        <button onClick={() => setSubView('nuevaSemana')} className="bg-stone-800 text-white px-5 py-2.5 rounded-lg hover:bg-stone-900 inline-flex items-center gap-2">
          <Plus className="w-4 h-4" /> Crear semana
        </button>
      </div>
    );
  }

  const totalPedidos = semanaActiva.pedidos?.length || 0;
  const conRespuesta = semanaActiva.pedidos?.filter(p => p.respondio === 'si').length || 0;
  const sinRespuesta = semanaActiva.pedidos?.filter(p => p.respondio === 'no').length || 0;
  const pendientes = semanaActiva.pedidos?.filter(p => !p.respondio || p.respondio === 'pendiente').length || 0;
  const entregados = semanaActiva.entregas?.length || 0;
  const totalAsesoras = [...new Set(semanaActiva.pedidos?.map(p => p.asesora) || [])].length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-stone-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs text-stone-500 uppercase tracking-wide mb-1">Semana activa</div>
            <h2 className="text-xl font-semibold">{semanaActiva.nombre}</h2>
          </div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">Activa</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <StatCard label="Pedidos totales" value={totalPedidos} />
          <StatCard label="Con respuesta" value={conRespuesta} color="emerald" />
          <StatCard label="Sin respuesta" value={sinRespuesta} color="amber" />
          <StatCard label="Pendientes" value={pendientes} color="stone" />
        </div>

        <div className="mt-4 pt-4 border-t border-stone-100 text-sm text-stone-500">
          {entregados} de {totalAsesoras} asesoras han entregado su seguimiento
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-stone-200">
        <h3 className="font-semibold mb-4">Historial de semanas</h3>
        {semanas.length === 0 ? (
          <p className="text-stone-500 text-sm">Aún no hay semanas creadas</p>
        ) : (
          <div className="space-y-2">
            {semanas.slice().reverse().map(s => (
              <div key={s.id} className="flex items-center justify-between py-2 px-3 hover:bg-stone-50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">{s.nombre}</div>
                  <div className="text-xs text-stone-500">{s.pedidos?.length || 0} pedidos · {s.activa ? 'Activa' : 'Cerrada'}</div>
                </div>
                {s.activa && <span className="text-xs text-emerald-600 font-medium">●</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color = 'stone' }) {
  const colorMap = { stone: 'text-stone-800', emerald: 'text-emerald-700', amber: 'text-amber-700' };
  return (
    <div className="bg-stone-50 rounded-xl p-4">
      <div className="text-xs text-stone-500 mb-1">{label}</div>
      <div className={`text-2xl font-semibold ${colorMap[color]}`}>{value}</div>
    </div>
  );
}

function GestionAsesoras({ asesoras, saveAsesoras, showToast }) {
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const agregar = () => {
    const nombre = nuevoNombre.trim();
    if (!nombre) return;
    if (asesoras.some(a => a.nombre.toLowerCase() === nombre.toLowerCase())) {
      showToast('Ya existe una asesora con ese nombre', 'error');
      return;
    }
    const item = { id: Date.now().toString(), nombre };
    saveAsesoras([...asesoras, item], { type: 'add', item });
    setNuevoNombre('');
    showToast('Asesora agregada');
  };

  const eliminar = (item) => {
    if (confirm('¿Eliminar esta asesora?')) {
      saveAsesoras(asesoras.filter(a => a.id !== item.id), { type: 'delete', item });
    }
  };

  const guardarEdicion = (id) => {
    const nombre = editValue.trim();
    if (!nombre) return;
    const item = { id, nombre };
    saveAsesoras(asesoras.map(a => a.id === id ? item : a), { type: 'update', item });
    setEditingId(null);
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-stone-200">
      <h2 className="font-semibold mb-4">Catálogo de asesoras</h2>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={nuevoNombre}
          onChange={(e) => setNuevoNombre(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && agregar()}
          placeholder="Nombre de la asesora"
          className="flex-1 px-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400"
        />
        <button onClick={agregar} className="bg-stone-800 text-white px-4 py-2.5 rounded-lg hover:bg-stone-900 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Agregar
        </button>
      </div>

      {asesoras.length === 0 ? (
        <p className="text-stone-500 text-sm text-center py-8">Aún no hay asesoras registradas</p>
      ) : (
        <div className="space-y-1">
          {asesoras.map(a => (
            <div key={a.id} className="flex items-center justify-between py-2 px-3 hover:bg-stone-50 rounded-lg">
              {editingId === a.id ? (
                <>
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && guardarEdicion(a.id)}
                    className="flex-1 px-2 py-1 border border-stone-300 rounded mr-2"
                    autoFocus
                  />
                  <button onClick={() => guardarEdicion(a.id)} className="text-emerald-600 p-1"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setEditingId(null)} className="text-stone-400 p-1"><X className="w-4 h-4" /></button>
                </>
              ) : (
                <>
                  <span className="text-sm">{a.nombre}</span>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingId(a.id); setEditValue(a.nombre); }} className="text-stone-400 hover:text-stone-700 p-1.5">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => eliminar(a)} className="text-stone-400 hover:text-red-500 p-1.5">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NuevaSemana({ asesoras, semanas, saveSemanas, draftWeek, setDraftWeek, showToast, setSubView }) {
  const [step, setStep] = useState(draftWeek ? 'cargar' : 'crear');
  const [nombreSemana, setNombreSemana] = useState('');
  const [arrastreSeleccion, setArrastreSeleccion] = useState({});

  const semanaAnterior = semanas.find(s => s.activa) || semanas[semanas.length - 1];
  const pedidosArrastrables = semanaAnterior?.pedidos?.filter(p => p.respondio !== 'si' && (p.intento || 1) < 2) || [];

  const crearSemana = () => {
    const nombre = nombreSemana.trim();
    if (!nombre) { showToast('Pon un nombre a la semana', 'error'); return; }
    const nueva = {
      id: Date.now().toString(),
      nombre,
      pedidos: [],
      entregas: [],
      activa: false,
      creada: new Date().toISOString(),
    };
    setDraftWeek(nueva);
    setStep(pedidosArrastrables.length > 0 ? 'arrastre' : 'cargar');
  };

  const aplicarArrastre = () => {
    const arrastrados = pedidosArrastrables
      .filter(p => arrastreSeleccion[p.id])
      .map(p => ({
        ...p,
        id: Date.now().toString() + Math.random(),
        intento: (p.intento || 1) + 1,
        mensajeEnviado: null,
        respondio: null,
        queContesto: '',
        referencias: '',
      }));
    setDraftWeek({ ...draftWeek, pedidos: [...(draftWeek.pedidos || []), ...arrastrados] });
    setStep('cargar');
  };

  const activarSemana = async (pedidos) => {
    const nuevaSemana = { ...draftWeek, pedidos: [...(draftWeek.pedidos || []), ...pedidos], activa: true };
    const semanasActualizadas = semanas.map(s => ({ ...s, activa: false }));
    const todasNuevas = [...semanasActualizadas, nuevaSemana];
    await saveSemanas(todasNuevas, 'all');
    setDraftWeek(null);
    showToast('Semana activada correctamente');
    setSubView('dashboard');
  };

  if (step === 'crear') {
    return (
      <div className="bg-white rounded-2xl p-6 border border-stone-200 max-w-xl">
        <h2 className="font-semibold mb-1">Nueva semana</h2>
        <p className="text-sm text-stone-500 mb-6">Empieza definiendo el nombre o rango de la semana</p>
        <label className="block text-sm font-medium text-stone-700 mb-2">Nombre de la semana</label>
        <input
          type="text"
          value={nombreSemana}
          onChange={(e) => setNombreSemana(e.target.value)}
          placeholder="Ej: Semana del 26 mayo - 1 junio"
          className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400 mb-6"
        />
        <button onClick={crearSemana} className="bg-stone-800 text-white px-5 py-2.5 rounded-lg hover:bg-stone-900">Continuar</button>
      </div>
    );
  }

  if (step === 'arrastre') {
    return (
      <div className="bg-white rounded-2xl p-6 border border-stone-200">
        <h2 className="font-semibold mb-1">Arrastrar pedidos sin respuesta</h2>
        <p className="text-sm text-stone-500 mb-6">Selecciona los pedidos de "{semanaAnterior?.nombre}" que quieras arrastrar a esta nueva semana</p>

        <div className="border border-stone-200 rounded-lg overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead className="bg-stone-50">
              <tr>
                <th className="text-left p-3 w-12">
                  <input
                    type="checkbox"
                    checked={pedidosArrastrables.every(p => arrastreSeleccion[p.id])}
                    onChange={(e) => {
                      const sel = {};
                      pedidosArrastrables.forEach(p => { sel[p.id] = e.target.checked; });
                      setArrastreSeleccion(sel);
                    }}
                  />
                </th>
                <th className="text-left p-3 font-medium">Pedido</th>
                <th className="text-left p-3 font-medium">Cliente</th>
                <th className="text-left p-3 font-medium">Asesora</th>
                <th className="text-left p-3 font-medium">Intento</th>
              </tr>
            </thead>
            <tbody>
              {pedidosArrastrables.map(p => (
                <tr key={p.id} className="border-t border-stone-100">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={!!arrastreSeleccion[p.id]}
                      onChange={(e) => setArrastreSeleccion({ ...arrastreSeleccion, [p.id]: e.target.checked })}
                    />
                  </td>
                  <td className="p-3">{p.numeroPedido}</td>
                  <td className="p-3">{p.cliente}</td>
                  <td className="p-3">{p.asesora}</td>
                  <td className="p-3"><span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded">Intento {(p.intento || 1) + 1} de 2</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-xs text-stone-500 mb-4">Los pedidos al intento 2 que sigan sin respuesta serán marcados como descartados.</div>

        <div className="flex gap-2">
          <button onClick={() => setStep('cargar')} className="px-5 py-2.5 border border-stone-200 rounded-lg hover:bg-stone-50">Saltar</button>
          <button onClick={aplicarArrastre} className="bg-stone-800 text-white px-5 py-2.5 rounded-lg hover:bg-stone-900">Arrastrar seleccionados</button>
        </div>
      </div>
    );
  }

  return <CargarPedidos asesoras={asesoras} draftWeek={draftWeek} setDraftWeek={setDraftWeek} activarSemana={activarSemana} showToast={showToast} />;
}

function CargarPedidos({ asesoras, draftWeek, setDraftWeek, activarSemana, showToast }) {
  const [modo, setModo] = useState('manual');
  const [pedidosNuevos, setPedidosNuevos] = useState([]);
  const [manualForm, setManualForm] = useState({ numeroPedido: '', cliente: '', asesora: '' });
  const [pasteText, setPasteText] = useState('');

  const agregarManual = () => {
    if (!manualForm.numeroPedido || !manualForm.cliente || !manualForm.asesora) {
      showToast('Completa todos los campos', 'error'); return;
    }
    setPedidosNuevos([...pedidosNuevos, {
      id: Date.now().toString() + Math.random(),
      numeroPedido: manualForm.numeroPedido,
      cliente: manualForm.cliente,
      asesora: manualForm.asesora,
      intento: 1, mensajeEnviado: null, respondio: null, queContesto: '', referencias: '',
    }]);
    setManualForm({ numeroPedido: '', cliente: '', asesora: manualForm.asesora });
  };

  const procesarPaste = () => {
    const lines = pasteText.trim().split('\n').filter(l => l.trim());
    const nuevos = [];
    let errores = 0;
    lines.forEach(line => {
      const parts = line.split('\t').length > 1 ? line.split('\t') : line.split(',');
      if (parts.length >= 3) {
        nuevos.push({
          id: Date.now().toString() + Math.random() + nuevos.length,
          numeroPedido: parts[0].trim(), cliente: parts[1].trim(), asesora: parts[2].trim(),
          intento: 1, mensajeEnviado: null, respondio: null, queContesto: '', referencias: '',
        });
      } else { errores++; }
    });
    setPedidosNuevos([...pedidosNuevos, ...nuevos]);
    setPasteText('');
    showToast(`${nuevos.length} pedidos agregados${errores > 0 ? `, ${errores} líneas con error` : ''}`);
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      const nuevos = [];
      const startRow = (typeof data[0]?.[0] === 'string' && isNaN(parseInt(data[0][0]))) ? 1 : 0;
      for (let i = startRow; i < data.length; i++) {
        const row = data[i];
        if (row.length >= 3 && row[0] && row[1] && row[2]) {
          nuevos.push({
            id: Date.now().toString() + Math.random() + i,
            numeroPedido: String(row[0]).trim(), cliente: String(row[1]).trim(), asesora: String(row[2]).trim(),
            intento: 1, mensajeEnviado: null, respondio: null, queContesto: '', referencias: '',
          });
        }
      }
      setPedidosNuevos([...pedidosNuevos, ...nuevos]);
      showToast(`${nuevos.length} pedidos importados`);
    } catch (err) {
      showToast('Error al leer el Excel', 'error');
    }
    e.target.value = '';
  };

  const eliminarNuevo = (id) => setPedidosNuevos(pedidosNuevos.filter(p => p.id !== id));
  const cambiarAsesoraNuevo = (id, asesora) => setPedidosNuevos(pedidosNuevos.map(p => p.id === id ? { ...p, asesora } : p));

  const finalizar = () => {
    const todos = [...(draftWeek.pedidos || []), ...pedidosNuevos];
    if (todos.length === 0) { showToast('Agrega al menos un pedido', 'error'); return; }
    activarSemana(pedidosNuevos);
  };

  const pedidosArrastrados = draftWeek.pedidos?.filter(p => (p.intento || 1) > 1) || [];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-6 border border-stone-200">
        <h2 className="font-semibold mb-1">Cargar pedidos: {draftWeek.nombre}</h2>
        <p className="text-sm text-stone-500 mb-6">Elige cómo quieres agregar los pedidos</p>

        <div className="flex gap-1 mb-6 border-b border-stone-200">
          {[
            { id: 'manual', label: 'Manual', icon: Plus },
            { id: 'pegar', label: 'Pegar de Excel', icon: Copy },
            { id: 'excel', label: 'Importar Excel', icon: Upload },
          ].map(t => (
            <button key={t.id} onClick={() => setModo(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm border-b-2 transition ${modo === t.id ? 'border-stone-800 text-stone-900 font-medium' : 'border-transparent text-stone-500'}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        {modo === 'manual' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <input type="text" value={manualForm.numeroPedido} onChange={(e) => setManualForm({ ...manualForm, numeroPedido: e.target.value })} placeholder="# Pedido" className="px-3 py-2 border border-stone-200 rounded-lg text-sm" />
            <input type="text" value={manualForm.cliente} onChange={(e) => setManualForm({ ...manualForm, cliente: e.target.value })} placeholder="Cliente" className="px-3 py-2 border border-stone-200 rounded-lg text-sm" />
            <select value={manualForm.asesora} onChange={(e) => setManualForm({ ...manualForm, asesora: e.target.value })} className="px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white">
              <option value="">Asesora...</option>
              {asesoras.map(a => <option key={a.id} value={a.nombre}>{a.nombre}</option>)}
            </select>
            <button onClick={agregarManual} className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-900">Agregar</button>
          </div>
        )}

        {modo === 'pegar' && (
          <div>
            <p className="text-xs text-stone-500 mb-2">Pega 3 columnas separadas por tab o coma: <span className="font-mono">#Pedido · Cliente · Asesora</span></p>
            <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder="12345&#9;María López&#9;Sofi" rows={6} className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm font-mono mb-2" />
            <button onClick={procesarPaste} className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-900">Procesar</button>
          </div>
        )}

        {modo === 'excel' && (
          <div className="border-2 border-dashed border-stone-200 rounded-xl p-8 text-center">
            <Upload className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <p className="text-sm text-stone-600 mb-1">Sube un archivo .xlsx</p>
            <p className="text-xs text-stone-400 mb-4">Las columnas deben ser: # Pedido, Cliente, Asesora</p>
            <label className="inline-block bg-stone-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-900 cursor-pointer">
              Seleccionar archivo
              <input type="file" accept=".xlsx,.xls" onChange={handleExcelUpload} className="hidden" />
            </label>
          </div>
        )}
      </div>

      {(pedidosNuevos.length > 0 || pedidosArrastrados.length > 0) && (
        <div className="bg-white rounded-2xl p-6 border border-stone-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Pedidos a cargar ({pedidosNuevos.length + pedidosArrastrados.length})</h3>
            <button onClick={finalizar} className="bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-emerald-700 flex items-center gap-2">
              <Check className="w-4 h-4" /> Activar semana
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50">
                <tr>
                  <th className="text-left p-3 font-medium">Pedido</th>
                  <th className="text-left p-3 font-medium">Cliente</th>
                  <th className="text-left p-3 font-medium">Asesora</th>
                  <th className="text-left p-3 font-medium">Tipo</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {pedidosArrastrados.map(p => (
                  <tr key={p.id} className="border-t border-stone-100 bg-amber-50/30">
                    <td className="p-3">{p.numeroPedido}</td>
                    <td className="p-3">{p.cliente}</td>
                    <td className="p-3">{p.asesora}</td>
                    <td className="p-3"><span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">Arrastre {p.intento}/2</span></td>
                    <td className="p-3"></td>
                  </tr>
                ))}
                {pedidosNuevos.map(p => (
                  <tr key={p.id} className="border-t border-stone-100">
                    <td className="p-3">{p.numeroPedido}</td>
                    <td className="p-3">{p.cliente}</td>
                    <td className="p-3">
                      <select value={p.asesora} onChange={(e) => cambiarAsesoraNuevo(p.id, e.target.value)} className="px-2 py-1 border border-stone-200 rounded text-sm bg-white">
                        <option value="">Sin asignar</option>
                        {asesoras.map(a => <option key={a.id} value={a.nombre}>{a.nombre}</option>)}
                        {!asesoras.find(a => a.nombre === p.asesora) && p.asesora && (<option value={p.asesora}>{p.asesora} (no en catálogo)</option>)}
                      </select>
                    </td>
                    <td className="p-3"><span className="text-xs px-2 py-0.5 bg-stone-100 text-stone-700 rounded">Nuevo</span></td>
                    <td className="p-3"><button onClick={() => eliminarNuevo(p.id)} className="text-stone-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Seguimiento({ semanaActiva, asesoras, semanas, saveSemanas, showToast }) {
  if (!semanaActiva) {
    return <div className="bg-white rounded-2xl p-12 text-center border border-stone-200"><p className="text-stone-500">No hay semana activa</p></div>;
  }

  const asesorasConPedidos = [...new Set(semanaActiva.pedidos.map(p => p.asesora))];
  const entregas = semanaActiva.entregas || [];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-6 border border-stone-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold">{semanaActiva.nombre}</h2>
            <p className="text-sm text-stone-500">{semanaActiva.pedidos.length} pedidos totales · {asesorasConPedidos.length} asesoras</p>
          </div>
          <button onClick={() => generarPDF(semanaActiva)} className="bg-stone-800 text-white px-4 py-2.5 rounded-lg text-sm hover:bg-stone-900 flex items-center gap-2">
            <FileDown className="w-4 h-4" /> Descargar PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-stone-200">
        <h3 className="font-semibold mb-4">Estatus por asesora</h3>
        <div className="space-y-2">
          {asesorasConPedidos.map(nombre => {
            const pedidosAsesora = semanaActiva.pedidos.filter(p => p.asesora === nombre);
            const entrega = entregas.find(e => e.asesora === nombre);
            const llenos = pedidosAsesora.filter(p => p.mensajeEnviado !== null).length;
            return (
              <div key={nombre} className="flex items-center justify-between p-3 border border-stone-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${entrega ? 'bg-emerald-500' : 'bg-stone-300'}`} />
                  <div>
                    <div className="font-medium text-sm">{nombre}</div>
                    <div className="text-xs text-stone-500">
                      {llenos} de {pedidosAsesora.length} pedidos llenos
                      {entrega && ` · Entregado ${new Date(entrega.fecha).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
                    </div>
                  </div>
                </div>
                {entrega ? (
                  <span className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded font-medium">Entregado</span>
                ) : (
                  <span className="text-xs px-2 py-1 bg-stone-100 text-stone-600 rounded">Pendiente</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ========== GESTIONAR SEMANAS (NUEVO) ==========
function GestionarSemanas({ semanas, saveSemanas, eliminarSemana, editingSemanaId, setEditingSemanaId, asesoras, showToast }) {
  const [confirmDelete, setConfirmDelete] = useState(null);

  if (semanas.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-stone-200">
        <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-4" />
        <p className="text-stone-500">Aún no hay semanas creadas</p>
      </div>
    );
  }

  const semanaEditando = semanas.find(s => s.id === editingSemanaId);

  if (semanaEditando) {
    return <EditarSemana semana={semanaEditando} semanas={semanas} saveSemanas={saveSemanas} asesoras={asesoras} showToast={showToast} onClose={() => setEditingSemanaId(null)} />;
  }

  const activar = async (semana) => {
    if (!confirm(`¿Activar "${semana.nombre}"? Esto desactivará la semana actualmente activa.`)) return;
    const nuevaLista = semanas.map(s => ({ ...s, activa: s.id === semana.id }));
    await saveSemanas(nuevaLista, 'all');
    showToast('Semana activada');
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-6 border border-stone-200">
        <h2 className="font-semibold mb-1">Gestionar semanas</h2>
        <p className="text-sm text-stone-500 mb-6">Edita el nombre, modifica pedidos, activa/desactiva o elimina semanas</p>

        <div className="space-y-2">
          {semanas.slice().reverse().map(s => (
            <div key={s.id} className="border border-stone-200 rounded-xl p-4 hover:border-stone-300 transition">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{s.nombre}</span>
                    {s.activa && <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-medium">Activa</span>}
                  </div>
                  <div className="text-xs text-stone-500">
                    {s.pedidos?.length || 0} pedidos · {s.entregas?.length || 0} asesoras entregaron · Creada {new Date(s.creada).toLocaleDateString('es-MX')}
                  </div>
                </div>

                <div className="flex gap-1.5">
                  {!s.activa && (
                    <button
                      onClick={() => activar(s)}
                      className="text-xs px-3 py-1.5 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 flex items-center gap-1"
                    >
                      <Power className="w-3 h-3" /> Activar
                    </button>
                  )}
                  <button
                    onClick={() => setEditingSemanaId(s.id)}
                    className="text-xs px-3 py-1.5 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" /> Editar
                  </button>
                  <button
                    onClick={() => setConfirmDelete(s)}
                    className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="font-semibold text-lg mb-2">¿Eliminar esta semana?</h3>
            <p className="text-stone-600 text-sm mb-4">
              Vas a eliminar <strong>"{confirmDelete.nombre}"</strong> con todos sus {confirmDelete.pedidos?.length || 0} pedidos y registros de entrega. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-sm border border-stone-200 rounded-lg hover:bg-stone-50">
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await eliminarSemana(confirmDelete.id);
                  setConfirmDelete(null);
                }}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditarSemana({ semana, semanas, saveSemanas, asesoras, showToast, onClose }) {
  const [nombre, setNombre] = useState(semana.nombre);
  const [pedidos, setPedidos] = useState(semana.pedidos || []);
  const [agregando, setAgregando] = useState(false);
  const [nuevoPedido, setNuevoPedido] = useState({ numeroPedido: '', cliente: '', asesora: '' });

  const guardar = async () => {
    if (!nombre.trim()) { showToast('El nombre no puede estar vacío', 'error'); return; }
    const semanaActualizada = { ...semana, nombre: nombre.trim(), pedidos };
    const nuevaLista = semanas.map(s => s.id === semana.id ? semanaActualizada : s);
    await saveSemanas(nuevaLista, semanaActualizada);
    showToast('Cambios guardados');
    onClose();
  };

  const eliminarPedido = (id) => {
    if (!confirm('¿Eliminar este pedido de la semana?')) return;
    setPedidos(pedidos.filter(p => p.id !== id));
  };

  const cambiarAsesora = (id, asesora) => {
    setPedidos(pedidos.map(p => p.id === id ? { ...p, asesora } : p));
  };

  const cambiarCampo = (id, campo, valor) => {
    setPedidos(pedidos.map(p => p.id === id ? { ...p, [campo]: valor } : p));
  };

  const agregarPedido = () => {
    if (!nuevoPedido.numeroPedido || !nuevoPedido.cliente || !nuevoPedido.asesora) {
      showToast('Completa todos los campos', 'error'); return;
    }
    setPedidos([...pedidos, {
      id: Date.now().toString() + Math.random(),
      numeroPedido: nuevoPedido.numeroPedido,
      cliente: nuevoPedido.cliente,
      asesora: nuevoPedido.asesora,
      intento: 1,
      mensajeEnviado: null,
      respondio: null,
      queContesto: '',
      referencias: '',
    }]);
    setNuevoPedido({ numeroPedido: '', cliente: '', asesora: nuevoPedido.asesora });
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-6 border border-stone-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold">Editar semana</h2>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm border border-stone-200 rounded-lg hover:bg-stone-50">
              Cancelar
            </button>
            <button onClick={guardar} className="px-4 py-2 text-sm bg-stone-800 text-white rounded-lg hover:bg-stone-900 flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Guardar cambios
            </button>
          </div>
        </div>

        <label className="block text-sm font-medium text-stone-700 mb-2">Nombre de la semana</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:border-stone-400"
        />
      </div>

      <div className="bg-white rounded-2xl p-6 border border-stone-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Pedidos ({pedidos.length})</h3>
          <button onClick={() => setAgregando(!agregando)} className="text-sm px-3 py-1.5 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> {agregando ? 'Cerrar' : 'Agregar pedido'}
          </button>
        </div>

        {agregando && (
          <div className="bg-stone-50 rounded-xl p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <input type="text" value={nuevoPedido.numeroPedido} onChange={(e) => setNuevoPedido({ ...nuevoPedido, numeroPedido: e.target.value })} placeholder="# Pedido" className="px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white" />
              <input type="text" value={nuevoPedido.cliente} onChange={(e) => setNuevoPedido({ ...nuevoPedido, cliente: e.target.value })} placeholder="Cliente" className="px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white" />
              <select value={nuevoPedido.asesora} onChange={(e) => setNuevoPedido({ ...nuevoPedido, asesora: e.target.value })} className="px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white">
                <option value="">Asesora...</option>
                {asesoras.map(a => <option key={a.id} value={a.nombre}>{a.nombre}</option>)}
              </select>
              <button onClick={agregarPedido} className="bg-stone-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-900">Agregar</button>
            </div>
          </div>
        )}

        {pedidos.length === 0 ? (
          <p className="text-stone-500 text-sm text-center py-8">No hay pedidos en esta semana</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50">
                <tr>
                  <th className="text-left p-3 font-medium"># Pedido</th>
                  <th className="text-left p-3 font-medium">Cliente</th>
                  <th className="text-left p-3 font-medium">Asesora</th>
                  <th className="text-left p-3 font-medium">Estado</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map(p => (
                  <tr key={p.id} className="border-t border-stone-100">
                    <td className="p-3">
                      <input
                        type="text"
                        value={p.numeroPedido}
                        onChange={(e) => cambiarCampo(p.id, 'numeroPedido', e.target.value)}
                        className="px-2 py-1 border border-stone-200 rounded text-sm w-full"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={p.cliente}
                        onChange={(e) => cambiarCampo(p.id, 'cliente', e.target.value)}
                        className="px-2 py-1 border border-stone-200 rounded text-sm w-full"
                      />
                    </td>
                    <td className="p-3">
                      <select value={p.asesora} onChange={(e) => cambiarAsesora(p.id, e.target.value)} className="px-2 py-1 border border-stone-200 rounded text-sm bg-white w-full">
                        <option value="">Sin asignar</option>
                        {asesoras.map(a => <option key={a.id} value={a.nombre}>{a.nombre}</option>)}
                        {!asesoras.find(a => a.nombre === p.asesora) && p.asesora && (<option value={p.asesora}>{p.asesora} (no en catálogo)</option>)}
                      </select>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1 flex-wrap">
                        {p.respondio === 'si' && <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded">Respondió</span>}
                        {p.respondio === 'no' && <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 rounded">Sin resp.</span>}
                        {p.respondio === 'pendiente' && <span className="text-xs px-2 py-0.5 bg-stone-100 text-stone-600 rounded">Pendiente</span>}
                        {!p.respondio && <span className="text-xs px-2 py-0.5 bg-stone-100 text-stone-500 rounded">Sin llenar</span>}
                        {(p.intento || 1) > 1 && <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">Int. {p.intento}/2</span>}
                      </div>
                    </td>
                    <td className="p-3">
                      <button onClick={() => eliminarPedido(p.id)} className="text-stone-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-stone-400 mt-4">
          Tip: para editar las respuestas de las asesoras (qué contestó, referencias), pídeles que vuelvan a entrar como asesora. Aquí puedes ajustar el catálogo de pedidos y a quién están asignados.
        </p>
      </div>
    </div>
  );
}

function AsesoraView({ selectedAsesora, setSelectedAsesora, setView, semanaActiva, semanas, saveSemanas, showToast, loadData }) {
  const [respuestas, setRespuestas] = useState({});

  useEffect(() => {
    if (selectedAsesora && semanaActiva) {
      const misPedidos = semanaActiva.pedidos.filter(p => p.asesora === selectedAsesora);
      const init = {};
      misPedidos.forEach(p => {
        init[p.id] = {
          mensajeEnviado: p.mensajeEnviado, respondio: p.respondio,
          queContesto: p.queContesto || '', referencias: p.referencias || '',
        };
      });
      setRespuestas(init);
    }
  }, [selectedAsesora]);

  if (!semanaActiva) {
    return (
      <div className="max-w-2xl mx-auto p-6 pt-12">
        <button onClick={() => setView('home')} className="flex items-center gap-2 text-stone-500 hover:text-stone-800 text-sm mb-6"><ArrowLeft className="w-4 h-4" /> Inicio</button>
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-200">
          <AlertCircle className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <h3 className="font-medium text-stone-700 mb-2">No hay semana activa</h3>
          <p className="text-stone-500 text-sm">Pídele a logística que cree la semana de seguimiento</p>
        </div>
      </div>
    );
  }

  const asesorasDisponibles = [...new Set(semanaActiva.pedidos.map(p => p.asesora))];

  if (!selectedAsesora) {
    return (
      <div className="max-w-2xl mx-auto p-6 pt-12">
        <button onClick={() => setView('home')} className="flex items-center gap-2 text-stone-500 hover:text-stone-800 text-sm mb-6"><ArrowLeft className="w-4 h-4" /> Inicio</button>
        <h2 className="text-2xl font-semibold mb-2">¿Quién eres?</h2>
        <p className="text-stone-500 mb-6">Selecciona tu nombre para ver tus pedidos de la semana</p>
        <div className="grid gap-2">
          {asesorasDisponibles.length === 0 ? (
            <p className="text-stone-500 text-sm">No hay pedidos asignados aún</p>
          ) : (
            asesorasDisponibles.map(nombre => (
              <button key={nombre} onClick={() => setSelectedAsesora(nombre)}
                className="bg-white rounded-xl p-4 text-left border border-stone-200 hover:border-stone-400 hover:shadow-sm transition flex items-center justify-between">
                <span className="font-medium">{nombre}</span>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  const misPedidos = semanaActiva.pedidos.filter(p => p.asesora === selectedAsesora);
  const yaEntregue = (semanaActiva.entregas || []).some(e => e.asesora === selectedAsesora);

  const updateResp = (pedidoId, field, value) => {
    setRespuestas({ ...respuestas, [pedidoId]: { ...respuestas[pedidoId], [field]: value } });
  };

  const entregar = async () => {
    const sinLlenar = misPedidos.filter(p => respuestas[p.id]?.mensajeEnviado === null || respuestas[p.id]?.mensajeEnviado === undefined);
    if (sinLlenar.length > 0) {
      if (!confirm(`Te faltan ${sinLlenar.length} pedidos por marcar. ¿Quieres entregar de todas formas?`)) return;
    }
    const semanaActualizada = {
      ...semanaActiva,
      pedidos: semanaActiva.pedidos.map(p => {
        if (p.asesora === selectedAsesora && respuestas[p.id]) return { ...p, ...respuestas[p.id] };
        return p;
      }),
      entregas: [
        ...(semanaActiva.entregas || []).filter(e => e.asesora !== selectedAsesora),
        { asesora: selectedAsesora, fecha: new Date().toISOString() }
      ],
    };
    await saveSemanas(semanas.map(s => s.id === semanaActiva.id ? semanaActualizada : s), semanaActualizada);
    showToast('¡Seguimiento entregado!');
    setTimeout(() => { setSelectedAsesora(null); setView('home'); }, 1000);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button onClick={() => setSelectedAsesora(null)} className="flex items-center gap-2 text-stone-500 hover:text-stone-800 text-sm mb-6"><ArrowLeft className="w-4 h-4" /> Cambiar asesora</button>

      <div className="mb-6">
        <div className="text-xs text-stone-500 uppercase tracking-wide mb-1">{semanaActiva.nombre}</div>
        <h2 className="text-2xl font-semibold">Hola, {selectedAsesora}</h2>
        <p className="text-stone-500 text-sm mt-1">Tienes {misPedidos.length} pedidos foráneos para seguimiento</p>
        {yaEntregue && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-sm rounded-lg">
            <Check className="w-4 h-4" /> Ya entregaste tu seguimiento esta semana (puedes editarlo y volver a entregar)
          </div>
        )}
      </div>

      <div className="space-y-4 mb-6">
        {misPedidos.map((p, idx) => {
          const r = respuestas[p.id] || {};
          return (
            <div key={p.id} className="bg-white rounded-2xl p-5 border border-stone-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-xs text-stone-500 mb-0.5">Pedido #{idx + 1} de {misPedidos.length}</div>
                  <div className="font-semibold">{p.cliente}</div>
                  <div className="text-sm text-stone-500"># {p.numeroPedido}</div>
                </div>
                {(p.intento || 1) > 1 && (
                  <span className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded font-medium">Seguimiento {p.intento}/2</span>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">¿Ya le mandaste mensaje?</label>
                  <div className="flex gap-2">
                    <RadioBtn checked={r.mensajeEnviado === 'si'} onClick={() => updateResp(p.id, 'mensajeEnviado', 'si')} label="Sí" />
                    <RadioBtn checked={r.mensajeEnviado === 'no'} onClick={() => updateResp(p.id, 'mensajeEnviado', 'no')} label="No" />
                  </div>
                </div>

                {r.mensajeEnviado === 'si' && (
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">¿Te respondió?</label>
                    <div className="flex gap-2">
                      <RadioBtn checked={r.respondio === 'si'} onClick={() => updateResp(p.id, 'respondio', 'si')} label="Sí" />
                      <RadioBtn checked={r.respondio === 'no'} onClick={() => updateResp(p.id, 'respondio', 'no')} label="No" />
                      <RadioBtn checked={r.respondio === 'pendiente'} onClick={() => updateResp(p.id, 'respondio', 'pendiente')} label="Pendiente" />
                    </div>
                  </div>
                )}

                {r.respondio === 'si' && (
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">¿Qué contestó?</label>
                    <textarea value={r.queContesto || ''} onChange={(e) => updateResp(p.id, 'queContesto', e.target.value)} placeholder="Ej: Le llegó bien, está feliz con la pieza..." rows={2} className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-stone-400" />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Referencias</label>
                  <textarea value={r.referencias || ''} onChange={(e) => updateResp(p.id, 'referencias', e.target.value)} placeholder="Notas, observaciones..." rows={2} className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-stone-400" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={entregar} className="w-full bg-stone-800 text-white py-3.5 rounded-xl font-medium hover:bg-stone-900 flex items-center justify-center gap-2">
        <Check className="w-5 h-5" /> Entregar seguimiento
      </button>
    </div>
  );
}

function RadioBtn({ checked, onClick, label }) {
  return (
    <button onClick={onClick} className={`px-4 py-2 rounded-lg text-sm border transition ${checked ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'}`}>
      {label}
    </button>
  );
}

function generarPDF(semana) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Reporte Semanal - Pedidos Foráneos', 14, 20);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(semana.nombre, 14, 28);
  doc.text(`Generado: ${new Date().toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' })}`, 14, 34);

  const total = semana.pedidos.length;
  const conResp = semana.pedidos.filter(p => p.respondio === 'si').length;
  const sinResp = semana.pedidos.filter(p => p.respondio === 'no').length;
  const pend = semana.pedidos.filter(p => !p.respondio || p.respondio === 'pendiente').length;
  const descartados = semana.pedidos.filter(p => p.respondio === 'no' && (p.intento || 1) >= 2).length;

  doc.setFontSize(10);
  doc.setTextColor(60);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen general', 14, 46);
  doc.setFont('helvetica', 'normal');
  const pct = total > 0 ? Math.round((conResp / total) * 100) : 0;
  doc.text(`Pedidos: ${total} | Con resp: ${conResp} (${pct}%) | Sin resp: ${sinResp} | Pend: ${pend} | Descarte: ${descartados}`, 14, 52);

  let yPos = 62;
  const porAsesora = {};
  semana.pedidos.forEach(p => {
    if (!porAsesora[p.asesora]) porAsesora[p.asesora] = [];
    porAsesora[p.asesora].push(p);
  });

  const entregas = semana.entregas || [];

  Object.keys(porAsesora).sort().forEach(asesora => {
    if (yPos > 250) { doc.addPage(); yPos = 20; }
    const entrega = entregas.find(e => e.asesora === asesora);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text(asesora, 14, yPos);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120);
    const estatus = entrega ? `Entregado: ${new Date(entrega.fecha).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}` : 'Pendiente';
    doc.text(estatus, pageWidth - 14, yPos, { align: 'right' });

    yPos += 4;

    const rows = porAsesora[asesora].map(p => [
      p.numeroPedido, p.cliente,
      p.mensajeEnviado === 'si' ? 'Sí' : p.mensajeEnviado === 'no' ? 'No' : '-',
      p.respondio === 'si' ? 'Sí' : p.respondio === 'no' ? 'No' : p.respondio === 'pendiente' ? 'Pend.' : '-',
      p.queContesto || '-', p.referencias || '-', `${p.intento || 1}/2`,
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['# Pedido', 'Cliente', 'Mensaje', 'Resp.', 'Qué contestó', 'Referencias', 'Intento']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [68, 64, 60], textColor: 255, fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 22 }, 1: { cellWidth: 32 },
        2: { cellWidth: 16, halign: 'center' }, 3: { cellWidth: 16, halign: 'center' },
        4: { cellWidth: 40 }, 5: { cellWidth: 40 }, 6: { cellWidth: 16, halign: 'center' },
      },
      margin: { left: 14, right: 14 },
    });

    yPos = doc.lastAutoTable.finalY + 10;
  });

  doc.save(`Reporte_${semana.nombre.replace(/[^a-z0-9]/gi, '_')}.pdf`);
}
