'use client';

import { useState } from 'react';
import { Dice1, Shuffle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DICE_TYPES = [4, 6, 8, 10, 12, 20] as const;
type DiceType = typeof DICE_TYPES[number];

interface DiceRoll {
  type: DiceType;
  value: number;
  id: string;
}

// 3D Dice SVG components - realistic polyhedral dice
const DiceShape = ({ type, size = 48 }: { type: DiceType; size?: number }) => {
  const id = `dice-${type}-${Math.random().toString(36).substr(2, 9)}`;
  
  switch (type) {
    case 4: // Tetrahedron - 3D pyramid
      return (
        <svg width={size} height={size} viewBox="0 0 48 48">
          <defs>
            <linearGradient id={`${id}-face1`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B0000" />
              <stop offset="100%" stopColor="#5c0000" />
            </linearGradient>
            <linearGradient id={`${id}-face2`} x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#a00000" />
              <stop offset="100%" stopColor="#6b0000" />
            </linearGradient>
            <linearGradient id={`${id}-face3`} x1="50%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#4a0000" />
              <stop offset="100%" stopColor="#3a0000" />
            </linearGradient>
          </defs>
          {/* Left face */}
          <polygon points="24,6 8,40 24,32" fill={`url(#${id}-face1)`} />
          {/* Right face */}
          <polygon points="24,6 40,40 24,32" fill={`url(#${id}-face2)`} />
          {/* Bottom face */}
          <polygon points="8,40 40,40 24,32" fill={`url(#${id}-face3)`} />
          {/* Edges */}
          <polygon points="24,6 8,40 40,40" fill="none" stroke="#ff6b6b" strokeWidth="1" strokeLinejoin="round" />
          <line x1="24" y1="6" x2="24" y2="32" stroke="#ff6b6b" strokeWidth="0.75" opacity="0.6" />
          <line x1="8" y1="40" x2="24" y2="32" stroke="#ff6b6b" strokeWidth="0.75" opacity="0.6" />
          <line x1="40" y1="40" x2="24" y2="32" stroke="#ff6b6b" strokeWidth="0.75" opacity="0.6" />
          <text x="24" y="28" textAnchor="middle" fill="#ffd700" fontSize="10" fontWeight="bold">d4</text>
        </svg>
      );
    
    case 6: // Cube - 3D isometric view
      return (
        <svg width={size} height={size} viewBox="0 0 48 48">
          <defs>
            <linearGradient id={`${id}-top`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f0f0f0" />
              <stop offset="100%" stopColor="#d0d0d0" />
            </linearGradient>
            <linearGradient id={`${id}-left`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#909090" />
              <stop offset="100%" stopColor="#b0b0b0" />
            </linearGradient>
            <linearGradient id={`${id}-right`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#c8c8c8" />
              <stop offset="100%" stopColor="#a8a8a8" />
            </linearGradient>
          </defs>
          {/* Top face */}
          <polygon points="24,6 40,14 24,22 8,14" fill={`url(#${id}-top)`} stroke="#666" strokeWidth="0.75" />
          {/* Left face */}
          <polygon points="8,14 24,22 24,40 8,32" fill={`url(#${id}-left)`} stroke="#666" strokeWidth="0.75" />
          {/* Right face */}
          <polygon points="24,22 40,14 40,32 24,40" fill={`url(#${id}-right)`} stroke="#666" strokeWidth="0.75" />
          {/* Pips on top - showing 6 */}
          <circle cx="16" cy="12" r="1.5" fill="#222" />
          <circle cx="24" cy="12" r="1.5" fill="#222" />
          <circle cx="32" cy="12" r="1.5" fill="#222" />
          <circle cx="16" cy="17" r="1.5" fill="#222" />
          <circle cx="24" cy="17" r="1.5" fill="#222" />
          <circle cx="32" cy="17" r="1.5" fill="#222" />
        </svg>
      );
    
    case 8: // Octahedron - 3D diamond
      return (
        <svg width={size} height={size} viewBox="0 0 48 48">
          <defs>
            <linearGradient id={`${id}-top-left`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e90ff" />
              <stop offset="100%" stopColor="#1070d0" />
            </linearGradient>
            <linearGradient id={`${id}-top-right`} x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4aa8ff" />
              <stop offset="100%" stopColor="#2080e0" />
            </linearGradient>
            <linearGradient id={`${id}-bot-left`} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0a4080" />
              <stop offset="100%" stopColor="#0d5090" />
            </linearGradient>
            <linearGradient id={`${id}-bot-right`} x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#0d5090" />
              <stop offset="100%" stopColor="#1060a0" />
            </linearGradient>
          </defs>
          {/* Top-left face */}
          <polygon points="24,4 6,24 24,28" fill={`url(#${id}-top-left)`} />
          {/* Top-right face */}
          <polygon points="24,4 42,24 24,28" fill={`url(#${id}-top-right)`} />
          {/* Bottom-left face */}
          <polygon points="6,24 24,44 24,28" fill={`url(#${id}-bot-left)`} />
          {/* Bottom-right face */}
          <polygon points="42,24 24,44 24,28" fill={`url(#${id}-bot-right)`} />
          {/* Edges */}
          <polygon points="24,4 42,24 24,44 6,24" fill="none" stroke="#87ceeb" strokeWidth="1" strokeLinejoin="round" />
          <line x1="24" y1="4" x2="24" y2="44" stroke="#87ceeb" strokeWidth="0.5" opacity="0.5" />
          <line x1="6" y1="24" x2="42" y2="24" stroke="#87ceeb" strokeWidth="0.5" opacity="0.5" />
          <text x="24" y="28" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">d8</text>
        </svg>
      );
    
    case 10: // Pentagonal trapezohedron - kite shapes
      return (
        <svg width={size} height={size} viewBox="0 0 48 48">
          <defs>
            <linearGradient id={`${id}-f1`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#228b22" />
              <stop offset="100%" stopColor="#1a6b1a" />
            </linearGradient>
            <linearGradient id={`${id}-f2`} x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#32a532" />
              <stop offset="100%" stopColor="#1e7b1e" />
            </linearGradient>
            <linearGradient id={`${id}-f3`} x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#145014" />
              <stop offset="100%" stopColor="#0d3d0d" />
            </linearGradient>
          </defs>
          {/* Kite-shaped faces */}
          <polygon points="24,3 14,18 24,26" fill={`url(#${id}-f1)`} />
          <polygon points="24,3 34,18 24,26" fill={`url(#${id}-f2)`} />
          <polygon points="14,18 8,32 24,26" fill={`url(#${id}-f1)`} />
          <polygon points="34,18 40,32 24,26" fill={`url(#${id}-f2)`} />
          <polygon points="8,32 24,45 24,26" fill={`url(#${id}-f3)`} />
          <polygon points="40,32 24,45 24,26" fill={`url(#${id}-f3)`} />
          {/* Edges */}
          <path d="M24,3 L14,18 L8,32 L24,45 L40,32 L34,18 Z" fill="none" stroke="#90ee90" strokeWidth="0.75" />
          <line x1="24" y1="3" x2="24" y2="45" stroke="#90ee90" strokeWidth="0.5" opacity="0.4" />
          <line x1="14" y1="18" x2="24" y2="26" stroke="#90ee90" strokeWidth="0.5" opacity="0.4" />
          <line x1="34" y1="18" x2="24" y2="26" stroke="#90ee90" strokeWidth="0.5" opacity="0.4" />
          <line x1="8" y1="32" x2="24" y2="26" stroke="#90ee90" strokeWidth="0.5" opacity="0.4" />
          <line x1="40" y1="32" x2="24" y2="26" stroke="#90ee90" strokeWidth="0.5" opacity="0.4" />
          <text x="24" y="30" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">d10</text>
        </svg>
      );
    
    case 12: // Dodecahedron - pentagon faces
      return (
        <svg width={size} height={size} viewBox="0 0 48 48">
          <defs>
            <linearGradient id={`${id}-p1`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9932cc" />
              <stop offset="100%" stopColor="#7b28a8" />
            </linearGradient>
            <linearGradient id={`${id}-p2`} x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#a040d8" />
              <stop offset="100%" stopColor="#8030b0" />
            </linearGradient>
            <linearGradient id={`${id}-p3`} x1="50%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#5a1a7a" />
              <stop offset="100%" stopColor="#6b2090" />
            </linearGradient>
          </defs>
          {/* Main pentagon face */}
          <polygon points="24,6 38,16 34,34 14,34 10,16" fill={`url(#${id}-p1)`} stroke="#da70d6" strokeWidth="0.75" />
          {/* Side faces (partial) */}
          <polygon points="24,6 10,16 4,10 16,2" fill={`url(#${id}-p2)`} stroke="#da70d6" strokeWidth="0.5" />
          <polygon points="24,6 38,16 44,10 32,2" fill={`url(#${id}-p2)`} stroke="#da70d6" strokeWidth="0.5" />
          <polygon points="10,16 14,34 4,36 2,22" fill={`url(#${id}-p3)`} stroke="#da70d6" strokeWidth="0.5" />
          <polygon points="38,16 34,34 44,36 46,22" fill={`url(#${id}-p3)`} stroke="#da70d6" strokeWidth="0.5" />
          <polygon points="14,34 34,34 32,44 16,44" fill={`url(#${id}-p3)`} stroke="#da70d6" strokeWidth="0.5" />
          <text x="24" y="24" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">d12</text>
        </svg>
      );
    
    case 20: // Icosahedron - triangular faces
      return (
        <svg width={size} height={size} viewBox="0 0 48 48">
          <defs>
            <linearGradient id={`${id}-t1`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffd700" />
              <stop offset="100%" stopColor="#daa520" />
            </linearGradient>
            <linearGradient id={`${id}-t2`} x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffdf40" />
              <stop offset="100%" stopColor="#e0b000" />
            </linearGradient>
            <linearGradient id={`${id}-t3`} x1="50%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#b8860b" />
              <stop offset="100%" stopColor="#cd9b1d" />
            </linearGradient>
            <linearGradient id={`${id}-t4`} x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#8b6914" />
              <stop offset="100%" stopColor="#a07818" />
            </linearGradient>
          </defs>
          {/* Top triangular faces */}
          <polygon points="24,4 16,16 32,16" fill={`url(#${id}-t1)`} />
          <polygon points="16,16 8,10 24,4" fill={`url(#${id}-t2)`} />
          <polygon points="32,16 40,10 24,4" fill={`url(#${id}-t2)`} />
          {/* Middle band */}
          <polygon points="16,16 8,28 14,34" fill={`url(#${id}-t3)`} />
          <polygon points="16,16 14,34 24,26" fill={`url(#${id}-t1)`} />
          <polygon points="16,16 32,16 24,26" fill={`url(#${id}-t1)`} />
          <polygon points="32,16 24,26 34,34" fill={`url(#${id}-t1)`} />
          <polygon points="32,16 34,34 40,28" fill={`url(#${id}-t3)`} />
          {/* Bottom faces */}
          <polygon points="14,34 24,44 24,26" fill={`url(#${id}-t4)`} />
          <polygon points="34,34 24,44 24,26" fill={`url(#${id}-t4)`} />
          {/* Edges */}
          <polygon points="24,4 8,10 8,28 24,44 40,28 40,10" fill="none" stroke="#ffe066" strokeWidth="0.75" />
          <line x1="16" y1="16" x2="32" y2="16" stroke="#ffe066" strokeWidth="0.5" opacity="0.5" />
          <line x1="14" y1="34" x2="34" y2="34" stroke="#ffe066" strokeWidth="0.5" opacity="0.5" />
          <line x1="24" y1="4" x2="24" y2="26" stroke="#ffe066" strokeWidth="0.5" opacity="0.3" />
          <line x1="24" y1="26" x2="24" y2="44" stroke="#ffe066" strokeWidth="0.5" opacity="0.3" />
          <text x="24" y="28" textAnchor="middle" fill="#4a3000" fontSize="8" fontWeight="bold">d20</text>
        </svg>
      );
    
    default:
      return null;
  }
};

// Larger 3D dice for active dice display with values
const ActiveDiceShape = ({ type, value, isRolling }: { type: DiceType; value: number; isRolling: boolean }) => {
  const id = `active-${type}-${value}-${Math.random().toString(36).substr(2, 9)}`;
  const pulseClass = isRolling ? 'animate-pulse' : '';
  
  switch (type) {
    case 4: // Tetrahedron - 3D pyramid with value
      return (
        <svg width={72} height={72} viewBox="0 0 72 72" className={pulseClass}>
          <defs>
            <linearGradient id={`${id}-face1`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#dc143c" />
              <stop offset="100%" stopColor="#8b0000" />
            </linearGradient>
            <linearGradient id={`${id}-face2`} x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ff4444" />
              <stop offset="100%" stopColor="#a00000" />
            </linearGradient>
            <linearGradient id={`${id}-face3`} x1="50%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#600000" />
              <stop offset="100%" stopColor="#500000" />
            </linearGradient>
            <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="2" dy="3" stdDeviation="3" floodOpacity="0.4" />
            </filter>
          </defs>
          <g filter={`url(#${id}-shadow)`}>
            {/* Left face */}
            <polygon points="36,8 12,60 36,48" fill={`url(#${id}-face1)`} />
            {/* Right face */}
            <polygon points="36,8 60,60 36,48" fill={`url(#${id}-face2)`} />
            {/* Bottom face */}
            <polygon points="12,60 60,60 36,48" fill={`url(#${id}-face3)`} />
            {/* Edges */}
            <polygon points="36,8 12,60 60,60" fill="none" stroke="#ff9999" strokeWidth="1.5" strokeLinejoin="round" />
            <line x1="36" y1="8" x2="36" y2="48" stroke="#ff9999" strokeWidth="1" opacity="0.7" />
            <line x1="12" y1="60" x2="36" y2="48" stroke="#ff9999" strokeWidth="1" opacity="0.7" />
            <line x1="60" y1="60" x2="36" y2="48" stroke="#ff9999" strokeWidth="1" opacity="0.7" />
          </g>
          <text x="36" y="42" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="bold" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>{value}</text>
        </svg>
      );
    
    case 6: // Cube - 3D isometric with value on top
      return (
        <svg width={72} height={72} viewBox="0 0 72 72" className={pulseClass}>
          <defs>
            <linearGradient id={`${id}-top`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e8e8e8" />
            </linearGradient>
            <linearGradient id={`${id}-left`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a0a0a0" />
              <stop offset="100%" stopColor="#c0c0c0" />
            </linearGradient>
            <linearGradient id={`${id}-right`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#d8d8d8" />
              <stop offset="100%" stopColor="#b8b8b8" />
            </linearGradient>
            <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="2" dy="3" stdDeviation="3" floodOpacity="0.4" />
            </filter>
          </defs>
          <g filter={`url(#${id}-shadow)`}>
            {/* Top face */}
            <polygon points="36,8 60,20 36,32 12,20" fill={`url(#${id}-top)`} stroke="#888" strokeWidth="1" />
            {/* Left face */}
            <polygon points="12,20 36,32 36,56 12,44" fill={`url(#${id}-left)`} stroke="#888" strokeWidth="1" />
            {/* Right face */}
            <polygon points="36,32 60,20 60,44 36,56" fill={`url(#${id}-right)`} stroke="#888" strokeWidth="1" />
          </g>
          {/* Show pips or number based on value */}
          {value <= 6 ? (
            <g>
              {/* Pip positions for d6 */}
              {(value === 1 || value === 3 || value === 5) && <circle cx="36" cy="20" r="3" fill="#111" />}
              {(value >= 2) && <circle cx="28" cy="16" r="2.5" fill="#111" />}
              {(value >= 2) && <circle cx="44" cy="24" r="2.5" fill="#111" />}
              {(value >= 4) && <circle cx="44" cy="16" r="2.5" fill="#111" />}
              {(value >= 4) && <circle cx="28" cy="24" r="2.5" fill="#111" />}
              {(value === 6) && <circle cx="28" cy="20" r="2.5" fill="#111" />}
              {(value === 6) && <circle cx="44" cy="20" r="2.5" fill="#111" />}
            </g>
          ) : (
            <text x="36" y="24" textAnchor="middle" fill="#111" fontSize="14" fontWeight="bold">{value}</text>
          )}
        </svg>
      );
    
    case 8: // Octahedron - 3D diamond with value
      return (
        <svg width={72} height={72} viewBox="0 0 72 72" className={pulseClass}>
          <defs>
            <linearGradient id={`${id}-top-left`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4da6ff" />
              <stop offset="100%" stopColor="#2080d0" />
            </linearGradient>
            <linearGradient id={`${id}-top-right`} x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#70c0ff" />
              <stop offset="100%" stopColor="#3090e0" />
            </linearGradient>
            <linearGradient id={`${id}-bot-left`} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0a5090" />
              <stop offset="100%" stopColor="#1060a0" />
            </linearGradient>
            <linearGradient id={`${id}-bot-right`} x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#1060a0" />
              <stop offset="100%" stopColor="#1570b0" />
            </linearGradient>
            <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="2" dy="3" stdDeviation="3" floodOpacity="0.4" />
            </filter>
          </defs>
          <g filter={`url(#${id}-shadow)`}>
            {/* Top-left face */}
            <polygon points="36,6 8,36 36,42" fill={`url(#${id}-top-left)`} />
            {/* Top-right face */}
            <polygon points="36,6 64,36 36,42" fill={`url(#${id}-top-right)`} />
            {/* Bottom-left face */}
            <polygon points="8,36 36,66 36,42" fill={`url(#${id}-bot-left)`} />
            {/* Bottom-right face */}
            <polygon points="64,36 36,66 36,42" fill={`url(#${id}-bot-right)`} />
            {/* Edges */}
            <polygon points="36,6 64,36 36,66 8,36" fill="none" stroke="#a0d8ff" strokeWidth="1.5" strokeLinejoin="round" />
            <line x1="36" y1="6" x2="36" y2="66" stroke="#a0d8ff" strokeWidth="0.75" opacity="0.6" />
            <line x1="8" y1="36" x2="64" y2="36" stroke="#a0d8ff" strokeWidth="0.75" opacity="0.6" />
          </g>
          <text x="36" y="40" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="bold" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>{value}</text>
        </svg>
      );
    
    case 10: // Pentagonal trapezohedron with value
      return (
        <svg width={72} height={72} viewBox="0 0 72 72" className={pulseClass}>
          <defs>
            <linearGradient id={`${id}-f1`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#32cd32" />
              <stop offset="100%" stopColor="#228b22" />
            </linearGradient>
            <linearGradient id={`${id}-f2`} x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#50e050" />
              <stop offset="100%" stopColor="#2a9b2a" />
            </linearGradient>
            <linearGradient id={`${id}-f3`} x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#1a6b1a" />
              <stop offset="100%" stopColor="#145014" />
            </linearGradient>
            <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="2" dy="3" stdDeviation="3" floodOpacity="0.4" />
            </filter>
          </defs>
          <g filter={`url(#${id}-shadow)`}>
            {/* Kite-shaped faces */}
            <polygon points="36,4 20,24 36,38" fill={`url(#${id}-f1)`} />
            <polygon points="36,4 52,24 36,38" fill={`url(#${id}-f2)`} />
            <polygon points="20,24 10,46 36,38" fill={`url(#${id}-f1)`} />
            <polygon points="52,24 62,46 36,38" fill={`url(#${id}-f2)`} />
            <polygon points="10,46 36,68 36,38" fill={`url(#${id}-f3)`} />
            <polygon points="62,46 36,68 36,38" fill={`url(#${id}-f3)`} />
            {/* Edges */}
            <path d="M36,4 L20,24 L10,46 L36,68 L62,46 L52,24 Z" fill="none" stroke="#90ee90" strokeWidth="1" />
            <line x1="36" y1="4" x2="36" y2="68" stroke="#90ee90" strokeWidth="0.75" opacity="0.5" />
            <line x1="20" y1="24" x2="36" y2="38" stroke="#90ee90" strokeWidth="0.75" opacity="0.5" />
            <line x1="52" y1="24" x2="36" y2="38" stroke="#90ee90" strokeWidth="0.75" opacity="0.5" />
            <line x1="10" y1="46" x2="36" y2="38" stroke="#90ee90" strokeWidth="0.75" opacity="0.5" />
            <line x1="62" y1="46" x2="36" y2="38" stroke="#90ee90" strokeWidth="0.75" opacity="0.5" />
          </g>
          <text x="36" y="44" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="bold" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>{value}</text>
        </svg>
      );
    
    case 12: // Dodecahedron with value
      return (
        <svg width={72} height={72} viewBox="0 0 72 72" className={pulseClass}>
          <defs>
            <linearGradient id={`${id}-p1`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ba55d3" />
              <stop offset="100%" stopColor="#9932cc" />
            </linearGradient>
            <linearGradient id={`${id}-p2`} x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#d070e8" />
              <stop offset="100%" stopColor="#a040c0" />
            </linearGradient>
            <linearGradient id={`${id}-p3`} x1="50%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#6a2090" />
              <stop offset="100%" stopColor="#7a28a0" />
            </linearGradient>
            <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="2" dy="3" stdDeviation="3" floodOpacity="0.4" />
            </filter>
          </defs>
          <g filter={`url(#${id}-shadow)`}>
            {/* Main pentagon face */}
            <polygon points="36,8 56,22 50,48 22,48 16,22" fill={`url(#${id}-p1)`} stroke="#e8a0f0" strokeWidth="1" />
            {/* Side faces (partial) */}
            <polygon points="36,8 16,22 6,14 24,2" fill={`url(#${id}-p2)`} stroke="#e8a0f0" strokeWidth="0.75" />
            <polygon points="36,8 56,22 66,14 48,2" fill={`url(#${id}-p2)`} stroke="#e8a0f0" strokeWidth="0.75" />
            <polygon points="16,22 22,48 6,52 2,32" fill={`url(#${id}-p3)`} stroke="#e8a0f0" strokeWidth="0.75" />
            <polygon points="56,22 50,48 66,52 70,32" fill={`url(#${id}-p3)`} stroke="#e8a0f0" strokeWidth="0.75" />
            <polygon points="22,48 50,48 48,66 24,66" fill={`url(#${id}-p3)`} stroke="#e8a0f0" strokeWidth="0.75" />
          </g>
          <text x="36" y="36" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="bold" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}>{value}</text>
        </svg>
      );
    
    case 20: // Icosahedron with value
      return (
        <svg width={72} height={72} viewBox="0 0 72 72" className={pulseClass}>
          <defs>
            <linearGradient id={`${id}-t1`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffd700" />
              <stop offset="100%" stopColor="#daa520" />
            </linearGradient>
            <linearGradient id={`${id}-t2`} x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffe44d" />
              <stop offset="100%" stopColor="#e6b800" />
            </linearGradient>
            <linearGradient id={`${id}-t3`} x1="50%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#b8860b" />
              <stop offset="100%" stopColor="#cd9b1d" />
            </linearGradient>
            <linearGradient id={`${id}-t4`} x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#996515" />
              <stop offset="100%" stopColor="#b07d1a" />
            </linearGradient>
            <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="2" dy="3" stdDeviation="3" floodOpacity="0.4" />
            </filter>
          </defs>
          <g filter={`url(#${id}-shadow)`}>
            {/* Top triangular faces */}
            <polygon points="36,6 24,22 48,22" fill={`url(#${id}-t1)`} />
            <polygon points="24,22 10,14 36,6" fill={`url(#${id}-t2)`} />
            <polygon points="48,22 62,14 36,6" fill={`url(#${id}-t2)`} />
            {/* Middle band */}
            <polygon points="24,22 10,40 20,50" fill={`url(#${id}-t3)`} />
            <polygon points="24,22 20,50 36,38" fill={`url(#${id}-t1)`} />
            <polygon points="24,22 48,22 36,38" fill={`url(#${id}-t1)`} />
            <polygon points="48,22 36,38 52,50" fill={`url(#${id}-t1)`} />
            <polygon points="48,22 52,50 62,40" fill={`url(#${id}-t3)`} />
            {/* Bottom faces */}
            <polygon points="20,50 36,66 36,38" fill={`url(#${id}-t4)`} />
            <polygon points="52,50 36,66 36,38" fill={`url(#${id}-t4)`} />
            {/* Edges */}
            <polygon points="36,6 10,14 10,40 36,66 62,40 62,14" fill="none" stroke="#ffe680" strokeWidth="1" />
            <line x1="24" y1="22" x2="48" y2="22" stroke="#ffe680" strokeWidth="0.75" opacity="0.6" />
            <line x1="20" y1="50" x2="52" y2="50" stroke="#ffe680" strokeWidth="0.75" opacity="0.6" />
          </g>
          <text x="36" y="40" textAnchor="middle" fill="#4a3000" fontSize="16" fontWeight="bold" style={{textShadow: '0 0 3px rgba(255,255,255,0.5)'}}>{value}</text>
        </svg>
      );
    
    default:
      return null;
  }
};

export default function DiceRoller() {
  const [dice, setDice] = useState<DiceRoll[]>([]);
  const [rollHistory, setRollHistory] = useState<DiceRoll[][]>([]);
  const [isRolling, setIsRolling] = useState(false);

  const addDice = (type: DiceType) => {
    const newDice: DiceRoll = {
      type,
      value: Math.floor(Math.random() * type) + 1,
      id: Date.now().toString() + Math.random(),
    };
    setDice([...dice, newDice]);
  };

  const rollAll = () => {
    setIsRolling(true);
    setTimeout(() => {
      const rolled = dice.map(d => ({
        ...d,
        value: Math.floor(Math.random() * d.type) + 1,
      }));
      setDice(rolled);
      if (rolled.length > 0) {
        setRollHistory([rolled, ...rollHistory].slice(0, 10));
      }
      setIsRolling(false);
    }, 300);
  };

  const removeDice = (id: string) => {
    setDice(dice.filter(d => d.id !== id));
  };

  const clearAll = () => {
    setDice([]);
  };

  const total = dice.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="space-y-4">
      {/* Dice Type Selector */}
      <div>
        <div className="text-[10px] text-amber-200/60 mb-2 font-serif uppercase tracking-wider">
          Add Dice
        </div>
        <div className="flex flex-wrap gap-1.5">
          {DICE_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => addDice(type)}
              className="p-1.5 bg-stone-900/60 hover:bg-stone-900/80 border border-amber-900/40 hover:border-amber-700/60 rounded-lg transition-colors active:scale-95"
              title={`Add d${type}`}
            >
              <DiceShape type={type} size={40} />
            </button>
          ))}
        </div>
      </div>

      {/* Active Dice */}
      <AnimatePresence mode="wait">
        {dice.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="text-[10px] text-amber-200/60 font-serif uppercase tracking-wider">
                Active Dice
              </div>
              <div className="flex gap-2">
                <button
                  onClick={rollAll}
                  disabled={isRolling}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-b from-amber-500 to-amber-700 hover:from-amber-400 hover:to-amber-600 border border-amber-400/40 text-stone-950 rounded-md text-xs font-serif font-semibold shadow-md shadow-amber-900/30 transition-colors disabled:opacity-50"
                >
                  <Shuffle
                    className={`w-3.5 h-3.5 ${isRolling ? 'animate-spin' : ''}`}
                  />
                  Roll All
                </button>
                <button
                  onClick={clearAll}
                  className="px-3 py-1.5 bg-stone-800/70 hover:bg-stone-700/70 border border-amber-900/40 text-amber-100 hover:text-red-300 rounded-md text-xs font-serif transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mb-3">
              {dice.map((die) => (
                <motion.div
                  key={die.id}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ 
                    scale: 1, 
                    rotate: isRolling ? [0, 360] : 0,
                  }}
                  transition={{ 
                    type: "spring",
                    stiffness: 300,
                    damping: 15,
                    rotate: { duration: 0.3 }
                  }}
                  className="relative group"
                >
                  <div className="flex items-center justify-center drop-shadow-lg">
                    <ActiveDiceShape type={die.type} value={die.value} isRolling={isRolling} />
                  </div>
                  <button
                    onClick={() => removeDice(die.id)}
                    className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg"
                  >
                    ×
                  </button>
                </motion.div>
              ))}
            </div>
            {dice.length > 1 && (
              <div className="text-lg font-serif font-bold text-amber-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Total: {total}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Roll History */}
      {rollHistory.length > 0 && (
        <div>
          <div className="text-[10px] text-amber-200/60 mb-2 font-serif uppercase tracking-wider">
            Recent Rolls
          </div>
          <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-hide">
            {rollHistory.map((rollSet, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-stone-900/60 border border-amber-900/30 rounded-md text-xs font-serif"
              >
                <div className="flex gap-1 flex-wrap">
                  {rollSet.map((die, i) => (
                    <span key={i} className="text-amber-100/90">
                      <span className="text-amber-200/50">d{die.type}:</span>
                      <span className="text-amber-300 font-semibold ml-0.5">
                        {die.value}
                      </span>
                      {i < rollSet.length - 1 && (
                        <span className="text-stone-500">,</span>
                      )}
                    </span>
                  ))}
                </div>
                {rollSet.length > 1 && (
                  <span className="text-emerald-400 ml-auto font-semibold tabular-nums">
                    = {rollSet.reduce((sum, d) => sum + d.value, 0)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {dice.length === 0 && (
        <div className="text-center py-8 text-amber-200/60">
          <Dice1 className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-serif italic text-sm">Add dice to begin</p>
        </div>
      )}
    </div>
  );
}
