/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { Download, Smartphone } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-bg-surround flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md bg-card-bg rounded-2xl shadow-2xl p-8 border border-white/5 flex flex-col gap-6 items-center">
        <div className="flex gap-4">
          <div className="p-4 bg-white/5 rounded-full border border-white/10">
            <Smartphone className="w-12 h-12 text-text-primary" />
          </div>
          <div className="p-4 bg-white/5 rounded-full border border-white/10">
            <Download className="w-12 h-12 text-text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-text-primary">Flutter Project Ready</h1>
        <p className="text-text-secondary leading-relaxed">
          I've generated the exact Flutter source code for your <strong>Looper Player</strong>. Since this is a web-based preview environment, the native Flutter app cannot be rendered in this window.
        </p>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 w-full text-left">
          <p className="text-sm text-text-secondary font-mono">
            <strong>Next steps to build your APK:</strong><br/><br/>
            1. Open the project settings menu<br/>
            2. Click <strong>Export as ZIP / Download</strong><br/>
            3. Unzip the file locally<br/>
            4. Run <code className="bg-black/50 px-1 py-0.5 rounded">flutter build apk</code>
          </p>
        </div>
      </div>
    </div>
  );
}

