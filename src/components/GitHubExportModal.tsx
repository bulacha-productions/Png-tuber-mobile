/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Github,
  X,
  ExternalLink,
  Copy,
  Check,
  Download,
  AlertCircle,
  CheckCircle2,
  Terminal,
  Play,
  KeyRound,
  Sparkles,
} from 'lucide-react';

interface GitHubExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadZip: () => void;
}

export const GitHubExportModal: React.FC<GitHubExportModalProps> = ({
  isOpen,
  onClose,
  onDownloadZip,
}) => {
  const [repoUrl, setRepoUrl] = useState('https://github.com/bulacha-productions/Png-tuber-mobile.git');
  const [token, setToken] = useState('');
  const [isPushing, setIsPushing] = useState(false);
  const [pushStatus, setPushStatus] = useState<{
    success?: boolean;
    message?: string;
    output?: string;
  } | null>(null);
  const [copiedCmd, setCopiedCmd] = useState(false);

  if (!isOpen) return null;

  const handlePush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setIsPushing(true);
    setPushStatus(null);

    try {
      const response = await fetch('/api/github-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl: repoUrl.trim(),
          token: token.trim(),
          branch: 'main',
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPushStatus({
          success: true,
          message:
            'Código exportado com sucesso para o seu GitHub! O GitHub Actions já iniciou a compilação do seu APK na nuvem.',
          output: data.output,
        });
      } else {
        setPushStatus({
          success: false,
          message: data.error || 'Erro ao exportar para o GitHub. Verifique a URL e o token de acesso.',
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setPushStatus({
        success: false,
        message: `Falha na requisição: ${msg}`,
      });
    } finally {
      setIsPushing(false);
    }
  };

  const gitCliCommands = `git remote add origin ${repoUrl.trim() || 'https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git'}\ngit push -u origin main`;

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(gitCliCommands);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-white">
              <Github className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Exportar para o GitHub</h3>
              <p className="text-[11px] text-slate-400">
                Com Workflow do GitHub Actions configurado para gerar o APK
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          {/* Status Message */}
          {pushStatus && (
            <div
              className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start gap-3 ${
                pushStatus.success
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
              }`}
            >
              {pushStatus.success ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
              )}
              <div className="space-y-1">
                <p className="font-bold">{pushStatus.message}</p>
                {pushStatus.success && (
                  <p className="text-[11px] text-emerald-400/80">
                    Acesse a aba <strong>Actions</strong> no seu repositório do GitHub para acompanhar a compilação do APK.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Form: Direct Automatic Push */}
          <form onSubmit={handlePush} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Exportação Direta em 1 Clique</span>
              </span>
              <a
                href="https://github.com/new"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <span>Criar novo repositório</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300">
                URL do Repositório GitHub
              </label>
              <input
                type="url"
                required
                placeholder="https://github.com/SEU_USUARIO/pngtuber-recorder.git"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 text-xs text-slate-200 px-3 py-2.5 rounded-xl outline-none font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                  <KeyRound className="w-3 h-3 text-slate-400" />
                  <span>GitHub Personal Access Token (PAT)</span>
                </label>
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo&description=PNGTuber-Recorder-APK-Export"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-indigo-400 hover:underline flex items-center gap-0.5"
                >
                  <span>Gerar token no GitHub</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <input
                type="password"
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx (necessário para autenticação de push)"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 text-xs text-slate-200 px-3 py-2.5 rounded-xl outline-none font-mono"
              />
              <p className="text-[10px] text-slate-500">
                Seu token é usado apenas para autenticar a conexão com o GitHub e não é salvo.
              </p>
            </div>

            <button
              type="submit"
              disabled={isPushing || !repoUrl.trim()}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isPushing ? 'Enviando para o GitHub...' : 'Exportar Código & Ativar Workflow de APK'}</span>
            </button>
          </form>

          {/* Alternative 2: Terminal Command */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Ou envie manualmente pelo seu Terminal:</span>
            </h4>
            <div className="relative bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300">
              <pre className="whitespace-pre overflow-x-auto">{gitCliCommands}</pre>
              <button
                type="button"
                onClick={handleCopyCmd}
                className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors"
              >
                {copiedCmd ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Alternative 3: Download ZIP with Workflow */}
          <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-white">Preferir subir pelo site do GitHub?</p>
              <p className="text-[11px] text-slate-400">
                O arquivo .ZIP já inclui <code>.github/workflows/build-apk.yml</code> e a pasta <code>android/</code>.
              </p>
            </div>
            <button
              type="button"
              onClick={onDownloadZip}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar .ZIP</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
