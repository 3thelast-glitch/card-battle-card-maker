import React, { useState, useCallback, memo } from "react";
import { HexColorPicker } from "react-colorful";
import { Palette, Border, Shadow, Type, Rotate } from "lucide-react";

interface BadgeModel {
  id: string;
  text?: string;
  color: string;
  textColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  shadowBlur: number;
  shadowColor: string;
  scale: number;
  rotation: number;
  opacity: number;
}

interface BadgeStylingPanelProps {
  badge: BadgeModel;
  onChange: (updates: Partial<BadgeModel>) => void;
}

type TabType = "color" | "border" | "shadow" | "text" | "transform";

export const BadgeStylingPanel = memo<BadgeStylingPanelProps>(({ badge, onChange }) => {
  const [activeTab, setActiveTab] = useState<TabType>("color");

  const handleChange = useCallback((key: keyof BadgeModel, value: BadgeModel[keyof BadgeModel]) => {
    console.log("BADGE UPDATE", key, value);
    onChange({ [key]: value });
  }, [onChange]);

  const tabs = [
    { id: "color" as TabType, label: "Color", icon: <Palette size={18} /> },
    { id: "border" as TabType, label: "Border", icon: <Border size={18} /> },
    { id: "shadow" as TabType, label: "Shadow", icon: <Shadow size={18} /> },
    { id: "text" as TabType, label: "Text", icon: <Type size={18} /> },
    { id: "transform" as TabType, label: "Transform", icon: <Rotate size={18} /> }
  ];

  return (
    <div className="bg-gray-100 rounded-lg p-4 md:p-6">
      <div className="mb-6">
        <div className="flex justify-center mb-2">
          <div 
            className="inline-flex items-center justify-center px-4 py-2 font-medium"
            style={{
              backgroundColor: badge.color,
              color: badge.textColor,
              borderColor: badge.borderColor,
              borderWidth: `${badge.borderWidth}px`,
              borderRadius: `${badge.borderRadius}px`,
              boxShadow: badge.shadowBlur > 0 
                ? `0 4px ${badge.shadowBlur}px ${badge.shadowColor}` 
                : "none",
              transform: `scale(${badge.scale}) rotate(${badge.rotation}deg)`,
              opacity: badge.opacity
            }}
          >
            {badge.text || "BADGE"}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === tab.id 
                ? "bg-indigo-600 text-white" 
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg p-4 shadow-sm">
        {activeTab === "color" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
            <HexColorPicker 
              color={badge.color} 
              onChange={(color) => handleChange("color", color)} 
            />
            <label className="block text-sm font-medium text-gray-700 mt-4 mb-2">Text Color</label>
            <input
              type="color"
              value={badge.textColor}
              onChange={(e) => handleChange("textColor", e.target.value)}
              className="w-full h-10 rounded cursor-pointer border-0 p-0"
            />
          </div>
        )}
        {activeTab === "border" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Border Width</label>
            <input
              type="range"
              min={0}
              max={8}
              value={badge.borderWidth}
              onChange={(e) => handleChange("borderWidth", Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <label className="block text-sm font-medium text-gray-700 mt-4 mb-2">Border Radius</label>
            <input
              type="range"
              min={0}
              max={24}
              value={badge.borderRadius}
              onChange={(e) => handleChange("borderRadius", Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <label className="block text-sm font-medium text-gray-700 mt-4 mb-2">Border Color</label>
            <input
              type="color"
              value={badge.borderColor}
              onChange={(e) => handleChange("borderColor", e.target.value)}
              className="w-full h-10 rounded cursor-pointer border-0 p-0"
            />
          </div>
        )}
        {activeTab === "shadow" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Shadow Blur</label>
            <input
              type="range"
              min={0}
              max={30}
              value={badge.shadowBlur}
              onChange={(e) => handleChange("shadowBlur", Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <label className="block text-sm font-medium text-gray-700 mt-4 mb-2">Shadow Color</label>
            <input
              type="color"
              value={badge.shadowColor}
              onChange={(e) => handleChange("shadowColor", e.target.value)}
              className="w-full h-10 rounded cursor-pointer border-0 p-0"
            />
          </div>
        )}
        {activeTab === "text" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Badge Text</label>
            <input
              type="text"
              value={badge.text || ""}
              onChange={(e) => handleChange("text", e.target.value)}
              placeholder="Enter badge text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}
        {activeTab === "transform" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Scale</label>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={badge.scale}
              onChange={(e) => handleChange("scale", Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <label className="block text-sm font-medium text-gray-700 mt-4 mb-2">Rotation</label>
            <input
              type="range"
              min={0}
              max={360}
              value={badge.rotation}
              onChange={(e) => handleChange("rotation", Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <label className="block text-sm font-medium text-gray-700 mt-4 mb-2">Opacity</label>
            <input
              type="range"
              min={0.2}
              max={1}
              step={0.1}
              value={badge.opacity}
              onChange={(e) => handleChange("opacity", Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        )}
      </div>
    </div>
  );
});
