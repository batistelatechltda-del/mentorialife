"use client";

import { useState } from "react";
import { Settings, Languages, Mic } from "lucide-react";
import { supportedLanguages, type SpeechConfig } from "@/lib/speech-utils";

interface SpeechSettingsProps {
  config: SpeechConfig;
  onConfigChange: (config: SpeechConfig) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function SpeechSettings({
  config,
  onConfigChange,
  isOpen,
  onClose,
}: SpeechSettingsProps) {
  const [localConfig, setLocalConfig] = useState<SpeechConfig>(config);

  const handleSave = () => {
    onConfigChange(localConfig);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Speech Settings</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              <Languages className="h-4 w-4 inline mr-1" />
              Language
            </label>
            <select
              value={localConfig.language}
              onChange={(e) =>
                setLocalConfig({ ...localConfig, language: e.target.value })
              }
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {supportedLanguages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              <Mic className="h-4 w-4 inline mr-1" />
              Recognition Model
            </label>
            <select
              value={localConfig.model}
              onChange={(e) =>
                setLocalConfig({
                  ...localConfig,
                  model: e.target.value as SpeechConfig["model"],
                })
              }
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="default">Default</option>
              <option value="latest_long">
                Latest Long (Better for longer audio)
              </option>
              <option value="latest_short">
                Latest Short (Better for short commands)
              </option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              Enable Automatic Punctuation
            </label>
            <input
              type="checkbox"
              checked={localConfig.enablePunctuation}
              onChange={(e) =>
                setLocalConfig({
                  ...localConfig,
                  enablePunctuation: e.target.checked,
                })
              }
              className="rounded border-gray-300 dark:border-gray-600"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={handleSave}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
          >
            Save Settings
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-md font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
