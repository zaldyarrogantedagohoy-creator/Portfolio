
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import '../styles/HomePage.css';

import logoImg  from '../assets/images/logo.png';
import zadImg   from '../assets/images/zad.png';
import cert1Img from '../assets/images/certificate-1.png';
import cert2Img from '../assets/images/certificate-2.png';
import cert3Img from '../assets/images/certificate-3.png';
import cert4Img from '../assets/images/certificate-4.png';
import cert5Img from '../assets/images/certificate-5.png';
import cert6Img from '../assets/images/certificate-6.png';

const SOCIAL_LINKS = {
  github:   'https://github.com/zaldyarrogantedagohoy-creator',
  linkedin: 'https://www.linkedin.com/in/zaldy-dagohoy-73a5a5415/?skipRedirect=true',
  twitter:  'https://x.com/zaldydagohoy',
  dribbble: 'https://dribbble.com/zaldy-dagohoy',
};

const assetFilename = (path) => path.replace(/^.*[\\/]/, '').replace(/\.(png|jpe?g|pdf)$/i, '');
const assetType = (path) => {
  const ext = path.split('.').pop().toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (['png','jpg','jpeg'].includes(ext)) return 'image';
  return 'file';
};
const buildAssets = (entries) =>
  Object.entries(entries)
    .filter(([path]) => /\.(png|jpe?g|pdf)$/i.test(path))
    .map(([path, src]) => ({
      src,
      name: assetFilename(path),
      type: assetType(path),
      ext: path.split('.').pop().toUpperCase(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

const designAssets     = buildAssets(import.meta.glob('../assets/Design/*.{png,jpg,jpeg,pdf}',       { eager: true, query: '?url', import: 'default' }));
const researchAssets   = buildAssets(import.meta.glob('../assets/Research/*.{png,jpg,jpeg,pdf}',     { eager: true, query: '?url', import: 'default' }));
const developmentAssets= buildAssets(import.meta.glob('../assets/Development/*.{png,jpg,jpeg,pdf}',  { eager: true, query: '?url', import: 'default' }));
const folderAssets = { design: designAssets, research: researchAssets, development: developmentAssets };

const IconReact = ({ size = 20, color = '#00ff88' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <ellipse cx="12" cy="12" rx="2.5" ry="2.5" fill={color} opacity="0.9"/>
    <ellipse cx="12" cy="12" rx="10" ry="4" stroke={color} strokeWidth="1" fill="none" opacity="0.7"/>
    <ellipse cx="12" cy="12" rx="10" ry="4" stroke={color} strokeWidth="1" fill="none" opacity="0.7" transform="rotate(60 12 12)"/>
    <ellipse cx="12" cy="12" rx="10" ry="4" stroke={color} strokeWidth="1" fill="none" opacity="0.7" transform="rotate(120 12 12)"/>
  </svg>
);

const IconJS = ({ size = 20, color = '#00ff88' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="2" fill={color} fillOpacity="0.12" stroke={color} strokeWidth="1" opacity="0.5"/>
    <text x="5" y="17" fontFamily="monospace" fontWeight="700" fontSize="11" fill={color}>JS</text>
  </svg>
);

const IconNode = ({ size = 20, color = '#00ff88' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" stroke={color} strokeWidth="1" fill={color} fillOpacity="0.1"/>
    <path d="M12 2l9 5-9 5-9-5 9-5z" stroke={color} strokeWidth="1" fill={color} fillOpacity="0.2"/>
    <line x1="12" y1="12" x2="12" y2="22" stroke={color} strokeWidth="1" opacity="0.6"/>
  </svg>
);

const IconFigma = ({ size = 20, color = '#00ff88' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="5" y="2" width="7" height="7" rx="2" stroke={color} strokeWidth="1" fill={color} fillOpacity="0.1"/>
    <rect x="12" y="2" width="7" height="7" rx="2" stroke={color} strokeWidth="1" fill={color} fillOpacity="0.15"/>
    <rect x="5" y="9" width="7" height="7" rx="2" stroke={color} strokeWidth="1" fill={color} fillOpacity="0.1"/>
    <circle cx="15.5" cy="15.5" r="3.5" stroke={color} strokeWidth="1" fill={color} fillOpacity="0.2"/>
    <rect x="5" y="16" width="7" height="6" rx="2" stroke={color} strokeWidth="1" fill={color} fillOpacity="0.1"/>
  </svg>
);

const IconGit = ({ size = 20, color = '#00ff88' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="6" cy="6" r="2.5" stroke={color} strokeWidth="1" fill={color} fillOpacity="0.2"/>
    <circle cx="18" cy="6" r="2.5" stroke={color} strokeWidth="1" fill={color} fillOpacity="0.2"/>
    <circle cx="6" cy="18" r="2.5" stroke={color} strokeWidth="1" fill={color} fillOpacity="0.2"/>
    <path d="M8.5 6h7M6 8.5v7M8.5 18l9.5-9.5" stroke={color} strokeWidth="1" strokeLinecap="round"/>
  </svg>
);

const IconGithub = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconLinkedin = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="4" stroke={color} strokeWidth="1.5"/>
    <line x1="7" y1="10" x2="7" y2="17" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="7" cy="7" r="1" fill={color}/>
    <path d="M11 10v7M11 13c0-1.657 1.343-3 3-3s3 1.343 3 3v4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconTwitter = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 4l16 16M4 20L20 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
    <path d="M3 5h6l12 14H15L3 5z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" fill={color} fillOpacity="0.08"/>
    <path d="M15 5h4M5 19H9" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconDribbble = ({ size = 18, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5"/>
    <path d="M6.5 5C9 8.5 11 12.5 11.5 19" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M17.5 5C15 8.5 11 10 4 10" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M13.5 20C14 16 17 13 21 13" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconEmail = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="2" stroke={color} strokeWidth="1.5"/>
    <polyline points="2,4 12,13 22,4" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
);

const IconPin = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke={color} strokeWidth="1.5"/>
    <circle cx="12" cy="9" r="2.5" stroke={color} strokeWidth="1.5"/>
  </svg>
);

const IconGrad = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 12l9-5 9 5-9 5-9-5z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" fill={color} fillOpacity="0.12"/>
    <path d="M7 14v4c0 1 2.333 2 5 2s5-1 5-2v-4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="21" y1="12" x2="21" y2="17" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconSend = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M22 2L11 13" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M22 2L15 22l-4-9-9-4 20-7z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" fill={color} fillOpacity="0.1"/>
  </svg>
);

const IconArrow = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <polyline points="13,6 19,12 13,18" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconCheck = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <polyline points="20,6 9,17 4,12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconFolder = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 7c0-1.1.9-2 2-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.1"/>
  </svg>
);

const IconClock = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5"/>
    <polyline points="12,7 12,12 15,15" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconLayers = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <polygon points="12,2 22,8.5 12,15 2,8.5" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.1"/>
    <polyline points="2,12 12,18.5 22,12" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <polyline points="2,16 12,22.5 22,16" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
  </svg>
);

const IconAward = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="9" r="6" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.1"/>
    <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="12,6 13,8 15,8 13.5,9.5 14,12 12,10.5 10,12 10.5,9.5 9,8 11,8" stroke={color} strokeWidth="1" fill={color} fillOpacity="0.2"/>
  </svg>
);

const IconStar = ({ size = 14, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <polygon points="12,2 15,9 22,9 16.5,14 18.5,21 12,17 5.5,21 7.5,14 2,9 9,9" stroke={color} strokeWidth="1.5" strokeLinejoin="round" fill={color} fillOpacity="0.12"/>
  </svg>
);

const IconCode = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <polyline points="16,18 22,12 16,6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <polyline points="8,6 2,12 8,18" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="14" y1="4" x2="10" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
  </svg>
);

const IconSearch = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.5"/>
    <line x1="16.5" y1="16.5" x2="22" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="8" y1="11" x2="14" y2="11" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
    <line x1="11" y1="8" x2="11" y2="14" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
  </svg>
);

const IconPalette = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.08"/>
    <circle cx="6.5" cy="11.5" r="1.5" fill={color}/>
    <circle cx="9.5" cy="7.5" r="1.5" fill={color}/>
    <circle cx="14.5" cy="7.5" r="1.5" fill={color} opacity="0.6"/>
    <circle cx="17.5" cy="11.5" r="1.5" fill={color} opacity="0.4"/>
  </svg>
);

const IconDatabase = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <ellipse cx="12" cy="6" rx="8" ry="3" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.12"/>
    <path d="M4 6v4c0 1.66 3.58 3 8 3s8-1.34 8-3V6" stroke={color} strokeWidth="1.5"/>
    <path d="M4 10v4c0 1.66 3.58 3 8 3s8-1.34 8-3v-4" stroke={color} strokeWidth="1.5"/>
    <path d="M4 14v4c0 1.66 3.58 3 8 3s8-1.34 8-3v-4" stroke={color} strokeWidth="1.5" opacity="0.5"/>
  </svg>
);

const IconMobile = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="5" y="2" width="14" height="20" rx="3" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.08"/>
    <line x1="9" y1="6" x2="15" y2="6" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
    <circle cx="12" cy="18" r="1" fill={color}/>
  </svg>
);

const IconLock = ({ size = 13, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.1"/>
    <path d="M7 11V7a5 5 0 0110 0v4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="12" cy="16" r="1.5" fill={color}/>
  </svg>
);

const IconEye = ({ size = 13, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.15"/>
  </svg>
);

const IconQuote = ({ size = 22, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" stroke={color} strokeWidth="1.2" fill={color} fillOpacity="0.1"/>
    <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" stroke={color} strokeWidth="1.2" fill={color} fillOpacity="0.1"/>
  </svg>
);

const IconChevronUp = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <polyline points="18,15 12,9 6,15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconSpinner = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ animation: 'spin 1s linear infinite' }}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" strokeOpacity="0.25"/>
    <path d="M21 12a9 9 0 00-9-9" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const IconHeart = ({ size = 13, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>
);

const HexBg = ({ color = 'rgba(0,255,136,0.35)' }) => (
  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 46 46" aria-hidden="true">
    <polygon style={{ fill: 'rgba(0,255,136,0.08)', transition: 'fill-opacity 0.2s' }} points="23,3 40,13 40,33 23,43 6,33 6,13" className="hex-fill"/>
    <polygon style={{ stroke: color, strokeWidth: 1, fill: 'none', transition: 'stroke-opacity 0.2s' }} points="23,3 40,13 40,33 23,43 6,33 6,13" className="hex-border"/>
    <polygon style={{ stroke: 'rgba(0,255,136,0.12)', strokeWidth: 0.5, fill: 'none' }} points="23,8 36,15.5 36,30.5 23,38 10,30.5 10,15.5"/>
  </svg>
);

const FolderIcon = ({ color = '#00ff88', innerIcon, isOpen, onClick }) => (
  <div
    className={`folder-3d${isOpen ? ' folder-open' : ''}`}
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && onClick()}
    aria-label="Open folder"
    style={{ '--folder-color': color }}
  >
    <div className="folder-body">
      <div className="folder-tab"></div>
      <div className="folder-front">
        <div className="folder-inner-icon">{innerIcon}</div>
        <div className="folder-shine"></div>
      </div>
      <div className="folder-papers">
        <div className="folder-paper paper-1"></div>
        <div className="folder-paper paper-2"></div>
        <div className="folder-paper paper-3"></div>
      </div>
    </div>
    <div className="folder-shadow"></div>
  </div>
);

const SkillCube = ({ skills }) => {
  const [rotX, setRotX] = useState(-20);
  const [rotY, setRotY] = useState(30);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const [activeFace, setActiveFace] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const animRef = useRef(null);
  const cubeRef = useRef(null);
  const rotYRef = useRef(rotY);

  useEffect(() => {
    if (!autoRotate) return;
    animRef.current = setInterval(() => {
      rotYRef.current += 0.4;
      setRotY(rotYRef.current);
    }, 16);
    return () => clearInterval(animRef.current);
  }, [autoRotate]);

  const onMouseDown = (e) => { setIsDragging(true); setAutoRotate(false); setLastMouse({ x: e.clientX, y: e.clientY }); };
  const onMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMouse.x; const dy = e.clientY - lastMouse.y;
    setRotY(prev => prev + dx * 0.5); rotYRef.current += dx * 0.5;
    setRotX(prev => Math.max(-45, Math.min(45, prev - dy * 0.5)));
    setLastMouse({ x: e.clientX, y: e.clientY });
  };
  const onMouseUp = () => { setIsDragging(false); setTimeout(() => setAutoRotate(true), 2000); };
  const onTouchStart = (e) => { setIsDragging(true); setAutoRotate(false); setLastMouse({ x: e.touches[0].clientX, y: e.touches[0].clientY }); };
  const onTouchMove = (e) => {
    if (!isDragging) return;
    const dx = e.touches[0].clientX - lastMouse.x; const dy = e.touches[0].clientY - lastMouse.y;
    setRotY(prev => prev + dx * 0.6); rotYRef.current += dx * 0.6;
    setRotX(prev => Math.max(-45, Math.min(45, prev - dy * 0.6)));
    setLastMouse({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };
  const onTouchEnd = () => { setIsDragging(false); setTimeout(() => setAutoRotate(true), 2000); };

  const faceColors = [
    { bg: 'rgba(0,255,136,0.08)',   border: 'rgba(0,255,136,0.4)'   },
    { bg: 'rgba(0,229,255,0.08)',   border: 'rgba(0,229,255,0.4)'   },
    { bg: 'rgba(255,183,0,0.08)',   border: 'rgba(255,183,0,0.4)'   },
    { bg: 'rgba(0,255,136,0.08)',   border: 'rgba(0,255,136,0.4)'   },
    { bg: 'rgba(180,100,255,0.08)', border: 'rgba(180,100,255,0.4)' },
    { bg: 'rgba(0,229,255,0.08)',   border: 'rgba(0,229,255,0.4)'   },
  ];
  const faceTransforms = [
    'translateZ(120px)', 'rotateY(180deg) translateZ(120px)',
    'rotateY(90deg) translateZ(120px)', 'rotateY(-90deg) translateZ(120px)',
    'rotateX(90deg) translateZ(120px)', 'rotateX(-90deg) translateZ(120px)',
  ];
  const levelMap = { Advanced: 92, Strong: 78, Intermediate: 60 };
  const faceIcons2D = [
    <IconReact size={22} color="rgba(0,255,136,0.9)" />,
    <IconJS size={22} color="rgba(0,229,255,0.9)" />,
    <IconPalette size={22} color="rgba(255,183,0,0.9)" />,
    <IconMobile size={22} color="rgba(0,255,136,0.9)" />,
    <IconDatabase size={22} color="rgba(180,100,255,0.9)" />,
    <IconCode size={22} color="rgba(0,229,255,0.9)" />,
  ];

  return (
    <div className="cube-universe">
      <div
        className={`cube-stage${isDragging ? ' dragging' : ''}`}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        ref={cubeRef}
      >
        <div className="cube-hint">drag to rotate · click face to explore</div>
        <div className="cube-3d" style={{ transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)` }}>
          {faceColors.map((face, i) => (
            <div
              key={i}
              className={`cube-face${activeFace === i ? ' active-face' : ''}`}
              style={{ transform: faceTransforms[i], background: face.bg, borderColor: face.border }}
              onClick={() => setActiveFace(i)}
            >
              <div className="face-icon-2d">{faceIcons2D[i]}</div>
              <i className={skills[i].icon} style={{ fontSize: '0.9rem', opacity: 0.4 }}></i>
              <span className="face-label">{skills[i].label}</span>
              <div className="face-bar" style={{ '--face-pct': `${levelMap[skills[i].level]}%`, '--face-color': face.border }}>
                <div className="face-bar-fill"></div>
              </div>
              <span className="face-level">{skills[i].level}</span>
            </div>
          ))}
        </div>
        <div className="cube-floor"></div>
      </div>
      <div className="cube-panel">
        <div className="cube-panel-header">
          <span className="cube-panel-kicker">$ skill --inspect</span>
          <h3 className="cube-panel-title">{skills[activeFace].label}</h3>
          <span className="cube-panel-cat">{skills[activeFace].category}</span>
        </div>
        <p className="cube-panel-desc">{skills[activeFace].description}</p>
        <div className="cube-chart">
          {skills.map((sk, i) => {
            const pct = levelMap[sk.level];
            const colors = ['#00ff88','#00e5ff','#ffb700','#00ff88','#b464ff','#00e5ff'];
            const icons2D = [
              <IconReact size={14} color={colors[0]}/>,
              <IconJS size={14} color={colors[1]}/>,
              <IconPalette size={14} color={colors[2]}/>,
              <IconMobile size={14} color={colors[3]}/>,
              <IconDatabase size={14} color={colors[4]}/>,
              <IconCode size={14} color={colors[5]}/>,
            ];
            return (
              <div key={i} className={`chart-row${activeFace === i ? ' chart-row-active' : ''}`} onClick={() => setActiveFace(i)}>
                <span className="chart-label">
                  <span className="chart-icon-2d">{icons2D[i]}</span>
                  {sk.label}
                </span>
                <div className="chart-bar-track">
                  <div className="chart-bar-fill" style={{ '--pct': `${pct}%`, '--clr': colors[i] }}></div>
                </div>
                <span className="chart-pct" style={{ color: colors[i] }}>{pct}%</span>
              </div>
            );
          })}
        </div>
        <div className="cube-nav">
          {faceColors.map((_, i) => (
            <button key={i} className={`cube-dot${activeFace === i ? ' active' : ''}`} onClick={() => setActiveFace(i)} aria-label={`Face ${i + 1}`}></button>
          ))}
        </div>
      </div>
    </div>
  );
};

const BulbIcon = () => (
  <svg width="62" height="72" viewBox="0 0 62 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="31" cy="27" rx="18" ry="18" fill="#1a1200" stroke="#ffb700" strokeWidth="1.2" opacity="0.9"/>
    <ellipse cx="31" cy="26" rx="14" ry="14" fill="#ffb700" opacity="0.18"/>
    <path d="M20 19 Q24 14 31 13" stroke="#ffe080" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
    <path d="M26 32 Q28 28 31 30 Q34 28 36 32" stroke="#ffb700" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <rect x="25" y="44" width="12" height="7" rx="2" fill="#1a1200" stroke="#ffb700" strokeWidth="1"/>
    <rect x="24" y="51" width="14" height="4" rx="1.5" fill="#332200" stroke="#ffb700" strokeWidth="0.8" opacity="0.9"/>
    <rect x="25" y="55" width="12" height="4" rx="1.5" fill="#221800" stroke="#ffb700" strokeWidth="0.8" opacity="0.8"/>
    <rect x="27" y="59" width="8" height="3" rx="1" fill="#111" stroke="#ffb700" strokeWidth="0.7" opacity="0.7"/>
    <line x1="31" y1="6" x2="31" y2="2" stroke="#ffb700" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
    <line x1="44" y1="10" x2="47" y2="7" stroke="#ffb700" strokeWidth="1.2" strokeLinecap="round" opacity="0.4"/>
    <line x1="18" y1="10" x2="15" y2="7" stroke="#ffb700" strokeWidth="1.2" strokeLinecap="round" opacity="0.4"/>
    <line x1="48" y1="23" x2="52" y2="22" stroke="#ffb700" strokeWidth="1.2" strokeLinecap="round" opacity="0.35"/>
    <line x1="14" y1="23" x2="10" y2="22" stroke="#ffb700" strokeWidth="1.2" strokeLinecap="round" opacity="0.35"/>
    <path d="M49 27 Q50 27 49.5 36 L45 44 L43 44 L47 36 Z" fill="#ffb700" opacity="0.07"/>
    <ellipse cx="31" cy="70" rx="18" ry="3" fill="#ffb700" opacity="0.12"/>
  </svg>
);

const PencilIcon = () => (
  <svg width="60" height="72" viewBox="0 0 60 72" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="14,8 20,8 20,58 14,56" fill="#004d66" opacity="0.8"/>
    <polygon points="20,8 26,8 26,58 20,58" fill="#00e5ff" opacity="0.25"/>
    <polygon points="14,8 26,8 26,58 14,58" fill="#001a22" stroke="#00e5ff" strokeWidth="0.8"/>
    <line x1="14" y1="18" x2="26" y2="18" stroke="#00e5ff" strokeWidth="0.5" opacity="0.3"/>
    <line x1="14" y1="28" x2="26" y2="28" stroke="#00e5ff" strokeWidth="0.5" opacity="0.3"/>
    <line x1="14" y1="38" x2="26" y2="38" stroke="#00e5ff" strokeWidth="0.5" opacity="0.2"/>
    <line x1="14" y1="48" x2="26" y2="48" stroke="#00e5ff" strokeWidth="0.5" opacity="0.2"/>
    <rect x="13" y="4" width="14" height="6" rx="2" fill="#ff6b9d" opacity="0.85"/>
    <rect x="13" y="9" width="14" height="2" fill="#cc4477" opacity="0.6"/>
    <rect x="13" y="6" width="14" height="3" fill="#888" opacity="0.5"/>
    <polygon points="14,58 26,58 20,68" fill="#f5e0b0" opacity="0.9"/>
    <polygon points="17,58 23,58 20,65" fill="#d4a060" opacity="0.8"/>
    <polygon points="19,63 21,63 20,68" fill="#333"/>
    <polygon points="26,8 32,5 32,55 26,58" fill="#00e5ff" opacity="0.12"/>
    <line x1="16" y1="10" x2="16" y2="55" stroke="#00e5ff" strokeWidth="0.6" opacity="0.15"/>
    <ellipse cx="20" cy="70" rx="14" ry="2.5" fill="#00e5ff" opacity="0.1"/>
  </svg>
);

const LaptopIcon = () => (
  <svg width="68" height="60" viewBox="0 0 68 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="10,38 58,38 62,8 14,8" fill="#0a1a12" stroke="#00ff88" strokeWidth="0.8" opacity="0.9"/>
    <polygon points="12,37 56,37 60,10 16,10" fill="#050e09"/>
    <polygon points="15,35 53,35 57,13 19,13" fill="#00ff88" opacity="0.06"/>
    <line x1="20" y1="18" x2="40" y2="18" stroke="#00ff88" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
    <line x1="20" y1="22" x2="50" y2="22" stroke="#00ff88" strokeWidth="1" strokeLinecap="round" opacity="0.5"/>
    <line x1="20" y1="26" x2="44" y2="26" stroke="#00ff88" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
    <line x1="20" y1="30" x2="36" y2="30" stroke="#00ff88" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
    <rect x="37" y="28" width="3" height="4" rx="0.5" fill="#00ff88" opacity="0.9"/>
    <polygon points="12,37 56,37 60,10 16,10" fill="none" stroke="#00ff88" strokeWidth="0.6" opacity="0.4"/>
    <polygon points="8,40 60,40 58,38 10,38" fill="#00ff88" opacity="0.15"/>
    <rect x="6" y="40" width="56" height="11" rx="2" fill="#050e09" stroke="#00ff88" strokeWidth="0.8"/>
    <rect x="7" y="40" width="54" height="3" rx="1" fill="#00ff88" opacity="0.08"/>
    <rect x="24" y="43" width="20" height="5" rx="1.5" fill="#0a1a12" stroke="#00ff88" strokeWidth="0.6" opacity="0.7"/>
    <polygon points="62,38 62,50 60,51 60,40" fill="#00ff88" opacity="0.1"/>
    <polygon points="6,51 62,50 62,51 6,52" fill="#00ff88" opacity="0.08"/>
    <ellipse cx="34" cy="57" rx="26" ry="3" fill="#00ff88" opacity="0.1"/>
  </svg>
);

const RocketIcon = () => (
  <svg width="56" height="80" viewBox="0 0 56 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="28" cy="65" rx="8" ry="6" fill="#b464ff" opacity="0.18"/>
    <path d="M22,60 Q24,70 28,74 Q32,70 34,60 Z" fill="#b464ff" opacity="0.35"/>
    <path d="M25,60 Q27,67 28,70 Q29,67 31,60 Z" fill="#e0a0ff" opacity="0.5"/>
    <ellipse cx="28" cy="63" rx="3" ry="5" fill="#ffffff" opacity="0.18"/>
    <path d="M21,20 L21,58 L24,62 L24,20 Z" fill="#3a1066" opacity="0.7"/>
    <path d="M32,20 L32,58 L36,62 L36,20 Z" fill="#b464ff" opacity="0.22"/>
    <path d="M21,20 Q21,10 28,4 Q35,10 35,20 L35,58 L28,62 L21,58 Z" fill="#0d0520" stroke="#b464ff" strokeWidth="1"/>
    <path d="M23,22 Q23,14 28,9 Q33,14 33,22 L33,56 L28,59 L23,56 Z" fill="#b464ff" opacity="0.07"/>
    <circle cx="28" cy="30" r="6" fill="#1a0a2e" stroke="#b464ff" strokeWidth="1"/>
    <circle cx="28" cy="30" r="4" fill="#b464ff" opacity="0.2"/>
    <circle cx="26" cy="28" r="1.5" fill="#e0c0ff" opacity="0.4"/>
    <path d="M21,50 L21,60 L14,64 L16,50 Z" fill="#1a0a2e" stroke="#b464ff" strokeWidth="0.8"/>
    <path d="M21,50 L21,60 L14,64 Z" fill="#b464ff" opacity="0.15"/>
    <path d="M35,50 L35,60 L42,64 L40,50 Z" fill="#1a0a2e" stroke="#b464ff" strokeWidth="0.8"/>
    <path d="M35,50 L35,60 L42,64 Z" fill="#b464ff" opacity="0.22"/>
    <path d="M25,9 Q28,2 31,9" fill="#b464ff" opacity="0.5"/>
    <circle cx="10" cy="18" r="1" fill="#b464ff" opacity="0.5"/>
    <circle cx="46" cy="24" r="1" fill="#b464ff" opacity="0.4"/>
    <circle cx="8" cy="36" r="0.8" fill="#b464ff" opacity="0.3"/>
    <circle cx="48" cy="40" r="0.8" fill="#b464ff" opacity="0.35"/>
    <circle cx="12" cy="48" r="1" fill="#b464ff" opacity="0.25"/>
    <ellipse cx="28" cy="76" rx="16" ry="2.5" fill="#b464ff" opacity="0.12"/>
  </svg>
);

const ProcessStep = ({ step, label, desc, index, iconComponent }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.4 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`process-step-animated step-${index + 1}${visible ? ' step-visible' : ''}`} style={{ '--step-delay': `${index * 0.15}s` }}>
      <div className="psa-connector">{index < 3 && <span className="psa-line"></span>}</div>
      <div className="icon-scene">
        <div className="orbit-ring"><span className="orbit-dot"></span></div>
        <div className="ripple"></div>
        <div className="icon-3d">{iconComponent}</div>
        <div className="floor-glow"></div>
      </div>
      <span className="psa-num">{step}</span>
      <strong dangerouslySetInnerHTML={{ __html: label }} />
      <span dangerouslySetInnerHTML={{ __html: desc }} />
    </div>
  );
};

const FileViewer = ({ file, onClose }) => {
  useEffect(() => {
    const blockSave = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); }
    };
    window.addEventListener('keydown', blockSave);
    return () => window.removeEventListener('keydown', blockSave);
  }, []);

  if (!file) return null;

  return (
    <div
      className="file-viewer"
      role="dialog"
      aria-modal="true"
      aria-label={`Viewing ${file.name}`}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="file-viewer-backdrop" onClick={onClose} />
      <div
        className="file-viewer-content"
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      >
        <button className="file-viewer-close" onClick={onClose} aria-label="Close viewer">×</button>
        <div className="file-viewer-title-bar">
          <span className="file-viewer-fname">{file.name}</span>
          <span className="file-viewer-ext-badge">{file.ext}</span>
        </div>
        <div className="file-viewer-readonly-strip">
          <IconEye size={11} color="currentColor" />
          view only — downloading disabled
        </div>
        {file.type === 'image' && (
          <div className="file-viewer-image-wrap" onContextMenu={(e) => e.preventDefault()}>
            <div
              className="file-viewer-image"
              style={{ backgroundImage: `url(${file.src})` }}
              role="img"
              aria-label={file.name}
              onDragStart={(e) => e.preventDefault()}
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        )}
        {file.type === 'pdf' && (
          <iframe
            title={file.name || 'Document'}
            src={`${file.src}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
            sandbox="allow-same-origin allow-scripts"
            onContextMenu={(e) => e.preventDefault()}
          />
        )}
      </div>
    </div>
  );
};

const HomePage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState({ type: '', message: '' });
  const [openFolder, setOpenFolder] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [countersVisible, setCountersVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const statsRef = useRef(null);

  const useCounter = (target, duration = 1800, active) => {
    const [count, setCount] = useState(0);
    useEffect(() => {
      if (!active) return;
      let start = 0;
      const step = target / (duration / 16);
      const timer = setInterval(() => {
        start += step;
        if (start >= target) { setCount(target); clearInterval(timer); }
        else setCount(Math.floor(start));
      }, 16);
      return () => clearInterval(timer);
    }, [target, duration, active]);
    return count;
  };

  const projectsCount = useCounter(30,  1800, countersVisible);
  const clientsCount  = useCounter(18,  1800, countersVisible);
  const yearsCount    = useCounter(4,   1200, countersVisible);
  const coffeeCount   = useCounter(847, 2200, countersVisible);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setCountersVisible(true); }, { threshold: 0.3 });
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const skills = [
    { icon: 'fab fa-react',      label: 'React Interfaces',   category: 'Frontend',    description: 'Building reusable components, dynamic pages, and smooth user interactions.',         level: 'Advanced'     },
    { icon: 'fab fa-js',         label: 'JavaScript Logic',   category: 'Programming', description: 'Creating interactive features, form validation, and clean application behavior.',     level: 'Advanced'     },
    { icon: 'fas fa-palette',    label: 'UI/UX Design',       category: 'Design',      description: 'Designing modern layouts, visual hierarchy, and user-friendly digital experiences.',  level: 'Strong'       },
    { icon: 'fas fa-mobile-alt', label: 'Responsive Layouts', category: 'Web Design',  description: 'Making websites adapt beautifully across desktop, tablet, and mobile screens.',       level: 'Advanced'     },
    { icon: 'fas fa-database',   label: 'Database Systems',   category: 'Backend',     description: 'Structuring data, connecting forms, and organizing records for web applications.',    level: 'Intermediate' },
    { icon: 'fas fa-code',       label: 'HTML & CSS Craft',   category: 'Development', description: 'Producing clean, polished interfaces with animations, shadows, and precise styling.', level: 'Advanced'     },
  ];

  const certificateItems = [
    { title: 'UX Design Certificate',                image: cert1Img },
    { title: 'Frontend Development Certificate',     image: cert2Img },
    { title: 'Analytics Certificate',                image: cert3Img },
    { title: 'Interaction Design Certificate',       image: cert4Img },
    { title: 'Performance Optimization Certificate', image: cert5Img },
    { title: 'Product Strategy Certificate',         image: cert6Img },
  ];
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  const categoryProjects = {
    design:      { title: 'Design Projects',      color: '#ffb700', items: folderAssets.design      },
    research:    { title: 'Research Projects',     color: '#00e5ff', items: folderAssets.research    },
    development: { title: 'Development Projects',  color: '#00ff88', items: folderAssets.development },
  };

  const handleOpenFolder = (category) => {
    setOpenFolder(category);
    setTimeout(() => { setSelectedCategory(category); setShowProjectModal(true); }, 600);
  };
  const closeProjectModal = () => { setShowProjectModal(false); setSelectedCategory(null); setOpenFolder(null); };

  const [viewerFile, setViewerFile] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const openFileViewer = (file) => {
    if (!file) return;
    setViewerFile(file);
    setViewerOpen(true);
  };
  const closeFileViewer = () => { setViewerOpen(false); setViewerFile(null); };

  useEffect(() => {
    document.body.style.overflow =
      (viewerOpen || selectedCertificate || showProjectModal) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [viewerOpen, selectedCertificate, showProjectModal]);

  const openCertificate  = (cert) => setSelectedCertificate(cert);
  const closeCertificate = ()     => setSelectedCertificate(null);

  const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.message) {
      setFormStatus({ type: 'error', message: 'ERROR: Please fill in name and comment.' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      setFormStatus({ type: 'error', message: 'ERROR: Invalid email address.' });
      return;
    }
    setIsSubmitting(true);
    setFormStatus({ type: '', message: 'Submitting to Supabase...' });
    try {
      if (!supabase) {
        console.warn('Supabase not configured; falling back to local submit.');
        await new Promise((res) => setTimeout(res, 700));
        setFormStatus({ type: 'success', message: 'SUCCESS: Message submitted (local fallback).' });
        setFormData({ name: '', email: '', message: '' });
      } else {
        const { error } = await supabase.from('contact_messages').insert([{
          name: formData.name,
          email: formData.email || null,
          message: formData.message,
          status: 'pending',
        }]);
        if (error) throw error;
        setFormStatus({ type: 'success', message: 'SUCCESS: Message saved to Supabase.' });
        setFormData({ name: '', email: '', message: '' });
      }
    } catch (err) {
      console.error('Submit error:', err);
      setFormStatus({ type: 'error', message: `ERROR: ${err?.message || 'Unable to submit message.'}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToSection = (id) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth' }); };

  const folderConfig = [
    {
      category: 'design',
      label:    'Design Projects',
      desc:     'Creative UI/UX solutions focused on user-centered design, accessibility, and high-fidelity prototyping.',
      tags:     ['Figma', 'UI/UX', 'Visual Design'],
      color:    '#ffb700',
      innerIcon: <IconPalette size={22} color="#ffb700"/>,
    },
    {
      category: 'research',
      label:    'Research Projects',
      desc:     'Evidence-based case studies and market analysis to drive product strategy and user insights.',
      tags:     ['User Testing', 'Analytics', 'Strategy'],
      color:    '#00e5ff',
      innerIcon: <IconSearch size={22} color="#00e5ff"/>,
    },
    {
      category: 'development',
      label:    'Development Projects',
      desc:     'Scalable web applications and frontend architectures built with performance and clean code in mind.',
      tags:     ['React', 'Node.js', 'TypeScript'],
      color:    '#00ff88',
      innerIcon: <IconCode size={22} color="#00ff88"/>,
    },
  ];

  const processSteps = [
    { step: '01', label: 'discover()', desc: 'research &amp; strategy',     iconComponent: <BulbIcon />   },
    { step: '02', label: 'design()',   desc: 'wireframes &amp; prototypes', iconComponent: <PencilIcon /> },
    { step: '03', label: 'build()',    desc: 'clean, fast code',            iconComponent: <LaptopIcon /> },
    { step: '04', label: 'deploy()',   desc: 'launch &amp; iterate',        iconComponent: <RocketIcon /> },
  ];

  const stackIcons = [
    { icon: 'fab fa-react',     comp: <IconReact size={18} color="#00ff88"/>, title: 'React'      },
    { icon: 'fab fa-js-square', comp: <IconJS size={18} color="#00ff88"/>,    title: 'JavaScript' },
    { icon: 'fab fa-node-js',   comp: <IconNode size={18} color="#00ff88"/>,  title: 'Node.js'    },
    { icon: 'fab fa-figma',     comp: <IconFigma size={18} color="#00ff88"/>, title: 'Figma'      },
    { icon: 'fab fa-git-alt',   comp: <IconGit size={18} color="#00ff88"/>,   title: 'Git'        },
  ];

  const socialItems = [
    { key: 'github',   href: SOCIAL_LINKS.github,   label: 'GitHub',   icon: <IconGithub size={17}/>   },
    { key: 'linkedin', href: SOCIAL_LINKS.linkedin,  label: 'LinkedIn', icon: <IconLinkedin size={17}/> },
    { key: 'twitter',  href: SOCIAL_LINKS.twitter,   label: 'Twitter',  icon: <IconTwitter size={17}/>  },
    { key: 'dribbble', href: SOCIAL_LINKS.dribbble,  label: 'Dribbble', icon: <IconDribbble size={17}/> },
  ].filter(item => item.href);

  return (
    <div className="homepage">

      <div className="ambient-bg" aria-hidden="true">
        <span className="orb orb-1"></span><span className="orb orb-2"></span>
        <span className="orb orb-3"></span><span className="orb orb-4"></span>
        <div className="grid-overlay"></div>
      </div>

      <div className="container">

        <nav className="navbar">
          <div className="logo">
            <img src={logoImg} alt="Site logo" className="site-logo" />
          </div>
          <ul className="nav-links">
            {['home','work','certificates','about'].map(id => (
              <li key={id}>
                <a href={`#${id}`} onClick={(e) => { e.preventDefault(); scrollToSection(id); }}>
                  <span className="nav-bracket nav-bracket-l">[</span>
                  {id}
                  <span className="nav-bracket nav-bracket-r">]</span>
                </a>
              </li>
            ))}
          </ul>
          <div className="nav-right">
            <span className="availability-badge">
              <span className="avail-dot"></span> available
            </span>
            <button className="btn btn-outline" onClick={() => scrollToSection('contact-section')}>
              contact_me()
            </button>
            <button className={`hamburger${menuOpen ? ' open' : ''}`} aria-label="Toggle menu" onClick={() => setMenuOpen(v => !v)}>
              <span></span><span></span><span></span>
            </button>
          </div>
          {menuOpen && (
            <div className="mobile-menu">
              {['home','work','certificates','about'].map(id => (
                <a key={id} href={`#${id}`} onClick={(e) => { e.preventDefault(); scrollToSection(id); setMenuOpen(false); }}>{id}</a>
              ))}
              <button className="btn" onClick={() => { scrollToSection('contact-section'); setMenuOpen(false); }}>contact_me()</button>
            </div>
          )}
        </nav>

        {/* HERO */}
        <section id="home" className="hero-section">
          <div className="hero">

            {/* LEFT: photo column — name tag lives here, bottom-left */}
            <div className="hero-photo-col">
              <div className="hero-photo-wrap">
                <img
                  src={zadImg}
                  alt="Zaldy Dagohoy"
                  className="hero-photo-img"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <div className="hero-photo-glow"></div>
              </div>
              {/* NAME TAG — pinned bottom-left of the photo column */}
              <div className="hero-name">
                <span className="hero-name-text">Zaldy Arrogante Dagohoy</span>
              </div>
            </div>

            {/* RIGHT: content column — center aligned */}
            <div className="hero-content">
              <span className="hero-badge">
                <IconCode size={13} color="#00ff88"/> product_designer &amp;&amp; frontend_dev
              </span>
              <h1>Crafting digital <span className="hero-highlight">experiences</span> that matter</h1>
              <p className="hero-desc">
                I'm Zaldy, a creative developer with a Bachelor's Degree in Technical-Vocational Teacher Education major in Computer Programming.
              </p>
              <div className="hero-actions">
                <button className="btn" onClick={() => scrollToSection('work')}>
                  ./view_projects <IconArrow size={14} color="currentColor"/>
                </button>
                <button className="btn btn-outline" onClick={() => scrollToSection('contact-section')}>
                  ping_me
                </button>
              </div>

              <div className="hero-stack">
                <span className="stack-label">stack</span>
                {stackIcons.map((s, i) => (
                  <span key={i} className="stack-icon" title={s.title}>
                    <HexBg />
                    <span className="stack-icon-inner">
                      {s.comp}
                      <i className={s.icon} style={{ fontSize: '0.65rem', opacity: 0.35, position: 'absolute', bottom: '5px', right: '5px' }}></i>
                    </span>
                  </span>
                ))}
              </div>

              <div className="social-links">
                {socialItems.map(({ key, href, label, icon }) => (
                  <a key={key} href={href} aria-label={label} target="_blank" rel="noopener noreferrer">
                    {icon}
                  </a>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* STATS BAR */}
        <div className="stats-bar" ref={statsRef}>
          <div className="stat-item"><span className="stat-number">{projectsCount}<sup>+</sup></span><span className="stat-label">projects_shipped</span></div>
          <div className="stat-divider" aria-hidden="true"></div>
          <div className="stat-item"><span className="stat-number">{clientsCount}<sup>+</sup></span><span className="stat-label">happy_clients</span></div>
          <div className="stat-divider" aria-hidden="true"></div>
          <div className="stat-item"><span className="stat-number">{yearsCount}<sup>yrs</sup></span><span className="stat-label">experience</span></div>
          <div className="stat-divider" aria-hidden="true"></div>
          <div className="stat-item"><span className="stat-number">{coffeeCount}</span><span className="stat-label">cups_of_coffee</span></div>
        </div>

        <div className="section-divider" aria-hidden="true">
          <svg viewBox="0 0 1200 30" preserveAspectRatio="none">
            <path d="M0,15 Q300,0 600,15 T1200,15" stroke="rgba(0,255,136,0.15)" strokeWidth="1" fill="none"/>
          </svg>
        </div>

        {/* ABOUT ME */}
        <section id="about" className="about-section">
          <h2 className="section-title">about_me</h2>
          <div className="about-grid">
            <div className="about-text">
              <p>I'm Zaldy, a creative developer with a technical background in computer programming and a passion for designing intuitive digital products.</p>
              <p>I blend UX thinking, frontend craftsmanship, and polished visual design to build modern web experiences that feel thoughtful, accessible, and easy to use.</p>
              <div className="about-pills">
                {[
                  { label: 'UI Design',     icon: <IconPalette size={11} color="#00ff88"/> },
                  { label: 'Prototyping',   icon: <IconCode size={11} color="#00ff88"/> },
                  { label: 'Frontend Dev',  icon: <IconReact size={11} color="#00ff88"/> },
                  { label: 'User Research', icon: <IconSearch size={11} color="#00ff88"/> },
                  { label: 'Accessibility', icon: <IconCheck size={11} color="#00ff88"/> },
                  { label: 'Performance',   icon: <IconNode size={11} color="#00ff88"/> },
                ].map(({ label, icon }) => (
                  <span key={label} className="about-pill">
                    <span className="pill-dot-svg">{icon}</span>
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div className="about-card">
              <div className="about-card-avatar">
                <img src={zadImg} alt="Zaldy Dagohoy" onError={(e) => { e.currentTarget.style.display='none'; }} />
                <div className="about-card-avatar-fallback" aria-hidden="true">ZD</div>
              </div>
              <h3>Zaldy Dagohoy</h3>
              <p className="about-card-role">product_designer · frontend_dev</p>
              <div className="about-card-info">
                <span><IconPin size={13} color="#00ff88"/> Davao City, PH</span>
                <span><IconGrad size={13} color="#00ff88"/> BTVTED-CP</span>
                <span><IconEmail size={13} color="#00ff88"/> zaldy.dagohoy.a@gmail.com</span>
              </div>
              <a href="mailto:zaldy.dagohoy.a@gmail.com" className="btn about-card-btn">
                hire_me() <IconSend size={13} color="currentColor"/>
              </a>
            </div>
          </div>
        </section>

        <div className="section-divider flipped" aria-hidden="true">
          <svg viewBox="0 0 1200 30" preserveAspectRatio="none">
            <path d="M0,15 Q300,30 600,15 T1200,15" stroke="rgba(0,255,136,0.1)" strokeWidth="1" fill="none"/>
          </svg>
        </div>

        {/* CERTIFICATES */}
        <section id="certificates" className="certificates-section">
          <div className="certificates-header">
            <span className="skills-kicker"><IconAward size={12} color="#00ff88"/> verified_credentials</span>
            <h2 className="section-title">certificates</h2>
            <p className="cert-subtitle">Click any certificate to view it full-screen.</p>
          </div>
          <div className="cert-collage" aria-label="Certificate collage">
            <span className="cert-chip cert-chip-1" aria-hidden="true"><IconAward size={12} color="#00ff88"/> Certified</span>
            <span className="cert-chip cert-chip-2" aria-hidden="true"><IconStar size={12} color="#ffb700"/> Verified</span>
            <span className="cert-chip cert-chip-3" aria-hidden="true"><i className="fas fa-medal"></i> Achieved</span>
            {certificateItems.map((cert, index) => (
              <div
                key={`cert-${index}`}
                className={`cert-card cert-card-${index + 1}`}
                onClick={() => openCertificate(cert)}
                role="button" tabIndex={0} aria-label={`View ${cert.title}`}
                onKeyDown={(e) => e.key === 'Enter' && openCertificate(cert)}
              >
                <div className="cert-card-img-wrap">
                  <img src={cert.image} alt={cert.title || `Certificate ${index + 1}`} />
                  <div className="cert-card-hover-overlay">
                    <i className="fas fa-expand-alt"></i>
                    <span>{cert.title}</span>
                  </div>
                </div>
                <div className="cert-card-label">
                  <span className="cert-card-num">0{index + 1}</span>
                  <span className="cert-card-title">{cert.title}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {selectedCertificate && (
          <div className="certificate-viewer" role="dialog" aria-modal="true">
            <div className="certificate-viewer-backdrop" onClick={closeCertificate} />
            <div className="certificate-viewer-content">
              <button className="certificate-viewer-close" onClick={closeCertificate} aria-label="Close">×</button>
              <img src={selectedCertificate.image} alt={selectedCertificate.title || 'Certificate'} />
              {selectedCertificate.title && <div className="certificate-viewer-title">{selectedCertificate.title}</div>}
            </div>
          </div>
        )}

        {viewerOpen && viewerFile && (
          <FileViewer file={viewerFile} onClose={closeFileViewer} />
        )}

        <div className="section-divider" aria-hidden="true">
          <svg viewBox="0 0 1200 30" preserveAspectRatio="none">
            <path d="M0,15 Q300,0 600,15 T1200,15" stroke="rgba(0,255,136,0.08)" strokeWidth="1" fill="none"/>
          </svg>
        </div>

        {/* FEATURED PROJECTS */}
        <section id="work" className="projects-section">
          <div className="projects-section-header">
            <span className="skills-kicker"><IconFolder size={12} color="#00ff88"/> portfolio</span>
            <h2 className="section-title">featured_projects</h2>
            <p className="projects-subtitle">Click a folder to explore work samples across design, research, and development.</p>
          </div>
          <div className="projects-grid">
            {folderConfig.map((fc) => (
              <div key={fc.category} className={`project-item${openFolder === fc.category ? ' folder-opening' : ''}`}>
                <span className={`project-badge ${fc.category === 'design' ? 'design-badge' : fc.category === 'research' ? 'research-badge' : 'dev-badge'}`}>{fc.category}</span>
                <FolderIcon color={fc.color} innerIcon={fc.innerIcon} isOpen={openFolder === fc.category} onClick={() => handleOpenFolder(fc.category)}/>
                <h3>{fc.label}</h3>
                <p>{fc.desc}</p>
                <div className="project-tags">
                  {fc.tags.map(t => <span key={t} className="tech-tag">{t}</span>)}
                </div>
                <div className="project-meta">
                  <span><IconLayers size={13} color="#00ff88"/> {folderAssets[fc.category].length} samples</span>
                  <span><IconClock size={13} color="#00ff88"/> 2024</span>
                </div>
                <div className="folder-hint">open samples</div>
              </div>
            ))}
          </div>
          <div className="process-strip">
            <h3 className="process-title">how_i_work()</h3>
            <div className="process-steps-animated">
              {processSteps.map((ps, i) => (
                <ProcessStep key={ps.step} step={ps.step} label={ps.label} desc={ps.desc} index={i} iconComponent={ps.iconComponent}/>
              ))}
            </div>
          </div>
        </section>

        {showProjectModal && selectedCategory && (
          <div className="project-modal-overlay" onClick={closeProjectModal}>
            <div className="project-modal" onClick={(e) => e.stopPropagation()}>
              <button className="project-modal-close" onClick={closeProjectModal} aria-label="Close">×</button>
              <h2 style={{ borderColor: categoryProjects[selectedCategory].color }}>
                {categoryProjects[selectedCategory].title}
              </h2>
              {categoryProjects[selectedCategory].items.length === 0 && (
                <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', padding: '1rem 0' }}>
                  // No files found in this folder yet.
                </p>
              )}
              <div className="project-sample-list">
                {categoryProjects[selectedCategory].items.map((project, idx) => (
                  <div
                    key={project.src}
                    className="project-sample-card"
                    style={{ '--card-color': categoryProjects[selectedCategory].color }}
                    role="button"
                    tabIndex={0}
                    onClick={() => openFileViewer(project)}
                    onKeyDown={(e) => { if (e.key === 'Enter') openFileViewer(project); }}
                  >
                    <span className="sample-num">0{idx + 1}</span>
                    <h3>{project.name}</h3>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', marginBottom: '0.5rem' }}>
                      {project.ext} · click to view
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <span className="sample-tech">
                        {project.type === 'image' ? 'Image sample' : 'Document sample'}
                      </span>
                      <span className="sample-view-only">
                        <IconLock size={11} color="currentColor"/> view only
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="btn close-modal-btn" onClick={closeProjectModal}>close()</button>
            </div>
          </div>
        )}

        {/* SKILLS */}
        <section className="skills-section" id="expertise">
          <div className="skills-header">
            <span className="skills-kicker">skill_stack</span>
            <h2 className="section-title">core_expertise</h2>
            <p>Drag the cube to spin it · click any face or chart row to inspect a skill.</p>
          </div>
          <SkillCube skills={skills} />
        </section>

        {/* TESTIMONIALS */}
        <section className="testimonials-section">
          <span className="skills-kicker"><IconQuote size={12} color="#00ff88"/> testimonials.json</span>
          <h2 className="section-title">what_people_say</h2>
          <div className="testimonials-grid">
            {[
              { name: 'Ana Reyes',   role: 'Product Manager, TechStart', text: 'Zaldy delivered a beautiful, well-structured interface under a tight deadline. His attention to detail and communication were exceptional.',          avatar: 'AR' },
              { name: 'Mark Santos', role: 'CTO, PixelForge',            text: "One of the best frontend experiences I've seen. Clean code, thoughtful design choices, and great responsiveness. Would hire again without hesitation.", avatar: 'MS' },
              { name: 'Lena Cruz',   role: 'UX Lead, DesignBloom',       text: 'Zaldy has a rare combination of design sensibility and engineering skill. He understands both pixels and people. Truly a full-package collaborator.',   avatar: 'LC' },
            ].map(({ name, role, text, avatar }) => (
              <div key={name} className="testimonial-card">
                <div className="testimonial-quote-icon"><IconQuote size={20} color="#00ff88"/></div>
                <p className="testimonial-text">{text}</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{avatar}</div>
                  <div><strong>{name}</strong><span>{role}</span></div>
                </div>
                <div className="testimonial-stars" aria-label="5 stars">{'★★★★★'.split('').map((s,i) => <span key={i}>{s}</span>)}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact-section" className="contact-section">
          <div className="contact-section-header">
            <span className="skills-kicker"><IconSend size={12} color="#00ff88"/> init_contact</span>
            <h2 className="section-title">lets_connect()</h2>
          </div>
          <div className="contact-wrapper">
            <div className="contact-info">
              <h3>Got a project in mind?</h3>
              <p>I'm currently open to freelance opportunities, collaborations, or just a friendly chat. Reach out and let's build something great.</p>
              <p className="contact-note">Comments are reviewed and approved by the website owner before being published.</p>
              <div className="direct-email">
                <IconEmail size={18} color="#00ff88"/>
                <a href="mailto:zaldy.dagohoy.a@gmail.com">zaldy.dagohoy.a@gmail.com</a>
              </div>
              <p className="location"><IconPin size={14} color="#00ff88"/> Davao City, Philippines</p>
              <div className="contact-chips">
                <a href="mailto:zaldy.dagohoy.a@gmail.com" className="contact-chip">
                  <IconEmail size={14} color="#00ff88"/> email
                </a>
                {SOCIAL_LINKS.linkedin && (
                  <a href={SOCIAL_LINKS.linkedin} className="contact-chip" target="_blank" rel="noopener noreferrer">
                    <IconLinkedin size={14} color="#00ff88"/> linkedin
                  </a>
                )}
                {SOCIAL_LINKS.github && (
                  <a href={SOCIAL_LINKS.github} className="contact-chip" target="_blank" rel="noopener noreferrer">
                    <IconGithub size={14} color="#00ff88"/> github
                  </a>
                )}
              </div>
            </div>
            <div className="contact-form">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="name" className="visually-hidden">Your name</label>
                  <input type="text" id="name" name="name" placeholder="// your_name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="email" className="visually-hidden">Email address</label>
                  <input type="email" id="email" name="email" placeholder="// email_address (optional)" value={formData.email} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label htmlFor="message" className="visually-hidden">Message</label>
                  <textarea id="message" name="message" rows="4" placeholder="// describe_your_project..." value={formData.message} onChange={handleChange} required></textarea>
                </div>
                <button type="submit" className="btn submit-btn" disabled={isSubmitting}>
                  {isSubmitting
                    ? <><IconSpinner size={15} color="currentColor"/> sending...</>
                    : <>send_message() <IconSend size={14} color="currentColor"/></>
                  }
                </button>
                {formStatus.message && (
                  <div className={`form-status ${formStatus.type}`}>{formStatus.message}</div>
                )}
              </form>
              <p className="privacy-note"><IconLock size={12} color="#00ff88"/> encrypted · no spam · reply within 24h</p>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer>
          <div className="footer-inner">
            <div className="footer-brand">
              <img src={logoImg} alt="Logo" className="footer-logo" onError={(e) => e.currentTarget.style.display='none'} />
              <span>zaldy_dagohoy</span>
            </div>
            <nav className="footer-nav" aria-label="Footer navigation">
              {['home','work','certificates','about','contact-section'].map(id => (
                <a key={id} href={`#${id}`} onClick={(e) => { e.preventDefault(); scrollToSection(id); }}>
                  {id.replace('-',' ').replace(/^\w/, c => c.toUpperCase())}
                </a>
              ))}
            </nav>
          </div>
          <p className="footer-copy">
            © {new Date().getFullYear()} Zaldy Dagohoy — built with <IconHeart size={12} color="#00ff88"/> for the creative community · <span style={{color:'var(--text-dim)'}}>$ exit 0</span>
          </p>
        </footer>
      </div>

      <button className="scroll-top" aria-label="Scroll to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <IconChevronUp size={16} color="#00ff88"/>
      </button>
    </div>
  );
};

export default HomePage;
