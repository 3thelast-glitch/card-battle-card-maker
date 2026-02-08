import React, { useState } from 'react';
import type { DataRow } from '../../../../../packages/core/src/index';
import { CardPreviewPanel } from '../preview/CardPreviewPanel';
import { DataTableScreen } from '../cards/DataTableScreen';

export const EditorScreen: React.FC = () => {
  const [inspectorData, setInspectorData] = useState<DataRow | null>(null);
  const [showControls, setShowControls] = useState(false);

  return (
    <div className="flex h-screen w-full bg-gray-900 text-white font-sans">
      {/* Main Content Area (Data Table) */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        <DataTableScreen onSelect={setInspectorData} />
      </div>

      {/* Right Sidebar (Inspector) */}
      <div className="w-[350px] border-l border-white/10 bg-gray-800 علاقت flex flex-col shadow-xl z-10">
        <div className="p-4 border-b border-white/10 bg-gray-800/50 backdrop-blur">
          <h2 className="text-lg font-bold text-blue-400">Inspector</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-700">
          {inspectorData ? (
            <CardPreviewPanel
              row={inspectorData}
              defaultTemplate="fantasy-basic"
              showControls={showControls}
              onToggleControls={setShowControls}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 italic border-2 border-dashed border-gray-700 rounded-lg m-4">
              <p>Select a card to inspect</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
