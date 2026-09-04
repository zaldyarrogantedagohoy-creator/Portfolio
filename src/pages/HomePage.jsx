import { useEffect, useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { supabase } from '../supabaseClient';
import '../styles/HomePage.css';

import logoImg  from '../assets/images/logo.png';
import zadImg   from '../assets/images/zad.png';
import heroVid  from '../assets/Videos/Hero_Vid.mp4';
import pikachuVid from '../assets/Videos/Pikachu.mp4';
import serviceBgVid from '../assets/Videos/Service-bg.mp4';
import researchVid from '../assets/Videos/research.mp4';
import microsoftVid from '../assets/Videos/microsoft.mp4';
import videoEditingVid from '../assets/Videos/video-editing.mp4';
import webDesignVid from '../assets/Videos/web-design.mp4';
import certificate1Img from '../assets/images/certificate-1.png';
import certificate2Img from '../assets/images/certificate-2.png';
import certificate3Img from '../assets/images/certificate-3.png';
import certificate4Img from '../assets/images/certificate-4.png';
import certificate5Img from '../assets/images/certificate-5.png';

const SOCIAL_LINKS = {
  github:   'https://github.com/zaldyarrogantedagohoy-creator',
  linkedin: 'https://www.linkedin.com/in/zaldy-dagohoy-73a5a5415/?skipRedirect=true',
  twitter:  'https://x.com/zaldydagohoy',
  dribbble: 'https://dribbble.com/zaldy-dagohoy',
};
const ADMIN_SESSION_KEY = 'portfolio-admin-authenticated';
const ADMIN_OTP_EMAIL_ENDPOINT = '/api/send-admin-otp-email';
const REVIEW_SETUP_MESSAGE = 'ERROR: Review table missing. Run supabase/site_reviews.sql in Supabase SQL Editor, then reload the app.';
const PDF_PREVIEW_PAGE_LIMIT = 2;
const PDF_ACCESS_FORM_INITIAL = {
  fullName: '',
  email: '',
  phone: '',
  reason: '',
};

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const isMissingReviewTableError = (error) => {
  const message = error?.message || '';
  return error?.code === '42P01' || error?.code === 'PGRST205' || /site_reviews|schema cache|Could not find the table/i.test(message);
};
const isMissingContactPhoneError = (error) => {
  const message = error?.message || '';
  return /phone|schema cache|Could not find/i.test(message);
};
const assetFilename = (path) => path.replace(/^.*[\\/]/, '').replace(/\.(png|jpe?g|pdf)$/i, '');
const assetType = (path) => {
  const ext = path.split('.').pop().toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (['png','jpg','jpeg'].includes(ext)) return 'image';
  return 'file';
};
// Add a description for each project here, keyed by its filename (without extension).
// The key must match the file name exactly (case-insensitive).
const PROJECT_DESCRIPTIONS = {
  '_braille connect_ a mobile application for visually impaired students': 'The Braille Connect Application is a technology-based research project developed as a prerequisite requirement for an undergraduate degree. The project was collaboratively developed by Neil Francis T. Arnaiz and Zaldy A. Dagohoy, who combined their respective expertise and skills in research, technology, and application development to conceptualize and develop the system. The project aims to demonstrate how technology can be utilized to address accessibility needs and provide innovative solutions for individuals with visual impairments.',
  // 'another-file-name': 'Its description...',
};

const getProjectDescription = (name) =>
  PROJECT_DESCRIPTIONS[name.trim().toLowerCase()] || '\n\nThe Braille Connect Application is a technology-based research project developed as a prerequisite requirement for an undergraduate degree. The project was collaboratively developed by Neil Francis T. Arnaiz and Zaldy A. Dagohoy, who combined their respective expertise and skills in research, technology, and application development to conceptualize and develop the system.\n\nThe project aims to demonstrate how technology can be utilized to address accessibility needs and provide innovative solutions for individuals with visual impairments.';

const getInitials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'VR';

const buildAssets = (entries) =>
  Object.entries(entries)
    .filter(([path]) => /\.(png|jpe?g|pdf)$/i.test(path))
    .filter(([path]) => !/rotc_logo/i.test(path))
    .map(([path, src]) => {
      const name = assetFilename(path);
      return {
        src,
        name,
        type: assetType(path),
        ext: path.split('.').pop().toUpperCase(),
        description: getProjectDescription(name),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

const designAssets     = buildAssets(import.meta.glob('../assets/Design/*.{png,jpg,jpeg,pdf}',       { eager: true, query: '?url', import: 'default' }));
const researchAssets   = buildAssets(import.meta.glob('../assets/Research/*.{png,jpg,jpeg,pdf}',     { eager: true, query: '?url', import: 'default' }));
const developmentAssets= buildAssets(import.meta.glob('../assets/Development/*.{png,jpg,jpeg,pdf}',  { eager: true, query: '?url', import: 'default' }));
const folderAssets = { design: designAssets, research: researchAssets, development: developmentAssets };

const fallbackCertificates = [
  { id: 'certificate-1', title: 'Certificate 1', image_url: certificate1Img },
  { id: 'certificate-2', title: 'Certificate 2', image_url: certificate2Img },
  { id: 'certificate-3', title: 'Certificate 3', image_url: certificate3Img },
  { id: 'certificate-4', title: 'Certificate 4', image_url: certificate4Img },
  { id: 'certificate-5', title: 'Certificate 5', image_url: certificate5Img },
];

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

const IconPython = ({ size = 20, color = '#00ff88' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M8 3h7a3 3 0 013 3v4H9a3 3 0 00-3 3v1H3V8a5 5 0 015-5z" stroke={color} strokeWidth="1.2" fill={color} fillOpacity="0.1" strokeLinejoin="round"/>
    <path d="M16 21H9a3 3 0 01-3-3v-4h9a3 3 0 003-3v-1h3v6a5 5 0 01-5 5z" stroke={color} strokeWidth="1.2" fill={color} fillOpacity="0.14" strokeLinejoin="round"/>
    <circle cx="9" cy="6.5" r="0.9" fill={color}/>
    <circle cx="15" cy="17.5" r="0.9" fill={color}/>
  </svg>
);

const IconNode = ({ size = 20, color = '#00ff88' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" stroke={color} strokeWidth="1" fill={color} fillOpacity="0.1"/>
    <path d="M12 2l9 5-9 5-9-5 9-5z" stroke={color} strokeWidth="1" fill={color} fillOpacity="0.2"/>
    <line x1="12" y1="12" x2="12" y2="22" stroke={color} strokeWidth="1" opacity="0.6"/>
  </svg>
);

const IconSupabase = ({ size = 20, color = '#00ff88' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M13.5 2.8L5.2 13.1c-.7.9-.1 2.2 1 2.2h5.4l-1 5.9c-.2 1.1 1.2 1.7 1.9.8l8.3-10.3c.7-.9.1-2.2-1-2.2h-5.4l1-5.9c.2-1.1-1.2-1.7-1.9-.8z" stroke={color} strokeWidth="1.2" fill={color} fillOpacity="0.12" strokeLinejoin="round"/>
    <path d="M6 15.3h5.6L10.7 21M18 9.5h-5.6l.9-6" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.7"/>
  </svg>
);

const IconRust = ({ size = 20, color = '#00ff88' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="6.5" stroke={color} strokeWidth="1.2" fill={color} fillOpacity="0.08"/>
    <path d="M12 2.8v2.1M12 19.1v2.1M2.8 12h2.1M19.1 12h2.1M5.5 5.5L7 7M17 17l1.5 1.5M18.5 5.5L17 7M7 17l-1.5 1.5" stroke={color} strokeWidth="1.1" strokeLinecap="round"/>
    <text x="7.1" y="15.5" fontFamily="monospace" fontWeight="800" fontSize="8.5" fill={color}>Rs</text>
  </svg>
);

const IconRender = ({ size = 20, color = '#00ff88' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="1.2" fill={color} fillOpacity="0.08"/>
    <path d="M7 8h5.5a3 3 0 010 6H7V8z" stroke={color} strokeWidth="1.2" fill={color} fillOpacity="0.08" strokeLinejoin="round"/>
    <path d="M12.5 14l4 4M7 18V8" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
    <circle cx="16.5" cy="8.5" r="1" fill={color}/>
  </svg>
);

const IconVercel = ({ size = 20, color = '#00ff88' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 4L22 20H2L12 4z" stroke={color} strokeWidth="1.2" fill={color} fillOpacity="0.14" strokeLinejoin="round"/>
    <path d="M12 8.4L18 18H6L12 8.4z" stroke={color} strokeWidth="0.9" opacity="0.55" strokeLinejoin="round"/>
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

const IconUnlock = ({ size = 13, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.1"/>
    <path d="M8 11V7a5 5 0 019.5-2.2" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
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

const IconChevronLeft = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <polyline points="15,18 9,12 15,6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconChevronRight = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <polyline points="9,18 15,12 9,6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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

const IconPlay = ({ size = 48, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.2" fill={color} fillOpacity="0.1"/>
    <polygon points="10,8 17,12 10,16" fill={color} opacity="0.9"/>
  </svg>
);

// Service icons with neon style
const IconResearch = ({ size = 32, color = '#00ff88' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="8" cy="8" r="4" stroke={color} strokeWidth="1.2" fill={color} fillOpacity="0.1"/>
    <path d="M12 8h6M12 12h5M12 16h4" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M3 6h4v10H3zM18 6h3v10h-3z" stroke={color} strokeWidth="1.2" fill={color} fillOpacity="0.08"/>
    <line x1="5" y1="20" x2="19" y2="20" stroke={color} strokeWidth="1.2"/>
  </svg>
);

const IconOffice = ({ size = 32, color = '#00e5ff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="1.2" fill={color} fillOpacity="0.08"/>
    <path d="M3 8h18M8 3v18" stroke={color} strokeWidth="1.2"/>
    <rect x="9" y="9" width="3" height="3" fill={color} fillOpacity="0.3"/>
    <rect x="13" y="9" width="3" height="3" stroke={color} strokeWidth="1" fill="none"/>
    <rect x="9" y="13" width="3" height="3" stroke={color} strokeWidth="1" fill="none"/>
    <rect x="13" y="13" width="3" height="3" stroke={color} strokeWidth="1" fill="none"/>
  </svg>
);

const IconVideo = ({ size = 32, color = '#ffb700' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="2" stroke={color} strokeWidth="1.2" fill={color} fillOpacity="0.08"/>
    <polygon points="10,10 10,18 17,14" fill={color} fillOpacity="0.4" stroke={color} strokeWidth="1"/>
    <circle cx="18" cy="8" r="2" fill={color} fillOpacity="0.5"/>
  </svg>
);

const IconWebDev = ({ size = 32, color = '#b464ff' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="2" stroke={color} strokeWidth="1.2" fill={color} fillOpacity="0.08"/>
    <polyline points="2,8 22,8" stroke={color} strokeWidth="1.2"/>
    <circle cx="6" cy="6" r="1" fill={color}/>
    <circle cx="10" cy="6" r="1" fill={color}/>
    <circle cx="14" cy="6" r="1" fill={color}/>
    <polyline points="4,11 8,15 12,11 16,15 20,11" stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
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
  const [activeFace, setActiveFace] = useState(0);
  const levelMap = { Advanced: 92, Strong: 78, Intermediate: 60 };
  const sliderColors = ['#00ff88', '#00e5ff', '#ffb700', '#00ff88', '#b464ff', '#00e5ff'];

  const faceIcons2D = [
    <IconReact size={42} color={sliderColors[0]} key="react" />,
    <IconJS size={42} color={sliderColors[1]} key="js" />,
    <IconPalette size={42} color={sliderColors[2]} key="palette" />,
    <IconMobile size={42} color={sliderColors[3]} key="mobile" />,
    <IconDatabase size={42} color={sliderColors[4]} key="database" />,
    <IconCode size={42} color={sliderColors[5]} key="code" />,
  ];

  return (
    <div className="cube-universe">
      <div className="slider-stage">
        <div className="slider-hint">slide through icons · click any dot to inspect a skill</div>
        <div className="slider-card" style={{ '--skill-color': sliderColors[activeFace] }}>
          <div className="slider-icon">
            <div className="icon-scene slider-icon-scene">
              <div className="orbit-ring"><span className="orbit-dot"></span></div>
              <div className="ripple"></div>
              <div className="icon-3d">{faceIcons2D[activeFace]}</div>
              <div className="floor-glow"></div>
            </div>
          </div>
        </div>
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
              <IconReact size={14} color={colors[0]} key="react" />,
              <IconJS size={14} color={colors[1]} key="js" />,
              <IconPalette size={14} color={colors[2]} key="palette" />,
              <IconMobile size={14} color={colors[3]} key="mobile" />,
              <IconDatabase size={14} color={colors[4]} key="database" />,
              <IconCode size={14} color={colors[5]} key="code" />,
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
          {skills.map((_, i) => (
            <button key={i} className={`cube-dot${activeFace === i ? ' active' : ''}`} onClick={() => setActiveFace(i)} aria-label={`Skill ${i + 1}`}></button>
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

const PdfCanvasPage = ({ pdfDocument, pageNumber, fileName, showAccessPrompt, onRequestAccess, pdfRequesting, pdfRequestStatus }) => {
  const frameRef = useRef(null);
  const canvasRef = useRef(null);
  const [frameWidth, setFrameWidth] = useState(0);
  const [renderStatus, setRenderStatus] = useState({ type: 'loading', message: '' });

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;

    const updateFrameWidth = () => {
      const nextWidth = Math.floor(frame.clientWidth || 0);
      setFrameWidth((currentWidth) => (
        Math.abs(currentWidth - nextWidth) > 1 ? nextWidth : currentWidth
      ));
    };

    updateFrameWidth();

    if (typeof ResizeObserver === 'undefined') return undefined;

    const observer = new ResizeObserver(updateFrameWidth);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!pdfDocument || !canvasRef.current || frameWidth <= 0) return undefined;

    let cancelled = false;
    let renderTask = null;

    const renderPage = async () => {
      setRenderStatus({ type: 'loading', message: '' });

      try {
        const page = await pdfDocument.getPage(pageNumber);
        if (cancelled) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const availableWidth = Math.max(240, frameWidth - 32);
        const displayScale = Math.min(Math.max(availableWidth / baseViewport.width, 0.55), 1.7);
        const viewport = page.getViewport({ scale: displayScale });
        const outputScale = Math.min(window.devicePixelRatio || 1, 2);
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d', { alpha: false });

        if (!context) throw new Error('Canvas rendering is not supported in this browser.');

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, canvas.width, canvas.height);

        renderTask = page.render({
          canvasContext: context,
          viewport,
          transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null,
          background: 'white',
        });

        await renderTask.promise;
        page.cleanup();

        if (!cancelled) setRenderStatus({ type: 'ready', message: '' });
      } catch (error) {
        if (cancelled || error?.name === 'RenderingCancelledException') return;
        setRenderStatus({
          type: 'error',
          message: error?.message || 'Could not render this PDF page.',
        });
      }
    };

    renderPage();

    return () => {
      cancelled = true;
      if (renderTask) renderTask.cancel();
    };
  }, [pdfDocument, pageNumber, frameWidth]);

  return (
    <div
      ref={frameRef}
      className={`pdf-page-preview pdf-page-preview-${renderStatus.type}`}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className="pdf-page-label">page_0{pageNumber}</span>
      {renderStatus.type === 'loading' && (
        <div className="pdf-page-render-status">
          <IconSpinner size={16} color="currentColor" />
          rendering_page()
        </div>
      )}
      {renderStatus.type === 'error' && (
        <div className="pdf-page-render-status pdf-page-render-status-error">
          page_render_failed
          <span>{renderStatus.message}</span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="pdf-page-canvas"
        aria-label={`${fileName || 'PDF document'} page ${pageNumber}`}
        onContextMenu={(e) => e.preventDefault()}
      />
      {showAccessPrompt && (
        <div className="pdf-page-access-overlay" aria-hidden="true">
          <div className="pdf-page-access-veil" />
          <div className="pdf-page-access-prompt">
            <button
              type="button"
              className="pdf-unlock-request-btn"
              onClick={onRequestAccess}
              disabled={pdfRequesting}
              aria-label="Request full PDF access"
            >
              <IconUnlock size={16} color="currentColor"/>
              request_access()
            </button>
            {pdfRequestStatus.message && (
              <div className={`pdf-request-status ${pdfRequestStatus.type}`}>{pdfRequestStatus.message}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const FileViewer = ({ file, onClose }) => {
  const [pdfRequestStatus, setPdfRequestStatus] = useState({ type: '', message: '' });
  const [pdfRequesting, setPdfRequesting] = useState(false);
  const [pdfAccessModalOpen, setPdfAccessModalOpen] = useState(false);
  const [pdfAccessForm, setPdfAccessForm] = useState(PDF_ACCESS_FORM_INITIAL);
  const [pdfDocument, setPdfDocument] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState('');

  useEffect(() => {
    const blockSave = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); }
    };
    window.addEventListener('keydown', blockSave);
    return () => window.removeEventListener('keydown', blockSave);
  }, []);

  useEffect(() => {
    setPdfRequestStatus({ type: '', message: '' });
    setPdfAccessModalOpen(false);
    setPdfAccessForm(PDF_ACCESS_FORM_INITIAL);

    if (!file || file.type !== 'pdf') {
      setPdfDocument(null);
      setPdfLoading(false);
      setPdfError('');
      return undefined;
    }

    let active = true;
    const loadingTask = pdfjsLib.getDocument({ url: file.src });

    setPdfDocument(null);
    setPdfLoading(true);
    setPdfError('');

    loadingTask.promise
      .then((documentProxy) => {
        if (!active) {
          documentProxy.destroy();
          return;
        }

        setPdfDocument(documentProxy);
        setPdfLoading(false);
      })
      .catch((error) => {
        if (!active) return;
        setPdfError(error?.message || 'Unable to load this PDF file.');
        setPdfLoading(false);
      });

    return () => {
      active = false;
      loadingTask.destroy();
    };
  }, [file]);

  if (!file) return null;

  const previewPageCount = pdfDocument
    ? Math.min(pdfDocument.numPages, PDF_PREVIEW_PAGE_LIMIT)
    : 0;
  const hasLockedPdfPages = Boolean(pdfDocument && pdfDocument.numPages > previewPageCount);

  const openPdfAccessModal = () => {
    setPdfRequestStatus({ type: '', message: '' });
    setPdfAccessModalOpen(true);
  };

  const closePdfAccessModal = () => {
    if (pdfRequesting) return;
    setPdfAccessModalOpen(false);
  };

  const handlePdfAccessFormChange = (event) => {
    const { name, value } = event.target;
    setPdfAccessForm((currentForm) => ({ ...currentForm, [name]: value }));
    if (pdfRequestStatus.message) setPdfRequestStatus({ type: '', message: '' });
  };

  const handlePdfAccessRequest = async (event) => {
    event.preventDefault();

    if (!supabase) {
      setPdfRequestStatus({ type: 'error', message: 'ERROR: Supabase is not configured.' });
      return;
    }

    const payload = {
      requester_name: pdfAccessForm.fullName.trim(),
      requester_email: pdfAccessForm.email.trim(),
      requester_phone: pdfAccessForm.phone.trim(),
      request_reason: pdfAccessForm.reason.trim(),
      file_name: file.name,
      file_url: file.src,
      file_type: file.ext || 'PDF',
      status: 'pending',
    };

    if (
      payload.requester_name.length < 2 ||
      payload.requester_email.length < 5 ||
      payload.requester_phone.length < 5 ||
      payload.request_reason.length < 10
    ) {
      setPdfRequestStatus({ type: 'error', message: 'ERROR: Please complete all fields before submitting.' });
      return;
    }

    setPdfRequesting(true);
    setPdfRequestStatus({ type: '', message: 'Sending request...' });

    const { error } = await supabase.from('pdf_access_requests').insert([payload]);

    if (error) {
      setPdfRequestStatus({
        type: 'error',
        message: /pdf_access_requests|schema cache|Could not find/i.test(error.message || '')
          ? 'ERROR: Request table missing. Run supabase/pdf_access_requests.sql in Supabase SQL Editor.'
          : `ERROR: ${error.message}`,
      });
    } else {
      setPdfRequestStatus({ type: 'success', message: 'SUCCESS: Access request sent to admin.' });
      setPdfAccessForm(PDF_ACCESS_FORM_INITIAL);
      setPdfAccessModalOpen(false);
    }

    setPdfRequesting(false);
  };

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

        <div className="file-viewer-body">
          <div className="file-viewer-preview">
            {file.type === 'image' && (
              <div className="file-viewer-image-wrap" onContextMenu={(e) => e.preventDefault()}>
                <img
                  className="file-viewer-image"
                  src={file.src}
                  alt={file.name || 'Image sample'}
                  onDragStart={(e) => e.preventDefault()}
                  onContextMenu={(e) => e.preventDefault()}
                />
              </div>
            )}
            {file.type === 'pdf' && (
              <div className="file-viewer-pdf-wrap">
                {pdfLoading && (
                  <div className="pdf-loading-state">
                    <IconSpinner size={18} color="currentColor" />
                    loading_pdf_preview()
                  </div>
                )}
                {pdfError && (
                  <div className="pdf-error-state">
                    pdf_preview_failed
                    <span>{pdfError}</span>
                  </div>
                )}
                {pdfDocument && Array.from({ length: previewPageCount }, (_, index) => {
                  const page = index + 1;
                  const showAccessPrompt = hasLockedPdfPages && page === previewPageCount && page >= 2;
                  return (
                    <PdfCanvasPage
                      key={`${file.src}-page-${page}`}
                      pdfDocument={pdfDocument}
                      pageNumber={page}
                      fileName={file.name}
                      showAccessPrompt={showAccessPrompt}
                      onRequestAccess={openPdfAccessModal}
                      pdfRequesting={pdfRequesting}
                      pdfRequestStatus={pdfRequestStatus}
                    />
                  );
                })}
              </div>
            )}
          </div>

          <div className="file-viewer-description">
            <span className="fvd-kicker">$ cat description.md</span>
            <h3 className="fvd-title">{file.name}</h3>
            <span className="fvd-badge">
              {file.ext} · {file.type === 'image' ? 'Image sample' : file.type === 'pdf' ? 'PDF sample' : 'Document sample'}
            </span>
            <p className="fvd-text">{file.description}</p>
          </div>
        </div>
      </div>
      {pdfAccessModalOpen && (
        <div
          className="pdf-access-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pdf-access-modal-title"
          onClick={closePdfAccessModal}
        >
          <div className="pdf-access-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="admin-login-close"
              type="button"
              onClick={closePdfAccessModal}
              aria-label="Close access request form"
              disabled={pdfRequesting}
            >
              x
            </button>
            <span className="admin-login-kicker">
              <IconUnlock size={12} color="#00ff88"/> pdf_access_request
            </span>
            <h2 id="pdf-access-modal-title">request_access</h2>
            <div className="pdf-access-file-chip">{file.name}</div>
            <form onSubmit={handlePdfAccessRequest}>
              <div className="form-group">
                <label htmlFor="pdf-request-full-name" className="visually-hidden">Full name</label>
                <input
                  type="text"
                  id="pdf-request-full-name"
                  name="fullName"
                  placeholder="// full_name"
                  value={pdfAccessForm.fullName}
                  onChange={handlePdfAccessFormChange}
                  autoComplete="name"
                  minLength="2"
                  maxLength="120"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="pdf-request-email" className="visually-hidden">Email address</label>
                <input
                  type="email"
                  id="pdf-request-email"
                  name="email"
                  placeholder="// email_address"
                  value={pdfAccessForm.email}
                  onChange={handlePdfAccessFormChange}
                  autoComplete="email"
                  maxLength="180"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="pdf-request-phone" className="visually-hidden">Phone number</label>
                <input
                  type="tel"
                  id="pdf-request-phone"
                  name="phone"
                  placeholder="// phone_number"
                  value={pdfAccessForm.phone}
                  onChange={handlePdfAccessFormChange}
                  autoComplete="tel"
                  minLength="5"
                  maxLength="40"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="pdf-request-reason" className="visually-hidden">Reason for access</label>
                <textarea
                  id="pdf-request-reason"
                  name="reason"
                  rows="4"
                  placeholder="// reason_for_access"
                  value={pdfAccessForm.reason}
                  onChange={handlePdfAccessFormChange}
                  minLength="10"
                  maxLength="1000"
                  required
                />
              </div>
              <button type="submit" className="btn submit-btn" disabled={pdfRequesting}>
                {pdfRequesting
                  ? <><IconSpinner size={15} color="currentColor"/> sending_request()</>
                  : <>send_request() <IconUnlock size={13} color="currentColor"/></>
                }
              </button>
              {pdfRequestStatus.message && (
                <div className={`pdf-request-status ${pdfRequestStatus.type}`}>{pdfRequestStatus.message}</div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   HERO SLIDESHOW COMPONENT
══════════════════════════════════════════════════════════════ */
const HeroSlideshow = ({ children, scrollToSection, socialItems, stackIcons }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState('next');
  const [selectedService, setSelectedService] = useState(null);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const autoRef = useRef(null);
  const TOTAL_SLIDES = 3;

  const closeSelectedService = () => {
    if (!selectedService || isModalClosing) return;
    setIsModalClosing(true);
  };

  const servicePricing = [
    {
      id: 'research',
      title: 'Technological Research Services',
      description: 'Research-backed strategy and analysis for modern digital and tech initiatives.',
      pricing: [
        { label: 'Chapter 1 & 3', peso: '₱600 – ₱1,500+', usd: 'Not available' },
        { label: 'Chapter 2', peso: 'Not available', usd: 'Not available' },
        { label: 'Chapter 4 & 5', peso: 'Not available', usd: 'Not available' },
      ],
      note: 'Best for research planning, feasibility studies, and tech advisory work.',
    },
    {
      id: 'office',
      title: 'Microsoft Office License Activation',
      description: 'Setup and activation support for office productivity tools for personal or business use.',
      pricing: [
        { label: '180 Days', peso: '₱500+', usd: 'Not available' },
        { label: 'Lifetime', peso: '₱1,000+', usd: 'Not available' },
      ],
      note: 'Ideal for installation, activation, and productivity setup support.',
    },
    {
      id: 'video',
      title: 'Video Editor',
      description: 'Editing, motion graphics, and polished post-production for business or personal content.',
      pricing: [
        { label: '1-15 minutes video', peso: 'Not available', usd: 'Not available' },
        { label: '15-30 minutes video', peso: 'Not available', usd: 'Not available' },
        { label: '30-60+ minutes video', peso: 'Not available', usd: 'Not available' },
      ],
      note: 'Suitable for promo videos, reels, tutorials, and social media content.',
    },
    {
      id: 'web',
      title: 'Web & Landing Page Development',
      description: 'Responsive web design and landing pages built to convert and represent your brand.',
      pricing: [
        { label: 'Landing Page', peso: '₱10,000+', usd: '$5,000+' },
        { label: 'Business and Coorporate Websites', peso: '₱30,000+', usd: '$10,000+' },
        { label: 'E-commerce Websites', peso: 'Not available', usd: 'Not available' },
      ],
      note: 'Great for modern business websites, product pages, and landing pages.',
    },
  ];

  const goTo = (index, dir = 'next') => {
    if (isTransitioning || index === activeSlide) return;
    setDirection(dir);
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveSlide(index);
      setIsTransitioning(false);
    }, 400);
  };

  const prev = () => goTo((activeSlide - 1 + TOTAL_SLIDES) % TOTAL_SLIDES, 'prev');
  const next = () => goTo((activeSlide + 1) % TOTAL_SLIDES, 'next');

  useEffect(() => {
    autoRef.current = setInterval(() => {
      setDirection('next');
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveSlide(prev => (prev + 1) % TOTAL_SLIDES);
        setIsTransitioning(false);
      }, 400);
    }, 30000);
    return () => clearInterval(autoRef.current);
  }, []);

  const resetAuto = () => {
    clearInterval(autoRef.current);
    autoRef.current = setInterval(() => {
      setDirection('next');
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveSlide(prev => (prev + 1) % TOTAL_SLIDES);
        setIsTransitioning(false);
      }, 400);
    }, 30000);
  };

  const videoRef = useRef(null);

  const handlePrev = () => { prev(); resetAuto(); };
  const handleNext = () => { next(); resetAuto(); };
  const handleDot  = (i) => { goTo(i, i > activeSlide ? 'next' : 'prev'); resetAuto(); };

  useEffect(() => {
    if (activeSlide === 2 && videoRef.current) {
      const video = videoRef.current;
      video.play().catch(() => {
        // autoplay may fail on some browsers; muted is required for autoplay
      });
    }
  }, [activeSlide]);

  const slideLabels = ['01 · intro', '02 · reel', '03 · services'];

  return (
    <section id="home" className="hero-section">
      <div className="hero-slideshow">

        {/* SLIDE TRACK */}
        <div
          className={`hero-slide-track ${isTransitioning ? `slide-exit-${direction}` : 'slide-enter'}`}
          aria-live="polite"
        >
          {/* ── SLIDE 1: Original hero ── */}
          {activeSlide === 0 && (
            <div className="hero-slide slide-main">
              <div className="hero">
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
                  <div className="hero-name">
                    <span className="hero-name-text">Zaldy Arrogante Dagohoy</span>
                  </div>
                </div>
                <div className="hero-content">
                  <span className="hero-badge">
                    <IconCode size={13} color="#00ff88"/> full_stack_developer
                  </span>
                  <h1>Building complete web <span className="hero-highlight">systems</span> that matter</h1>
                  <p className="hero-desc">
                    I'm Zaldy, a full stack developer who designs polished interfaces, builds reliable application logic, and connects products to real data.
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
                    <span className="stack-label">stacks</span>
                    {stackIcons.map((s, i) => (
                      <span key={i} className="stack-icon" title={s.title}>
                        <HexBg />
                        <span className="stack-icon-inner">
                          {s.comp}
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
            </div>
          )}

          {/* ── SLIDE 3: Hero video ── */}
          {activeSlide === 2 && (
            <div className="hero-slide slide-video">
              <div className="hero-video-wrap">
                <video
                  ref={videoRef}
                  key="hero-video"
                  src={heroVid}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  className="hero-video"
                />
                <div className="hero-video-overlay">
                  <div className="hero-video-overlay-inner">
                    <span className="hero-video-kicker">
                      <span className="rec-dot"></span> showreel_2024.mp4
                    </span>
                    <h2 className="hero-video-title">See the work<br/><span className="hero-highlight">in motion</span></h2>
                    <p className="hero-video-sub">A look inside the process — from wireframes to polished product.</p>
                    <button className="btn" onClick={() => scrollToSection('work')}>
                      ./explore_projects <IconArrow size={14} color="currentColor"/>
                    </button>
                  </div>
                </div>
                {/* scan-line effect on video */}
                <div className="hero-video-scanlines" aria-hidden="true"></div>
                {/* corner brackets */}
                <span className="vid-corner vid-tl" aria-hidden="true"></span>
                <span className="vid-corner vid-tr" aria-hidden="true"></span>
                <span className="vid-corner vid-bl" aria-hidden="true"></span>
                <span className="vid-corner vid-br" aria-hidden="true"></span>
              </div>
            </div>
          )}

          {/* ── SLIDE 2: Services offered ── */}
          {activeSlide === 1 && (
            <div className="hero-slide slide-services">
              <div className="services-inner">
                <video
                  className="services-bg-video"
                  src={serviceBgVid}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                />
                <div className="services-content">
                  <span className="services-kicker">$ services_offered</span>
                  <h2 className="services-title">
                    current <span className="hero-highlight">expertise</span>
                  </h2>
                  <p className="services-sub">Solutions I provide to help your business thrive</p>
                  
                  <div className="services-grid">
                    {servicePricing.map((service, index) => (
                      <div
                        key={service.id}
                        className={`service-card service-card-${service.id}`}
                        onClick={() => setSelectedService(service)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setSelectedService(service);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label={`View pricing for ${service.title}`}
                      >
                        <video
                          className="service-card-video-bg"
                          src={[
                            researchVid,
                            microsoftVid,
                            videoEditingVid,
                            webDesignVid,
                          ][index]}
                          autoPlay
                          muted
                          loop
                          playsInline
                          preload="auto"
                        />
                        <div className="service-card-back-content">
                          <h3 className={`service-card-${service.id}-title`}>{service.title}</h3>
                          <p className={`service-card-${service.id}-description`}>{service.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="services-more-soon">More services offered soon</p>

                  {selectedService && (
                    <div
                      className={`service-price-modal-overlay ${isModalClosing ? 'is-closing' : 'is-open'}`}
                      onClick={closeSelectedService}
                      onAnimationEnd={(event) => {
                        if (isModalClosing && event.animationName === 'modal-overlay-out') {
                          setSelectedService(null);
                          setIsModalClosing(false);
                        }
                      }}
                    >
                      <div
                        className={`service-price-modal ${isModalClosing ? 'is-closing' : 'is-open'}`}
                        onClick={(event) => event.stopPropagation()}
                        onAnimationEnd={(event) => {
                          if (isModalClosing && event.animationName === 'tv-power-off') {
                            setSelectedService(null);
                            setIsModalClosing(false);
                          }
                        }}
                      >
                        <button
                          type="button"
                          className="service-price-close"
                          onClick={closeSelectedService}
                          aria-label="Close pricing"
                        >
                          ×
                        </button>
                        <p className="service-price-kicker">Service Pricing</p>
                        <h3>{selectedService.title}</h3>
                        <p className="service-price-summary">{selectedService.note}</p>

                        <div className="service-price-columns">
                          <div className="service-price-region">
                            <span className="service-price-region-label">PH based price</span>
                            <div className="service-price-grid service-price-grid-local">
                              {selectedService.pricing.map((tier) => (
                                <div className="service-price-box" key={`${selectedService.id}-${tier.label}-ph`}>
                                  <span className="service-price-label">{tier.label}</span>
                                  <strong>{tier.peso}</strong>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="service-price-region">
                            <span className="service-price-region-label">US / other country price</span>
                            <div className="service-price-grid service-price-grid-foreign">
                              {selectedService.pricing.map((tier) => (
                                <div className="service-price-box" key={`${selectedService.id}-${tier.label}-usd`}>
                                  <span className="service-price-label">{tier.label}</span>
                                  <strong>{tier.usd}</strong>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <p className="service-price-rate">Estimated exchange rate: ₱62.64 = $1</p>
                      </div>
                    </div>
                  )}

                  <div className="services-cta">
                    <button className="btn" onClick={() => scrollToSection('contact-section')}>
                      Get in touch <IconArrow size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── NAV ARROWS ── */}
        <button className="hero-arrow hero-arrow-prev" onClick={handlePrev} aria-label="Previous slide">
          <IconChevronLeft size={22} color="#00ff88"/>
        </button>
        <button className="hero-arrow hero-arrow-next" onClick={handleNext} aria-label="Next slide">
          <IconChevronRight size={22} color="#00ff88"/>
        </button>

        {/* ── DOTS / SLIDE LABELS ── */}
        <div className="hero-slide-nav">
          {slideLabels.map((label, i) => (
            <button
              key={i}
              className={`hero-slide-dot${activeSlide === i ? ' active' : ''}`}
              onClick={() => handleDot(i)}
              aria-label={`Slide ${i + 1}: ${label}`}
            >
              <span className="slide-dot-line"></span>
              <span className="slide-dot-label">{label}</span>
            </button>
          ))}
        </div>

        {/* ── SLIDE COUNTER ── */}
        <div className="hero-slide-counter" aria-hidden="true">
          <span className="slide-current">0{activeSlide + 1}</span>
          <span className="slide-sep">/</span>
          <span className="slide-total">0{TOTAL_SLIDES}</span>
        </div>

      </div>
    </section>
  );
};

const HomePage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState({ type: '', message: '' });
  const [openFolder, setOpenFolder] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [countersVisible, setCountersVisible] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [certificates, setCertificates] = useState(fallbackCertificates);
  const [certificatesLoading, setCertificatesLoading] = useState(false);
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

  const projectsCount = useCounter(5,    1800, countersVisible);
  const clientsCount  = useCounter(10,   1800, countersVisible);
  const yearsCount    = useCounter(1,    1200, countersVisible);
  const coffeeCount   = useCounter(954, 2200, countersVisible);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setCountersVisible(true); }, { threshold: 0.3 });
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchCertificates = async () => {
      setCertificatesLoading(true);

      if (!supabase) {
        setCertificates(fallbackCertificates);
        setCertificatesLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('certificates')
          .select('*')
          .order('display_order', { ascending: true });

        if (error) {
          console.error('Error fetching certificates:', error);
          setCertificates(fallbackCertificates);
        } else {
          setCertificates((data && data.length > 0) ? data : fallbackCertificates);
        }
      } catch (err) {
        console.error('Unexpected error fetching certificates:', err);
        setCertificates(fallbackCertificates);
      } finally {
        setCertificatesLoading(false);
      }
    };

    fetchCertificates();

    // Subscribe to real-time updates
    const channel = supabase?.channel('certificates-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'certificates' },
        () => fetchCertificates(),
      )
      .subscribe();

    return () => {
      if (channel) supabase?.removeChannel(channel);
    };
  }, []);

  const skills = [
    { icon: 'fab fa-react',      label: 'React Interfaces',   category: 'Frontend',    description: 'Building reusable components, dynamic pages, and smooth user interactions.',         level: 'Advanced'     },
    { icon: 'fab fa-js',         label: 'JavaScript Logic',   category: 'Programming', description: 'Creating interactive features, form validation, and clean application behavior.',     level: 'Advanced'     },
    { icon: 'fas fa-palette',    label: 'UI/UX Design',       category: 'Design',      description: 'Designing modern layouts, visual hierarchy, and user-friendly digital experiences.',  level: 'Strong'       },
    { icon: 'fas fa-mobile-alt', label: 'Responsive Layouts', category: 'Web Design',  description: 'Making websites adapt beautifully across desktop, tablet, and mobile screens.',       level: 'Advanced'     },
    { icon: 'fas fa-database',   label: 'Database Systems',   category: 'Backend',     description: 'Structuring data, connecting forms, and organizing records for web applications.',    level: 'Intermediate' },
    { icon: 'fas fa-code',       label: 'HTML & CSS Craft',   category: 'Development', description: 'Producing clean, polished interfaces with animations, shadows, and precise styling.', level: 'Advanced'     },
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
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminOtp, setAdminOtp] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');
  const [adminLoginStep, setAdminLoginStep] = useState('email');
  const [adminIsLoggingIn, setAdminIsLoggingIn] = useState(false);
  const [approvedReviews, setApprovedReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, comment: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewStatus, setReviewStatus] = useState({ type: '', message: '' });

  const openFileViewer = (file) => {
    if (!file) return;
    setViewerFile(file);
    setViewerOpen(true);
  };
  const closeFileViewer = () => { setViewerOpen(false); setViewerFile(null); };
  const openAdminLogin = () => {
    setAdminLoginError('');
    setAdminEmail('');
    setAdminOtp('');
    setAdminLoginStep('email');
    setAdminLoginOpen(true);
  };
  const closeAdminLogin = () => {
    setAdminLoginOpen(false);
    setAdminLoginError('');
    setAdminEmail('');
    setAdminOtp('');
    setAdminLoginStep('email');
  };
  const openReviewModal = () => {
    setReviewStatus({ type: '', message: '' });
    setReviewModalOpen(true);
  };
  const closeReviewModal = () => {
    setReviewModalOpen(false);
    setReviewStatus({ type: '', message: '' });
    setReviewForm({ name: '', rating: 5, comment: '' });
  };

  useEffect(() => {
    document.body.style.overflow =
      (viewerOpen || selectedCertificate || showProjectModal || adminLoginOpen || reviewModalOpen) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [viewerOpen, selectedCertificate, showProjectModal, adminLoginOpen, reviewModalOpen]);

  useEffect(() => {
    if (!adminLoginOpen && !reviewModalOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (adminLoginOpen) closeAdminLogin();
        if (reviewModalOpen) closeReviewModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [adminLoginOpen, reviewModalOpen]);

  const fetchApprovedReviews = async () => {
    if (!supabase) {
      setApprovedReviews([]);
      return;
    }

    setReviewsLoading(true);
    const { data, error } = await supabase
      .from('site_reviews')
      .select('id, name, rating, comment, status, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(12);

    if (error) {
      console.warn('Review fetch error:', error);
      setApprovedReviews([]);
    } else {
      setApprovedReviews(data || []);
    }
    setReviewsLoading(false);
  };

  useEffect(() => {
    fetchApprovedReviews();
  }, []);

  useEffect(() => {
    if (!supabase) return undefined;

    const channel = supabase
      .channel('public-site-reviews')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_reviews' },
        () => fetchApprovedReviews(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const openCertificate  = (cert) => setSelectedCertificate(cert);
  const closeCertificate = ()     => setSelectedCertificate(null);

  const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.message) {
      setFormStatus({ type: 'error', message: 'ERROR: Please fill in name, email, phone, and comment.' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      setFormStatus({ type: 'error', message: 'ERROR: Invalid email address.' });
      return;
    }
    const phoneRegex = /^[+()\-\s\d]{7,30}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      setFormStatus({ type: 'error', message: 'ERROR: Invalid phone number.' });
      return;
    }
    setIsSubmitting(true);
    setFormStatus({ type: '', message: 'Submitting to Supabase...' });
    try {
      if (!supabase) {
        console.warn('Supabase not configured; falling back to local submit.');
        await new Promise((res) => setTimeout(res, 700));
        setFormStatus({ type: 'success', message: 'SUCCESS: Message submitted (local fallback).' });
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        const { error } = await supabase.from('contact_messages').insert([{
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          message: formData.message,
          status: 'pending',
        }]);
        if (error) throw error;
        setFormStatus({ type: 'success', message: 'SUCCESS: Message saved to Supabase.' });
        setFormData({ name: '', email: '', phone: '', message: '' });
      }
    } catch (err) {
      console.error('Submit error:', err);
      setFormStatus({
        type: 'error',
        message: isMissingContactPhoneError(err)
          ? 'ERROR: Phone column missing. Run supabase/contact_messages.sql in Supabase SQL Editor, then reload the app.'
          : `ERROR: ${err?.message || 'Unable to submit message.'}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminEmailSubmit = async (e) => {
    e.preventDefault();
    if (!supabase) {
      setAdminLoginError('ERROR: Supabase not configured.');
      return;
    }

    const email = adminEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setAdminLoginError('ERROR: Please enter a valid email address.');
      return;
    }

    setAdminIsLoggingIn(true);
    setAdminLoginError('');

    try {
      const endpointUrl = typeof window !== 'undefined'
        ? new URL(ADMIN_OTP_EMAIL_ENDPOINT, window.location.origin).href
        : ADMIN_OTP_EMAIL_ENDPOINT;

      let response;
      try {
        response = await fetch(endpointUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ adminEmail: email }),
          credentials: 'same-origin',
          mode: 'same-origin',
        });
      } catch (firstError) {
        response = await fetch(ADMIN_OTP_EMAIL_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ adminEmail: email }),
          credentials: 'same-origin',
          mode: 'same-origin',
        });
      }

      const responseText = await response.text();
      const contentType = response.headers.get('content-type') || '';
      let payload = {};

      if (contentType.includes('application/json')) {
        payload = responseText ? JSON.parse(responseText) : {};
      } else {
        throw new Error(
          'Admin OTP email API was not reached. Use Vercel/`vercel dev` or deploy the API route before testing OTP email.',
        );
      }

      if (!response.ok) {
        throw new Error(payload.message || 'Unable to send admin OTP email.');
      }

      setAdminLoginError(payload.message || `OTP sent to ${email}. Check your Gmail inbox.`);
      setAdminLoginStep('otp');
    } catch (error) {
      setAdminLoginError(`ERROR: ${error?.message || 'Unable to send admin OTP email.'}`);
    } finally {
      setAdminIsLoggingIn(false);
    }
  };

  const handleAdminOtpSubmit = async (e) => {
    e.preventDefault();
    if (!supabase) {
      setAdminLoginError('ERROR: Supabase not configured.');
      return;
    }

    const email = adminEmail.trim();
    const otp = adminOtp.trim();

    if (!otp || otp.length !== 6) {
      setAdminLoginError('ERROR: Please enter a valid 6-digit OTP.');
      return;
    }

    setAdminIsLoggingIn(true);
    setAdminLoginError('');

    try {
      const { error: verifyError } = await supabase.rpc('verify_admin_otp', {
        admin_email: email,
        otp_code: otp,
      });

      if (verifyError) {
        throw new Error(verifyError.message);
      }

      window.sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
      window.sessionStorage.setItem('admin-email', email);
      window.location.assign('/admin');
    } catch (error) {
      setAdminLoginError(`ERROR: ${error?.message || 'Unable to verify OTP.'}`);
    } finally {
      setAdminIsLoggingIn(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    const name = reviewForm.name.trim();
    const comment = reviewForm.comment.trim();
    const rating = Number(reviewForm.rating);

    if (!name || !comment) {
      setReviewStatus({ type: 'error', message: 'ERROR: Name and comment are required.' });
      return;
    }
    if (rating < 1 || rating > 5) {
      setReviewStatus({ type: 'error', message: 'ERROR: Select a 1-5 star rating.' });
      return;
    }
    if (!supabase) {
      setReviewStatus({ type: 'error', message: 'ERROR: Supabase is not configured.' });
      return;
    }

    setReviewSubmitting(true);
    setReviewStatus({ type: '', message: 'Submitting review...' });

    const { error } = await supabase.from('site_reviews').insert([{
      name,
      rating,
      comment,
      status: 'pending',
    }]);

    if (error) {
      setReviewStatus({
        type: 'error',
        message: isMissingReviewTableError(error) ? REVIEW_SETUP_MESSAGE : `ERROR: ${error.message}`,
      });
    } else {
      setReviewForm({ name: '', rating: 5, comment: '' });
      setReviewStatus({ type: 'success', message: 'SUCCESS: Review submitted for approval.' });
    }

    setReviewSubmitting(false);
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
      desc:     'Full stack web applications built across interfaces, APIs, data flows, and deployment-ready architecture.',
      tags:     ['React', 'Python', 'Supabase'],
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
    { comp: <IconJS size={6} color="#00ff88"/>,       title: 'JavaScript' },
    { comp: <IconReact size={6} color="#00ff88"/>,    title: 'React'      },
    { comp: <IconPython size={6} color="#00ff88"/>,   title: 'Python'     },
    { comp: <IconSupabase size={6} color="#00ff88"/>, title: 'Supabase'   },
    { comp: <IconRust size={6} color="#00ff88"/>,     title: 'Rust'       },
  ];

  const socialItems = [
    { key: 'github',   href: SOCIAL_LINKS.github,   label: 'GitHub',   icon: <IconGithub size={17}/>   },
    { key: 'linkedin', href: SOCIAL_LINKS.linkedin,  label: 'LinkedIn', icon: <IconLinkedin size={17}/> },
    { key: 'twitter',  href: SOCIAL_LINKS.twitter,   label: 'Twitter',  icon: <IconTwitter size={17}/>  },
    { key: 'dribbble', href: SOCIAL_LINKS.dribbble,  label: 'Dribbble', icon: <IconDribbble size={17}/> },
  ].filter(item => item.href);

const SkillCube = ({ skills }) => {
  const [activeFace, setActiveFace] = useState(0);
  const levelMap = { Advanced: 92, Strong: 78, Intermediate: 60 };
  const sliderColors = ['#00ff88', '#00e5ff', '#ffb700', '#00ff88', '#b464ff', '#00e5ff'];

  const faceIcons2D = [
    <IconReact size={42} color={sliderColors[0]} key="react" />,
    <IconJS size={42} color={sliderColors[1]} key="js" />,
    <IconPalette size={42} color={sliderColors[2]} key="palette" />,
    <IconMobile size={42} color={sliderColors[3]} key="mobile" />,
    <IconDatabase size={42} color={sliderColors[4]} key="database" />,
    <IconCode size={42} color={sliderColors[5]} key="code" />,
  ];

  const activeColor = sliderColors[activeFace];

  // Geometry: keep HUD callout dots attached to the same ring path as the orbiting dot.
  const HUD_STAGE_SIZE = 280;
  const ICON_OFFSET_X = 16;
  const ICON_OFFSET_Y = -18;
  const HUD_CENTER_X = HUD_STAGE_SIZE / 2 + ICON_OFFSET_X;
  const HUD_CENTER_Y = HUD_STAGE_SIZE / 2 + ICON_OFFSET_Y;
  const HUD_RADIUS = 90; // matches .slider-icon-scene .orbit-ring inside the 180px icon scene
  const HUD_Y_FRACTIONS = [-0.62, -0.12, 0.38, 0.82]; // where each tick sits, top to bottom
  const HUD_LINE_WIDTHS = [46, 38, 50, 42];

 const hudLabels = [
    { text: 'category',    sub: skills[activeFace].category },
    { text: 'skill',       sub: skills[activeFace].label },
    { text: 'level',       sub: skills[activeFace].level },
    { text: 'proficiency', sub: `${levelMap[skills[activeFace].level]}%` },
  ].map((lbl, i) => {
    const side = i % 2 === 0 ? 'right' : 'left'; // 1st & 3rd → right, 2nd & 4th → left
    const y = HUD_Y_FRACTIONS[i] * HUD_RADIUS;
    const xMag = Math.sqrt(Math.max(HUD_RADIUS * HUD_RADIUS - y * y, 0));
    const x = side === 'right' ? xMag : -xMag;
    return { ...lbl, side, lineW: HUD_LINE_WIDTHS[i], tickX: HUD_CENTER_X + x, tickY: HUD_CENTER_Y + y };
  });

  const cubeRef = useRef(null);

  useEffect(() => {
    const root = cubeRef.current;
    if (!root) return;
    const orbitDot = root.querySelector('.slider-icon-scene .orbit-dot');
    const labels = Array.from(root.querySelectorAll('.skill-hud-label'));
    let rafId = null;
    const threshold = 16;
    const tickCenters = () => labels.map(lbl => {
      const tick = lbl.querySelector('.hud-tick');
      if (!tick) return null;
      const r = tick.getBoundingClientRect();
      return { lbl, x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    const check = () => {
      if (!orbitDot) { rafId = requestAnimationFrame(check); return; }
      const od = orbitDot.getBoundingClientRect();
      const ox = od.left + od.width / 2, oy = od.top + od.height / 2;
      tickCenters().forEach(c => {
        if (!c) return;
        const dx = ox - c.x, dy = oy - c.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < threshold) c.lbl.classList.add('active'); else c.lbl.classList.remove('active');
      });
      rafId = requestAnimationFrame(check);
    };
    rafId = requestAnimationFrame(check);
    return () => { if (rafId) cancelAnimationFrame(rafId); };
  }, [activeFace]);

  return (
    <div className="cube-universe" ref={cubeRef}>
      <div className="slider-stage">
        <div className="slider-hint">slide through icons · click any dot to inspect a skill</div>

        <div
          className="skill-hud-stage"
          style={{ '--icon-offset-x': `${ICON_OFFSET_X}px`, '--icon-offset-y': `${ICON_OFFSET_Y}px` }}
        >

          <div className="hud-scan" aria-hidden="true" style={{ '--skill-color': activeColor }} />

          <div className="skill-hud-labels" aria-hidden="true" key={activeFace} style={{ '--skill-color': activeColor }}>
            {hudLabels.map((lbl, i) => (
              <div
                key={i}
                className={`skill-hud-label skill-hud-label--${lbl.side}`}
                style={{ top: `${lbl.tickY}px`, left: `${lbl.tickX}px`, animationDelay: `${i * 0.07}s` }}
              >
                {lbl.side === 'right' ? (
                  <>
                    <div className="hud-tick" />
                    <div className="hud-line" style={{ width: `${lbl.lineW}px` }} />
                    <div className="hud-text">
                      <span className="hud-text-label">{lbl.text}</span>
                      <span className="hud-text-value">{lbl.sub}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="hud-text">
                      <span className="hud-text-label">{lbl.text}</span>
                      <span className="hud-text-value">{lbl.sub}</span>
                    </div>
                    <div className="hud-line" style={{ width: `${lbl.lineW}px` }} />
                    <div className="hud-tick" />
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="slider-card" style={{ '--skill-color': activeColor, position: 'relative', zIndex: 2 }}>
            <div className="slider-icon">
              <div className="icon-scene slider-icon-scene">
                <div className="orbit-ring"><span className="orbit-dot"></span></div>
                <div className="ripple"></div>
                <div className="icon-3d">{faceIcons2D[activeFace]}</div>
                <div className="floor-glow"></div>
              </div>
            </div>
          </div>
        </div>
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
              <IconReact size={14} color={colors[0]} key="react" />,
              <IconJS size={14} color={colors[1]} key="js" />,
              <IconPalette size={14} color={colors[2]} key="palette" />,
              <IconMobile size={14} color={colors[3]} key="mobile" />,
              <IconDatabase size={14} color={colors[4]} key="database" />,
              <IconCode size={14} color={colors[5]} key="code" />,
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
          {skills.map((_, i) => (
            <button key={i} className={`cube-dot${activeFace === i ? ' active' : ''}`} onClick={() => setActiveFace(i)} aria-label={`Skill ${i + 1}`}></button>
          ))}
        </div>
      </div>
    </div>
  );
  };

  const testimonialReviews =
    approvedReviews.length > 1 ? [...approvedReviews, ...approvedReviews] : approvedReviews;

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
            <button
              type="button"
              className={`hamburger${menuOpen ? ' open' : ''}`}
              aria-label="Toggle menu"
              aria-controls="mobile-navigation"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(v => !v)}
            >
              <span></span><span></span><span></span>
            </button>
          </div>
          {menuOpen && (
            <div className="mobile-menu" id="mobile-navigation">
              {['home','work','certificates','about'].map(id => (
                <a key={id} href={`#${id}`} onClick={(e) => { e.preventDefault(); scrollToSection(id); setMenuOpen(false); }}>{id}</a>
              ))}
              <button className="btn" onClick={() => { scrollToSection('contact-section'); setMenuOpen(false); }}>contact_me()</button>
            </div>
          )}
        </nav>

        {/* HERO SLIDESHOW */}
        <HeroSlideshow scrollToSection={scrollToSection} socialItems={socialItems} stackIcons={stackIcons} />

        {/* STATS BAR */}
        <div className="stats-bar" ref={statsRef}>
          <div className="stat-item"><span className="stat-number">{projectsCount}<sup>+</sup></span><span className="stat-label">projects_shipped</span></div>
          <div className="stat-divider" aria-hidden="true"></div>
          <div className="stat-item"><span className="stat-number">{clientsCount}<sup>+</sup></span><span className="stat-label">happy_clients</span></div>
          <div className="stat-divider" aria-hidden="true"></div>
          <div className="stat-item"><span className="stat-number">{yearsCount}<sup>yr</sup></span><span className="stat-label">experience</span></div>
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
              <p>I'm Zaldy, a full stack developer with a technical background in computer programming and a passion for building complete, usable web products.</p>
              <p>I work across interface design, frontend development, backend logic, and data integration to create applications that feel polished, reliable, and easy to use.</p>
              <div className="about-brief">
                <div className="about-brief-line">
                  <span className="about-brief-key">focus</span>
                  <span>Turning ideas into complete web applications, from UI structure to data-backed functionality.</span>
                </div>
                <div className="about-brief-line">
                  <span className="about-brief-key">method</span>
                  <span>Plan the flow, design the interface, build the client, connect the backend, test, and ship.</span>
                </div>
                <div className="about-metrics" aria-label="About highlights">
                  <span><strong>07</strong> stack stages</span>
                  <span><strong>8:00AM–4:30PM</strong> reply window</span>
                  <span><strong>PH</strong> based</span>
                </div>
              </div>
            </div>
            <div className="about-card">
              <div className="about-card-avatar">
                <img className="about-card-avatar-img" src={zadImg} alt="Zaldy Dagohoy" onError={(e) => { e.currentTarget.style.display='none'; }} />
                <div className="about-card-avatar-fallback" aria-hidden="true">ZD</div>
              </div>
              <h3>Zaldy Dagohoy</h3>
              <p className="about-card-role">full_stack_developer</p>
              <div className="about-card-info">
                <span><IconPin size={13} color="#00ff88"/> Davao City, PH</span>
                <span><IconGrad size={13} color="#00ff88"/> BTVTED-CP</span>
                <span><IconEmail size={13} color="#00ff88"/> zaldy.dagohoy.a@gmail.com</span>
              </div>
              <a href="mailto:zaldy.dagohoy.a@gmail.com" className="btn about-card-btn">
                hire_me() <IconSend size={13} color="currentColor"/>
              </a>
              <div className="about-card-pikachu" aria-hidden="true">
                <svg className="pikachu-filter-defs" aria-hidden="true" focusable="false">
                  <filter id="pikachu-neon-outline" colorInterpolationFilters="sRGB">
                    <feColorMatrix
                      in="SourceGraphic"
                      type="matrix"
                      values="0.2126 0.7152 0.0722 0 0
                              0.2126 0.7152 0.0722 0 0
                              0.2126 0.7152 0.0722 0 0
                              0      0      0      1 0"
                      result="gray"
                    />
                    <feConvolveMatrix
                      in="gray"
                      order="3"
                      kernelMatrix="-1 -1 -1 -1 8 -1 -1 -1 -1"
                      divisor="1"
                      bias="0"
                      edgeMode="duplicate"
                      preserveAlpha="true"
                      result="edges"
                    />
                    <feColorMatrix
                      in="edges"
                      type="matrix"
                      values="0    0    0    0 0
                              0.95 0.95 0.95 0 0
                              0.35 0.35 0.35 0 0
                              1.2  1.2  1.2  0 -0.18"
                    />
                  </filter>
                </svg>
                <video
                  className="pikachu-video"
                  src={pikachuVid}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                />
              </div>
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
            {certificatesLoading ? (
              <div className="cert-loading">loading_certificates...</div>
            ) : certificates.length === 0 ? (
              <div className="cert-empty">No certificates available.</div>
            ) : (
              (() => {
                const certificateItems = [...certificates, ...certificates];
                return (
                  <div className="cert-track">
                    {certificateItems.map((cert, index) => {
                      const imageUrl = (() => {
                        if (!cert?.image_url) return '';
                        if (typeof cert.image_url === 'string' && cert.image_url.startsWith('http')) return cert.image_url;
                        if (typeof cert.image_url === 'string' && cert.image_url.startsWith('/')) return cert.image_url;
                        return cert.image_url;
                      })();
                      const actualIndex = index % certificates.length;
                      return (
                        <div
                          key={`cert-${cert.id || actualIndex}-${index}`}
                          className={`cert-card cert-card-${actualIndex + 1}`}
                          onClick={() => openCertificate({ title: cert.title, image: imageUrl })}
                          role="button" tabIndex={0} aria-label={`View ${cert.title}`}
                          onKeyDown={(e) => e.key === 'Enter' && openCertificate({ title: cert.title, image: imageUrl })}
                        >
                          <div className="cert-card-img-wrap">
                            <img src={imageUrl} alt={cert.title || `Certificate ${actualIndex + 1}`} />
                            <div className="cert-card-hover-overlay">
                              <i className="fas fa-expand-alt"></i>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            )}
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
                  <span><IconClock size={13} color="#00ff88"/> 2026</span>
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
                        {project.type === 'image'
                          ? 'Image sample'
                          : project.type === 'pdf'
                            ? 'PDF sample'
                            : 'Document sample'}
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
        <section id="expertise" className="skills-section">
          <div className="wave-divider" aria-hidden="true">
            <svg viewBox="0 0 1200 70" preserveAspectRatio="none">
              <path d="M0,35 C220,23 380,24 600,34 S980,48 1200,35" />
            </svg>
          </div>
          <div className="skills-header">
            <span className="skills-kicker"><IconCode size={12} color="#00ff88"/> skills.json</span>
            <h2 className="section-title">core_expertise</h2>
            <p className="skills-subtitle">A snapshot of the tools and practices I use to build full stack web applications.</p>
          </div>
          <SkillCube skills={skills} />
        </section>

        {/* TESTIMONIALS */}
        <section className="testimonials-section">
          <div className="wave-divider" aria-hidden="true">
            <svg viewBox="0 0 1200 70" preserveAspectRatio="none">
              <path d="M0,35 C220,23 380,24 600,34 S980,48 1200,35" />
            </svg>
          </div>
          <div className="testimonials-header">
            <div>
              <span className="skills-kicker"><IconQuote size={12} color="#00ff88"/> testimonials.json</span>
              <h2 className="section-title">what_people_say</h2>
            </div>
            <button type="button" className="btn btn-outline review-add-btn" onClick={openReviewModal}>
              add_review() <IconStar size={13} color="currentColor"/>
            </button>
          </div>
          {approvedReviews.length === 0 ? (
            <div className="reviews-empty-state">
              {reviewsLoading ? 'loading_reviews...' : 'No approved reviews yet.'}
            </div>
          ) : (
            <div className="testimonials-scroll-container">
              <div className={`testimonials-track${approvedReviews.length > 1 ? '' : ' testimonials-track-static'}`}>
                {testimonialReviews.map((review, idx) => (
                  <div key={`${review.id || review.name}-${idx}`} className="testimonial-card">
                    <div className="testimonial-quote-icon"><IconQuote size={20} color="#00ff88"/></div>
                    <p className="testimonial-text">{review.comment}</p>
                    <div className="testimonial-author">
                      <div className="testimonial-avatar">{getInitials(review.name)}</div>
                      <div><strong>{review.name}</strong><span>visitor review</span></div>
                    </div>
                    <div className="testimonial-stars" aria-label={`${review.rating} of 5 stars`}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={star <= Number(review.rating) ? 'star-on' : 'star-off'}>★</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* CONTACT */}
        <section id="contact-section" className="contact-section">
          <div className="wave-divider" aria-hidden="true">
            <svg viewBox="0 0 1200 70" preserveAspectRatio="none">
              <path d="M0,35 C220,23 380,24 600,34 S980,48 1200,35" />
            </svg>
          </div>
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
                  <input type="email" id="email" name="email" placeholder="// email_address" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label htmlFor="phone" className="visually-hidden">Phone number</label>
                  <input type="tel" id="phone" name="phone" placeholder="// phone_number" value={formData.phone} onChange={handleChange} required />
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
              <button type="button" className="footer-logo-button" onClick={openAdminLogin} aria-label="Open admin login">
                <img src={logoImg} alt="Logo" className="footer-logo" onError={(e) => e.currentTarget.style.display='none'} />
              </button>
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

      {adminLoginOpen && (
        <div className="admin-login-overlay" role="dialog" aria-modal="true" aria-labelledby="admin-login-title" onClick={closeAdminLogin}>
          <div className="admin-login-modal" onClick={(e) => e.stopPropagation()}>
            <button className="admin-login-close" type="button" onClick={closeAdminLogin} aria-label="Close">x</button>
            <span className="admin-login-kicker"><IconLock size={12} color="#00ff88"/> restricted_area</span>
            <h2 id="admin-login-title">admin_login</h2>
            {adminLoginStep === 'email' ? (
              <form onSubmit={handleAdminEmailSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="admin-email" className="visually-hidden">Admin email</label>
                <input
                  type="email"
                  id="admin-email"
                  name="admin-email"
                  placeholder="// your_admin_email@gmail.com"
                  value={adminEmail}
                  onChange={(e) => {
                    setAdminEmail(e.target.value);
                    setAdminLoginError('');
                  }}
                  autoComplete="email"
                  autoFocus
                  required
                  disabled={adminIsLoggingIn}
                />
              </div>
                <button type="submit" className="btn submit-btn" disabled={adminIsLoggingIn}>
                  {adminIsLoggingIn ? 'sending_otp...' : 'send_otp()'} <IconLock size={13} color="currentColor"/>
                </button>
                {adminLoginError && (
                  <div className={`form-status ${adminLoginError.includes('sent to') ? 'otp-sent' : 'error'}`}>{adminLoginError}</div>
                )}
            </form>
            ) : (
              <form onSubmit={handleAdminOtpSubmit} noValidate>
                <div className="form-group">
                  <label htmlFor="admin-otp" className="visually-hidden">One-Time Password</label>
                  <input
                    type="text"
                    id="admin-otp"
                    name="admin-otp"
                    placeholder="// 000000"
                    value={adminOtp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setAdminOtp(val);
                      setAdminLoginError('');
                    }}
                    maxLength="6"
                    autoComplete="one-time-code"
                    autoFocus
                    required
                    disabled={adminIsLoggingIn}
                  />
                  <p className="form-hint">Enter the 6-digit code sent to {adminEmail}</p>
                </div>
                <button type="submit" className="btn submit-btn" disabled={adminIsLoggingIn || adminOtp.length !== 6}>
                  {adminIsLoggingIn ? 'verifying...' : 'verify_otp()'} <IconLock size={13} color="currentColor"/>
                </button>
                <button type="button" className="btn submit-btn admin-btn-secondary" onClick={() => { setAdminLoginStep('email'); setAdminOtp(''); }} disabled={adminIsLoggingIn}>
                  back_to_email()
                </button>
                {adminLoginError && (
                  <div className="form-status error">{adminLoginError}</div>
                )}
              </form>
            )}
          </div>
        </div>
      )}

      {reviewModalOpen && (
        <div className="review-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="review-modal-title" onClick={closeReviewModal}>
          <div className="review-modal" onClick={(e) => e.stopPropagation()}>
            <button className="admin-login-close" type="button" onClick={closeReviewModal} aria-label="Close">x</button>
            <span className="admin-login-kicker"><IconStar size={12} color="#00ff88"/> visitor_review</span>
            <h2 id="review-modal-title">add_review</h2>
            <form onSubmit={handleReviewSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="review-name" className="visually-hidden">Name</label>
                <input
                  type="text"
                  id="review-name"
                  name="review-name"
                  placeholder="// your_name"
                  value={reviewForm.name}
                  onChange={(e) => {
                    setReviewForm((prev) => ({ ...prev, name: e.target.value }));
                    setReviewStatus({ type: '', message: '' });
                  }}
                  autoComplete="name"
                  required
                />
              </div>
              <div className="review-rating-field" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    className={`review-star-button${rating <= Number(reviewForm.rating) ? ' active' : ''}`}
                    onClick={() => {
                      setReviewForm((prev) => ({ ...prev, rating }));
                      setReviewStatus({ type: '', message: '' });
                    }}
                    aria-label={`${rating} star${rating > 1 ? 's' : ''}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <div className="form-group">
                <label htmlFor="review-comment" className="visually-hidden">Review comment</label>
                <textarea
                  id="review-comment"
                  name="review-comment"
                  rows="4"
                  placeholder="// your_review"
                  value={reviewForm.comment}
                  onChange={(e) => {
                    setReviewForm((prev) => ({ ...prev, comment: e.target.value }));
                    setReviewStatus({ type: '', message: '' });
                  }}
                  required
                />
              </div>
              <button type="submit" className="btn submit-btn" disabled={reviewSubmitting}>
                {reviewSubmitting
                  ? <><IconSpinner size={15} color="currentColor"/> submitting...</>
                  : <>submit_review() <IconStar size={13} color="currentColor"/></>
                }
              </button>
              {reviewStatus.message && (
                <div className={`form-status ${reviewStatus.type}`}>{reviewStatus.message}</div>
              )}
            </form>
          </div>
        </div>
      )}

      <button className="scroll-top" aria-label="Scroll to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <IconChevronUp size={16} color="#00ff88"/>
      </button>
    </div>
  );
};

export default HomePage;
