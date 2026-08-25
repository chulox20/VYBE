import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api.js';
import { Modal } from '../ui/Modal.jsx';
import { Input } from '../ui/Input.jsx';
import { Textarea } from '../ui/Textarea.jsx';
import { Button } from '../ui/Button.jsx';
import { Upload } from 'lucide-react';

const CATEGORIES = [
  'Tecnología',
  'Frontend & UI',
  'Backend & Cloud',
  'Inteligencia Artificial',
  'Diseño',
  'Emprendimiento',
  'Móvil',
  'General',
];

export function CreateCommunityModal({ isOpen, onClose, onCreated }) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('Tecnología');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setLoading(true);
      const url = await api.uploadFile(file);
      setImageUrl(url);
    } catch (err) {
      setError('Error al subir imagen: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '');
    setSlug(autoSlug);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/communities', {
        name: name.trim(),
        slug: slug.trim() || undefined,
        category,
        description: description.trim(),
        image_url: imageUrl || undefined,
        cover_url: coverUrl || undefined,
      });

      if (res.success && res.data) {
        onClose();
        if (onCreated) onCreated(res.data);
        navigate(`/communities/${res.data.slug}`);
      }
    } catch (err) {
      setError(err.message || 'Error al crear la comunidad');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crear una Comunidad" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

        <Input
          label="Nombre de la comunidad *"
          value={name}
          onChange={handleNameChange}
          required
          placeholder="Ej: Next.js Masters"
        />

        <Input
          label="Enlace único (Slug)"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="nextjs-masters"
        />

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
            Categoría
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <Textarea
          label="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Describe el propósito y las normas de tu comunidad..."
        />

        {/* Image & Cover URLs */}
        <div className="flex flex-col gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Icono / Logo de la comunidad
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://... URL de imagen"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <label className="cursor-pointer p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" />
                <span>Subir</span>
                <input type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="secondary" size="md" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="md" isLoading={loading} disabled={!name.trim()}>
            Crear Comunidad
          </Button>
        </div>
      </form>
    </Modal>
  );
}
