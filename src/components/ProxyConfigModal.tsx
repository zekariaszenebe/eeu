import React, { useState, useEffect } from 'react';
import { Server, Globe, CheckCircle2, AlertCircle, RefreshCw, X, ExternalLink, ShieldCheck, Zap } from 'lucide-react';
import { getApiBaseUrl, setApiProxyUrl, testProxyConnection, isGitHubPagesDeployment } from '../lib/apiService';

interface ProxyConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

export const ProxyConfigModal: React.FC<ProxyConfigModalProps> = ({ isOpen, onClose, isAdmin }) => {
  const [proxyUrl, setProxyUrlState] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; mode?: string } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const isGhPages = isGitHubPagesDeployment();

  useEffect(() => {
    if (isOpen) {
      setProxyUrlState(getApiBaseUrl());
      setTestResult(null);
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testProxyConnection(proxyUrl);
      setTestResult(res);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    setApiProxyUrl(proxyUrl);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
      // Reload page to re-bind all subscribers
      window.location.reload();
    }, 800);
  };

  const handleClear = () => {
    setProxyUrlState('');
    setApiProxyUrl('');
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
      window.location.reload();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800/80 flex items-center justify-between bg-gray-50/70 dark:bg-gray-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-eeu-green/15 text-eeu-green flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Backend Proxy Configuration
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Bypass company firewall &amp; sync GitHub Pages with Supabase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Host status pill */}
          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/70 dark:border-gray-700/60 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Globe className="w-4 h-4 text-sky-500" />
              <span>Current Host: <strong className="font-semibold text-gray-900 dark:text-white">{typeof window !== 'undefined' ? window.location.hostname : 'localhost'}</strong></span>
            </div>
            {isGhPages ? (
              <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold rounded-full text-[11px]">
                GitHub Pages (Static)
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold rounded-full text-[11px]">
                Full-Stack Server
              </span>
            )}
          </div>

          {/* Explanation */}
          <div className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 p-3.5 rounded-2xl flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <p>
              GitHub Pages is static hosting and cannot run a Node server. By connecting a free proxy backend (e.g., Render, Railway, or Cloudflare), your app forwards all database requests through that external server, completely bypassing your company firewall!
            </p>
          </div>

          {/* URL Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center justify-between">
              <span>Backend Proxy URL</span>
              <span className="text-[11px] font-normal text-gray-400">e.g. https://eeu-backend.onrender.com</span>
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={proxyUrl}
                onChange={(e) => setProxyUrlState(e.target.value)}
                placeholder="https://your-service.onrender.com"
                className="flex-1 px-3.5 py-2.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-eeu-green focus:outline-hidden dark:text-white"
              />
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-60"
              >
                {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Test</span>
              </button>
            </div>
          </div>

          {/* Test result display */}
          {testResult && (
            <div className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
              testResult.ok
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            }`}>
              {testResult.ok ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <span className="font-medium">{testResult.message}</span>
            </div>
          )}

          {/* Free Setup Guides */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-3">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
              Free Hosting Setup in 2 Minutes
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200/60 dark:border-gray-700/50">
                <div className="font-semibold text-gray-900 dark:text-white flex items-center justify-between">
                  <span>1. Render.com (100% Free Web Service)</span>
                  <a href="https://dashboard.render.com" target="_blank" rel="noopener noreferrer" className="text-eeu-green hover:underline flex items-center gap-1 text-[11px]">
                    Open Render <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  Go to Render &rarr; New Web Service &rarr; Connect your GitHub repo &rarr; Build: <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">npm install && npm run build</code> &rarr; Start: <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">npm run start</code>. Render will give you a free URL (e.g. <code className="text-eeu-green">https://your-app.onrender.com</code>). Paste that URL above!
                </p>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-200/60 dark:border-gray-700/50">
                <div className="font-semibold text-gray-900 dark:text-white flex items-center justify-between">
                  <span>2. GitHub Actions Secret</span>
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-eeu-green hover:underline flex items-center gap-1 text-[11px]">
                    GitHub Repo <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  In your GitHub repository &rarr; <strong>Settings &rarr; Secrets and variables &rarr; Actions</strong>, add a secret named: <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded">VITE_API_PROXY_URL</code> with your Render URL. Every future GitHub Pages deployment will automatically connect all 50 agent terminals to your proxy!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
          >
            Clear / Same-Origin
          </button>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-eeu-green hover:bg-eeu-green/90 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {savedSuccess ? <CheckCircle2 className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
              <span>{savedSuccess ? 'Saved!' : 'Save & Connect'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
