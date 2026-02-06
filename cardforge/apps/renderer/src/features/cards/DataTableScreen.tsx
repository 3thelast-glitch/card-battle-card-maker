import React, { useState } from 'react';
import { Stage, Layer } from 'react-konva';
import { CardFrame } from '../cards/CardFrame';

// Mock data interface - replace with your actual shared types
interface CardData {
  id: string;
  name: string;
  main_element: string;
  rarity: string;
  traits: string[];
  stats: { attack: number; hp: number };
}

export const DataTableScreen = () => {
  const [hoveredCard, setHoveredCard] = useState<CardData | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Mock data for demonstration
  const cards: CardData[] = [
    { id: '1', name: 'Flame Knight', main_element: 'Fire', rarity: 'Common', traits: ['Sword'], stats: { attack: 5, hp: 10 } },
    { id: '2', name: 'Aqua Mage', main_element: 'Water', rarity: 'Rare', traits: ['Shield'], stats: { attack: 3, hp: 12 } },
    { id: '3', name: 'Golden Dragon', main_element: 'Fire', rarity: 'Legendary', traits: ['Fire', 'Sword'], stats: { attack: 10, hp: 20 } },
    { id: '4', name: 'Forest Spirit', main_element: 'Nature', rarity: 'Rare', traits: ['Nature'], stats: { attack: 4, hp: 15 } },
    { id: '5', name: 'Shadow Assassin', main_element: 'Dark', rarity: 'Legendary', traits: ['Sword', 'Dark'], stats: { attack: 8, hp: 8 } },
  ];

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <h1 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
        Card Database
      </h1>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-gray-800/40 backdrop-blur-md shadow-2xl">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-gray-900/50 text-xs uppercase text-gray-400">
            <tr>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Element</th>
              <th className="px-6 py-4 font-medium">Rarity</th>
              <th className="px-6 py-4 font-medium">Stats</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {cards.map((card) => (
              <tr
                key={card.id}
                className="group hover:bg-white/5 transition-colors cursor-pointer"
                onMouseEnter={() => setHoveredCard(card)}
                onMouseLeave={() => setHoveredCard(null)}
                onMouseMove={handleMouseMove}
              >
                <td className="px-6 py-4 font-medium text-white group-hover:text-blue-300 transition-colors">
                  {card.name}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border
                    ${card.main_element === 'Fire' ? 'bg-red-900/30 text-red-400 border-red-700/30' : 
                      card.main_element === 'Water' ? 'bg-blue-900/30 text-blue-400 border-blue-700/30' : 
                      card.main_element === 'Nature' ? 'bg-green-900/30 text-green-400 border-green-700/30' :
                      'bg-gray-700/50 text-gray-300 border-gray-600'}`}>
                    {card.main_element}
                  </span>
                </td>
                <td className={`px-6 py-4 ${card.rarity === 'Legendary' ? 'text-yellow-400 font-bold' : 'text-gray-400'}`}>
                  {card.rarity}
                </td>
                <td className="px-6 py-4 font-mono text-xs text-gray-500 group-hover:text-gray-300">
                  ATK: {card.stats.attack} | HP: {card.stats.hp}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Quick Preview Tooltip */}
      {hoveredCard && (
        <div
          className="fixed pointer-events-none z-50 drop-shadow-2xl transition-opacity duration-200"
          style={{
            left: mousePos.x + 20,
            top: mousePos.y - 100,
          }}
        >
          <div className="rounded-lg overflow-hidden border-2 border-white/20 bg-gray-900">
            <Stage width={200} height={280}>
              <Layer>
                <CardFrame
                  width={200}
                  height={280}
                  mainElement={hoveredCard.main_element}
                  rarity={hoveredCard.rarity}
                  title={hoveredCard.name}
                  traits={hoveredCard.traits}
                  strokeWidth={2}
                />
              </Layer>
            </Stage>
          </div>
        </div>
      )}
    </div>
  );
};