/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ANDROID_PROJECT_FILES, AndroidFile } from '../androidCode/sourceCode.ts';
import JSZip from 'jszip';
import {
  Code2,
  Download,
  Copy,
  Check,
  FileCode,
  CheckCircle2,
  Clock,
  Layers,
  Terminal,
  Github,
} from 'lucide-react';
import { downloadAndroidZip } from '../utils/zipExporter.ts';

interface AndroidCodeViewerProps {
  onOpenGitHubExport?: () => void;
}

export const AndroidCodeViewer: React.FC<AndroidCodeViewerProps> = ({
  onOpenGitHubExport,
}) => {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const currentFile: AndroidFile = ANDROID_PROJECT_FILES[selectedFileIndex];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      await downloadAndroidZip();
    } catch (err) {
      console.error('Erro ao gerar zip:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alpha Status Report Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">
                Relatório de Status: Versão Alpha 1.0 (Android & Jetpack Compose)
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Conformidade com a arquitetura nativa e separação entre recursos funcionais e próximos passos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
            {onOpenGitHubExport && (
              <button
                onClick={onOpenGitHubExport}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all shadow-md"
              >
                <Github className="w-4 h-4" />
                <span>Exportar para o GitHub</span>
              </button>
            )}

            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
            >
              <Download className="w-4 h-4" />
              <span>{isZipping ? 'Compactando...' : 'Baixar Projeto Android (.zip)'}</span>
            </button>
          </div>
        </div>

        {/* Status Pills Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {/* Functional Features */}
          <div className="bg-slate-950/70 border border-emerald-500/30 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Funcionalidades Implementadas (Alpha 1.0)</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 pl-5 list-disc marker:text-emerald-400">
              <li>
                <strong>Interface em PT-BR:</strong> Layout limpo e moderno em Jetpack Compose Material 3.
              </li>
              <li>
                <strong>4 Estados de Animação:</strong> Configuração individual para boca e olhos.
              </li>
              <li>
                <strong>Importação PNG:</strong> Preservação de transparência alfa e troca de personagens.
              </li>
              <li>
                <strong>Detecção de Voz sem IA Externa:</strong> Cálculo de RMS puro via microfone com limiar e sensibilidade.
              </li>
              <li>
                <strong>Modo Posicionamento:</strong> Arraste e confirmação de coordenadas na tela.
              </li>
              <li>
                <strong>Gravação de Tela & Áudio:</strong> Renderização 60 FPS sincronizada e download de mídia.
              </li>
            </ul>
          </div>

          {/* Roadmap to Next Release */}
          <div className="bg-slate-950/70 border border-amber-500/30 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
              <Clock className="w-4 h-4" />
              <span>Etapas do Próximo Ciclo (Roadmap Nativo)</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 pl-5 list-disc marker:text-amber-400">
              <li>
                <strong>Sobreposição Flutuante Real:</strong> Rodar o <code>FloatingOverlayService</code> nativamente sobre jogos pesados do sistema.
              </li>
              <li>
                <strong>Captura de Áudio Interno:</strong> Ativação de <code>AudioPlaybackCapture</code> para capturar o áudio dos jogos sem eco externo.
              </li>
              <li>
                <strong>Aceleração de Hardware:</strong> Codificação em H.264/HEVC diretamente pelo encoder do chipset móvel.
              </li>
            </ul>
          </div>
        </div>

        {/* 3 Practical Ways to Get the APK / Install on Phone */}
        <div className="pt-2 border-t border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-slate-200">
            Como testar e compilar o APK no seu celular:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1.5">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Opção 1 (Imediata)</span>
              <p className="text-xs font-bold text-white">Instalar via WebAPK / PWA</p>
              <p className="text-[11px] text-slate-400">
                Abra o link do app no Chrome do celular e toque em "Instalar aplicativo". Cria um app independente com ícone e tela cheia sem precisar compilar!
              </p>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1.5">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Opção 2 (Android Studio)</span>
              <p className="text-xs font-bold text-white">Compilar APK no Computador</p>
              <p className="text-[11px] text-slate-400">
                1. Clique em "Baixar Projeto Android (.zip)" acima.<br />
                2. Abra a pasta no Android Studio.<br />
                3. Clique em <code>Build &gt; Build APK(s)</code> e envie o <code>app-debug.apk</code> para o celular.
              </p>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1.5">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Opção 3 (Nuvem Grátis)</span>
              <p className="text-xs font-bold text-white">GitHub Actions Automático</p>
              <p className="text-[11px] text-slate-400">
                O arquivo <code>build-apk.yml</code> já está incluído no zip! Basta subir o projeto em um repositório no GitHub para compilar o APK na nuvem e baixá-lo diretamente nas Actions.
              </p>
            </div>
          </div>

          {/* Quick FAQ regarding sending the ZIP directly */}
          <div className="p-3.5 bg-indigo-950/40 border border-indigo-700/40 rounded-xl flex items-start gap-2.5">
            <span className="text-base leading-none mt-0.5">💡</span>
            <div className="text-xs text-slate-300 space-y-1">
              <p className="font-bold text-indigo-300">
                Dúvida frequente: Posso enviar o arquivo .ZIP direto pelo celular sem descompactar?
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                <strong>Sim, com certeza!</strong> O arquivo <code>.zip</code> é um arquivo único compactado feito exatamente para ser transferido sem dor de cabeça. Você pode enviá-lo direto pelo WhatsApp, Telegram, Google Drive ou e-mail para abrir no computador, ou enviá-lo direto para o GitHub sem precisar descompactar nenhuma pasta no seu celular.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Code Browser */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
        {/* Navigation Tabs for Files */}
        <div className="flex items-center gap-1 p-2 bg-slate-950 border-b border-slate-800 overflow-x-auto">
          {ANDROID_PROJECT_FILES.map((file, idx) => (
            <button
              key={file.path}
              onClick={() => setSelectedFileIndex(idx)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors whitespace-nowrap ${
                selectedFileIndex === idx
                  ? 'bg-slate-800 text-indigo-300 border border-indigo-700/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{file.title}</span>
            </button>
          ))}
        </div>

        {/* File Details Bar */}
        <div className="px-5 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono font-bold text-slate-200">{currentFile.path}</div>
            <div className="text-[11px] text-slate-400">{currentFile.description}</div>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Código</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content Box */}
        <div className="p-4 bg-slate-950 max-h-[520px] overflow-auto font-mono text-xs text-slate-300 leading-relaxed selection:bg-indigo-500/30">
          <pre className="whitespace-pre">
            {currentFile.content}
          </pre>
        </div>
      </div>
    </div>
  );
};
