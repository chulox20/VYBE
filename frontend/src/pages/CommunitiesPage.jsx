import React, { useState, useEffect } from 'react';
import { Plus, Users, Search, Loader2 } from 'lucide-react';
import { api } from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { CommunityCard } from '../components/communities/CommunityCard.jsx';
import { CreateCommunityModal } from '../components/communities/CreateCommunityModal.jsx';
import { Button } from '../components/ui/Button.jsx';

const CATEGORIES = ['Todos', 'Frontend & UI', 'Backend & Cloud', 'Inteligencia Artificial', 'Diseño', 'Tecnología', 'General'];

export function CommunitiesPage() {
  const { user } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'Todos') params.append('category', selectedCategory);
      if (search.trim()) params.append('search', search.trim());

      const res = await api.get(`/communities?${params.toString()}`);
      if (res.success && res.data) {
        setCommunities(res.data);
      }
    } catch (err) {
      console.error('Error loading communities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, [selectedCategory, search]);

  const handleCreated = (newComm) => {
    setCommunities(prev => [newComm, ...prev]);
  };

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4 sm:p-6 gap-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-3xl p-5 shadow-sm sticky top-0 md:top-4 z-20 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Comunidades</h1>
          <p className="text-xs text-slate-500">Únete a grupos con tus mismos intereses y debate con expertos</p>
        </div>

        {user && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="font-bold text-xs"
          >
            Crear Comunidad
          </Button>
        )}
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-purple-50 hover:text-purple-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar comunidad..."
            className="w-full bg-white border border-slate-200 rounded-full pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Communities Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-purple-600">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : communities.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center text-slate-400 text-xs shadow-sm flex flex-col items-center gap-2">
          <Users className="w-8 h-8 text-slate-300 stroke-[1.5]" />
          <span>No se encontraron comunidades en esta categoría.</span>
          {user && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsCreateOpen(true)}
              className="mt-2 text-xs"
            >
              Crea la primera comunidad
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {communities.map((c) => (
            <CommunityCard key={c.id} community={c} />
          ))}
        </div>
      )}

      {/* Create Community Modal */}
      <CreateCommunityModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
