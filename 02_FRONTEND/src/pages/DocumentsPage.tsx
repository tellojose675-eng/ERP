import React, { useEffect, useState } from 'react';
import { HardDrive, Upload, Download, FileText, CheckCircle2, Shield, Search, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { DocumentItem } from '../types';
import { Modal } from '../components/Modal';

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [entityType, setEntityType] = useState('VENTAS');
  const [entityId, setEntityId] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await api.getDocuments();
      setDocuments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
    const handleDataChanged = () => {
      loadDocuments();
    };
    window.addEventListener('erp:data-changed', handleDataChanged);
    return () => {
      window.removeEventListener('erp:data-changed', handleDataChanged);
    };
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Seleccione un archivo para cargar');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('entity_type', entityType);
    formData.append('entity_id', entityId.toString());

    try {
      await api.uploadDocument(formData);
      setIsUploadOpen(false);
      setSelectedFile(null);
      loadDocuments();
    } catch (err: any) {
      alert(err.message || 'Error al subir documento a S3');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`¿Eliminar el archivo "${name}"? Esta acción no se puede deshacer.`)) return;
    try {
      setDeletingId(id);
      await api.deleteDocument(id);
      loadDocuments();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar el documento');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = documents.filter(d =>
    d.original_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.entity_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Repositorio Cloud Amazon S3</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Almacenamiento elástico de contratos, facturas electrónicas, órdenes y archivos.</p>
        </div>
        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-amber-600/20 transition-colors"
        >
          <Upload className="w-4 h-4" />
          <span>Subir Archivo a S3</span>
        </button>
      </div>

      {/* Cloud Architecture Info Pill */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50 dark:from-amber-950/20 dark:via-slate-900 dark:to-amber-950/20 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-900 dark:text-amber-300">Amazon Simple Storage Service (S3)</span>
            <p className="text-[11px] text-amber-700 dark:text-amber-400/80">
              Separación de metadatos relacionales en PostgreSQL RDS y blob físico en Amazon S3 multi-región.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-white/80 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-700">
          <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Encriptación AES-256 SSE-S3</span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-4 transition-colors">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por nombre de archivo o módulo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-semibold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3.5 px-4">Archivo / Objeto</th>
              <th className="py-3.5 px-4">Módulo Vinculado</th>
              <th className="py-3.5 px-4">Bucket S3</th>
              <th className="py-3.5 px-4">Tamaño</th>
              <th className="py-3.5 px-4">Fecha Subida</th>
              <th className="py-3.5 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  No hay documentos almacenados en este momento.
                </td>
              </tr>
            ) : (
              filtered.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                    <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>{d.original_name}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {d.entity_type} #{d.entity_id}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">{d.s3_bucket || 's3-enterprisecloud'}</td>
                  <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                    {d.file_size ? `${(d.file_size / 1024).toFixed(1)} KB` : 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{new Date(d.created_at).toLocaleString()}</td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <a
                        href={d.file_url || `/api/v1/documents/download/${d.filename}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/60 font-semibold rounded-xl text-[11px] transition-colors border border-sky-200 dark:border-sky-800"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar</span>
                      </a>
                      <button
                        onClick={() => handleDelete(d.id, d.original_name)}
                        disabled={deletingId === d.id}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 font-semibold rounded-xl text-[11px] transition-colors border border-rose-200 dark:border-rose-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Eliminar documento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{deletingId === d.id ? '...' : 'Eliminar'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Subir Archivo Empresarial a Amazon S3"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Módulo Vinculado</label>
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
            >
              <option value="VENTAS">Comprobante de Venta / Factura</option>
              <option value="COMPRAS">Orden de Compra / Guía de Remisión</option>
              <option value="CLIENTES">Expediente de Cliente / RUC</option>
              <option value="PROVEEDORES">Contrato de Proveedor</option>
              <option value="PRODUCTOS">Ficha Técnica de Producto</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">ID de Referencia</label>
            <input
              type="number"
              min="1"
              value={entityId}
              onChange={(e) => setEntityId(Number(e.target.value))}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Seleccionar Archivo (PDF, XML, Imagen, Excel)</label>
            <input
              type="file"
              required
              onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsUploadOpen(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-600/20"
            >
              Transferir a S3
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
