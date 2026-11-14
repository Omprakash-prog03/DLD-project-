import React, { useState, useEffect } from 'react';
import {
  Download,
  X,
  QrCode,
  Smartphone,
  Apple,
  Check,
  Share,
  PlusSquare,
  ArrowDownToLine,
  Copy,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import QRCode from 'qrcode';

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose }) => {
  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
  const isIOS = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isMobile = isAndroid || isIOS;

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'apk' | 'pwa' | 'qr'>(
    isIOS ? 'pwa' : isAndroid ? 'apk' : 'qr'
  );
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Generate QR code for the current URL
    if (typeof window !== 'undefined') {
      const currentUrl = window.location.href;
      QRCode.toDataURL(currentUrl, {
        width: 240,
        margin: 2,
        color: {
          dark: '#111111',
          light: '#FFFFFF',
        },
      }).then(setQrDataUrl).catch(console.error);

      // Listen for PWA beforeinstallprompt
      const handleBeforeInstall = (e: any) => {
        e.preventDefault();
        setInstallPrompt(e);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);
      window.addEventListener('appinstalled', () => {
        setIsInstalled(true);
        setInstallPrompt(null);
      });

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      };
    }
  }, []);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: 'Smart Clock Mobile App',
        text: 'Download and install the Smart Clock mobile companion app for ESP32 + DS3231:',
        url: window.location.href,
      }).catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  const handleInstallPWA = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setInstallPrompt(null);
    } else {
      alert(
        'To install on your phone:\n• Android Chrome: Tap ⋮ menu -> "Add to Home screen" or "Install app".\n• iPhone Safari: Tap Share ⎋ -> "Add to Home Screen" ⊞.'
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#171717] border border-[#2A2A2A] rounded-[32px] w-full max-w-[440px] overflow-hidden shadow-2xl animate-scale-up">
        {/* Header */}
        <div className="p-5 pb-3 flex items-center justify-between border-b border-[#2A2A2A]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#E84B2F] flex items-center justify-center text-white shadow-md">
              <Smartphone size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">Install on Mobile Phone</h3>
              <p className="text-xs text-neutral-400">Download APK, App Bundle, or Install PWA</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#2A2A2A] bg-[#111111] p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('apk')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'apk'
                ? 'bg-[#E84B2F] text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ArrowDownToLine size={14} />
            <span>Download APK</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'qr'
                ? 'bg-[#3B5BDB] text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <QrCode size={14} />
            <span>Scan QR Code</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pwa')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'pwa'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <PlusSquare size={14} />
            <span>Direct Install</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar">
          {/* TAB 1: APK DOWNLOAD */}
          {activeTab === 'apk' && (
            <div className="space-y-3.5">
              <div className="bg-[#1E1E1E] rounded-2xl p-4 border border-[#2A2A2A]">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>Smart Clock Android Package</span>
                      <ShieldCheck size={14} className="text-[#2ECC71]" />
                    </h4>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Signed standalone Android installer package (.apk)
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-[#2ECC71]/20 text-[#2ECC71] rounded-md">
                    v1.0.0
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  <a
                    href="/SmartClock.apk"
                    download="SmartClock.apk"
                    className="w-full py-3.5 px-4 bg-[#E84B2F] hover:bg-[#d03d22] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-[0.99]"
                  >
                    <Download size={18} />
                    <span>Download SmartClock.apk (Release v1.0.0)</span>
                  </a>

                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href="/downloads/smart-clock-debug.apk"
                      download="smart-clock-debug.apk"
                      className="py-2.5 px-3 bg-[#2A2A2A] hover:bg-neutral-700 text-neutral-200 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition text-center"
                    >
                      <Download size={13} />
                      <span>Debug APK (Logs)</span>
                    </a>

                    <a
                      href="/downloads/smart-clock.aab"
                      download="smart-clock.aab"
                      className="py-2.5 px-3 bg-[#2A2A2A] hover:bg-neutral-700 text-neutral-200 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition text-center"
                    >
                      <Download size={13} />
                      <span>Play Bundle (AAB)</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Android Installation Instructions */}
              <div className="bg-[#111111] rounded-2xl p-4 border border-[#2A2A2A] text-xs text-neutral-300 space-y-2">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <Smartphone size={14} className="text-[#E84B2F]" />
                  <span>How to Install APK on Your Phone:</span>
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-neutral-400">
                  <li>Tap <strong>Download Release APK</strong> above on your Android phone.</li>
                  <li>When prompted by Android, tap <strong>&quot;Download anyway&quot;</strong>.</li>
                  <li>Open the downloaded file from notifications or your <strong>Downloads</strong> folder.</li>
                  <li>If prompted, allow <em>&quot;Install unknown apps&quot;</em> for your browser.</li>
                  <li>Tap <strong>Install</strong>. Launch <strong>Smart Clock</strong> from your home screen!</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: QR CODE */}
          {activeTab === 'qr' && (
            <div className="text-center space-y-3.5">
              <p className="text-xs text-neutral-300">
                Point your smartphone camera at this QR code to open and download the app directly on your phone:
              </p>

              {qrDataUrl ? (
                <div className="p-3 bg-white rounded-2xl w-fit mx-auto shadow-lg">
                  <img src={qrDataUrl} alt="Smart Clock Mobile App QR Code" className="w-48 h-48 rounded-lg" />
                </div>
              ) : (
                <div className="w-48 h-48 bg-neutral-800 rounded-2xl mx-auto flex items-center justify-center text-xs text-neutral-500">
                  Generating QR code...
                </div>
              )}

              <div className="flex items-center gap-2 justify-center">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3.5 py-1.5 bg-[#2A2A2A] hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                >
                  {copied ? <Check size={13} className="text-[#2ECC71]" /> : <Copy size={13} />}
                  <span>{copied ? 'Link Copied!' : 'Copy Mobile Link'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="px-3.5 py-1.5 bg-[#3B5BDB] hover:bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                >
                  <Share size={13} />
                  <span>Share with Phone</span>
                </button>
              </div>

              <p className="text-[11px] text-neutral-400 font-mono break-all px-2 bg-[#111111] py-1.5 rounded-lg border border-[#2A2A2A]">
                {typeof window !== 'undefined' ? window.location.href : ''}
              </p>
            </div>
          )}

          {/* TAB 3: PWA / WEB APP */}
          {activeTab === 'pwa' && (
            <div className="space-y-3.5">
              <div className="bg-[#1E1E1E] rounded-2xl p-4 border border-[#2A2A2A] text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#E84B2F] mx-auto flex items-center justify-center text-white shadow-md">
                  <Smartphone size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Progressive Web App (PWA)</h4>
                  <p className="text-xs text-neutral-400 mt-1">
                    Installs instantly on Android & iPhone without downloading files. Works offline, launches fullscreen, and communicates directly with your ESP32 clock.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleInstallPWA}
                  className="w-full py-3.5 px-4 bg-[#3B5BDB] hover:bg-blue-600 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-[0.99]"
                >
                  <PlusSquare size={16} />
                  <span>{isInstalled ? 'App Already Installed!' : 'Add to Home Screen / Install'}</span>
                </button>
              </div>

              {/* iOS & Android Guide */}
              <div className="space-y-2 text-xs">
                <div className="bg-[#111111] rounded-xl p-3 border border-[#2A2A2A]">
                  <p className="font-bold text-white flex items-center gap-1.5 mb-1">
                    <Apple size={14} className="text-white" />
                    <span>On iPhone (Safari):</span>
                  </p>
                  <p className="text-neutral-400">
                    Tap the <strong>Share</strong> button <Share size={11} className="inline mx-0.5 text-blue-400" /> at the bottom bar, then scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong> <PlusSquare size={11} className="inline mx-0.5" />.
                  </p>
                </div>

                <div className="bg-[#111111] rounded-xl p-3 border border-[#2A2A2A]">
                  <p className="font-bold text-white flex items-center gap-1.5 mb-1">
                    <Smartphone size={14} className="text-[#2ECC71]" />
                    <span>On Android (Chrome / Edge):</span>
                  </p>
                  <p className="text-neutral-400">
                    Tap the <strong>three dots menu ⋮</strong> at top-right, then tap <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
