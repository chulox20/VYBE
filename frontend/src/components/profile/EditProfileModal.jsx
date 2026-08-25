import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { api } from '../../services/api.js';
import { Modal } from '../ui/Modal.jsx';
import { Input } from '../ui/Input.jsx';
import { Textarea } from '../ui/Textarea.jsx';
import { Button } from '../ui/Button.jsx';
import { Upload, Image } from 'lucide-react';

export function EditProfileModal({ isOpen, onClose, profile, onUpdated }) {
  const { updateProfile } = useAuth();
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [location, setLocation] = useState(profile.location || '');
  const [website, setWebsite] = useState(profile.website || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');
  const [coverUrl, setCoverUrl] = useState(profile.cover_url || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAvatarFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setIsLoading(true);
      const url = await api.uploadFile(file);
      setAvatarUrl(url);
    } catch (err) {
      setError('Error al subir avatar: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCoverFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setIsLoading(true);
      const url = await api.uploadFile(file);
      setCoverUrl(url);
    } catch (err) {
      setError('Error al subir portada: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const updated = await updateProfile({
        full_name: fullName.trim(),
        bio: bio.trim(),
        location: location.trim(),
        website: website.trim(),
        avatar_url: avatarUrl,
        cover_url: coverUrl,
      });

      if (onUpdated) {
        onUpdated(updated);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Error al actualizar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Perfil" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}

        <Input
          label="Nombre Completo"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          placeholder="Ej: Jesús Pérez"
        />

        <Textarea
          label="Biografía"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          placeholder="Cuéntale a la comunidad sobre ti, tus intereses o proyectos..."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Ubicación"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Ej: Madrid, España"
          />

          <Input
            label="Sitio Web / Portfolio"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://tudominio.com"
          />
        </div>

        {/* Media Uploads / URLs */}
        <div className="pt-2 border-t border-slate-100 flex flex-col gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Avatar (Imagen de Perfil)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://... URL de imagen"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <label className="cursor-pointer p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" />
                <span>Subir</span>
                <input type="file" accept="image/*" onChange={handleAvatarFile} className="hidden" />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Portada de Perfil (Cover)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://... URL de portada"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <label className="cursor-pointer p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" />
                <span>Subir</span>
                <input type="file" accept="image/*" onChange={handleCoverFile} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="secondary" size="md" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="md" isLoading={isLoading}>
            Guardar Cambios
          </Button>
        </div>
      </form>
    </Modal>
  );
}
