/**
 * Utilities to draw a gorgeous CachyOS KDE Plasma-themed desktop on Canvas API.
 * This acts as a native fallback and a visual playground.
 */

export function drawCachyOSDesktop(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  timeString: string = "19:10",
  dateString: string = "Jueves, 4 de Junio"
) {
  // 1. Background Gradient (Dark CachyOS Emerald Slate)
  const grad = ctx.createRadialGradient(
    width / 2, height / 2, 20,
    width / 2, height / 2, Math.max(width, height)
  );
  grad.addColorStop(0, "#081b16"); // Extremely dark green-slate
  grad.addColorStop(0.5, "#040d0b"); // Deeper forest
  grad.addColorStop(1, "#020605"); // Near black
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // 2. Abstract Neon Mesh / Background Aesthetics
  ctx.strokeStyle = "rgba(0, 245, 160, 0.05)";
  ctx.lineWidth = 1;
  const gridSize = 80;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.quadraticCurveTo(x + 40, height / 2, x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.quadraticCurveTo(width / 2, y + 40, width, y);
    ctx.stroke();
  }

  // Draw a big abstract CachyOS Logo in the center
  const centerX = width / 2;
  const centerY = height / 2 - 30;
  ctx.save();
  ctx.beginPath();
  // Outer glowing ring
  const circleGrad = ctx.createRadialGradient(centerX, centerY, 50, centerX, centerY, 200);
  circleGrad.addColorStop(0, "rgba(0, 245, 160, 0.12)");
  circleGrad.addColorStop(1, "rgba(0, 245, 160, 0)");
  ctx.fillStyle = circleGrad;
  ctx.arc(centerX, centerY, 200, 0, Math.PI * 2);
  ctx.fill();

  // Draw elegant geometric cuttlefish / Cachy logo
  ctx.beginPath();
  ctx.strokeStyle = "#00F5A0"; // Neon Green
  ctx.lineWidth = 3.5;
  ctx.shadowColor = "#00F5A0";
  ctx.shadowBlur = 15;

  // Let's draw an elegant stylized Arch-style Linux crest intersecting with a fish fin
  ctx.moveTo(centerX, centerY - 100);
  ctx.lineTo(centerX - 90, centerY + 60);
  ctx.lineTo(centerX - 35, centerY + 30);
  ctx.lineTo(centerX, centerY + 90); // center spike
  ctx.lineTo(centerX + 35, centerY + 30);
  ctx.lineTo(centerX + 90, centerY + 60);
  ctx.closePath();
  ctx.stroke();

  // Fishbone / tech inner lines
  ctx.beginPath();
  ctx.strokeStyle = "rgba(0, 245, 160, 0.5)";
  ctx.lineWidth = 2;
  ctx.shadowBlur = 0;
  ctx.moveTo(centerX - 45, centerY + 10);
  ctx.lineTo(centerX + 45, centerY + 10);
  ctx.moveTo(centerX - 30, centerY - 20);
  ctx.lineTo(centerX + 30, centerY - 20);
  ctx.moveTo(centerX - 15, centerY - 50);
  ctx.lineTo(centerX + 15, centerY - 50);
  ctx.stroke();
  ctx.restore();

  // 3. Floating CachyOS System Helper Widget (KDE Style widget)
  const widgetW = 280;
  const widgetH = 140;
  const widgetX = 40;
  const widgetY = 60;
  
  ctx.fillStyle = "rgba(10, 25, 20, 0.75)";
  ctx.strokeStyle = "rgba(0, 245, 160, 0.2)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, widgetX, widgetY, widgetW, widgetH, 12);
  ctx.fill();
  ctx.stroke();

  // Glassmorphic highlights
  ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
  roundRect(ctx, widgetX, widgetY, widgetW, 40, { tl: 12, tr: 12, bl: 0, br: 0 });
  ctx.fill();

  // Time & Date
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 32px Inter, system-ui, sans-serif";
  ctx.fillText(timeString, widgetX + 24, widgetY + 70);
  
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.font = "500 13px Inter, system-ui, sans-serif";
  ctx.fillText(dateString, widgetX + 24, widgetY + 100);

  ctx.fillStyle = "#00F5A0";
  ctx.font = "bold 11px JetBrains Mono, monospace";
  ctx.fillText("● SYSTEM ONLINE (CachyOS)", widgetX + 24, widgetY + 122);

  // Widget header text
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.font = "bold 11px Inter, system-ui, sans-serif";
  ctx.fillText("RELOJ DE ESCRITORIO", widgetX + 24, widgetY + 25);


  // 4. Floating Neofetch Terminal (Classic Linux Pride)
  const termX = width - 560 > 40 ? width - 560 : 20;
  const termY = 90;
  const termW = 500;
  const termH = 310;

  // Terminal Window
  ctx.fillStyle = "rgba(5, 12, 10, 0.9)";
  ctx.strokeStyle = "rgba(0, 245, 160, 0.35)";
  ctx.lineWidth = 2;
  roundRect(ctx, termX, termY, termW, termH, 10);
  ctx.fill();
  ctx.stroke();

  // Terminal Header Bar
  ctx.fillStyle = "rgba(10, 20, 17, 0.95)";
  roundRect(ctx, termX, termY, termW, 32, { tl: 10, tr: 10, bl: 0, br: 0 });
  ctx.fill();
  
  // Terminal buttons (KDE macOS-ish Style)
  const colors = ["#ff5f56", "#ffbd2e", "#27c93f"];
  colors.forEach((col, idx) => {
    ctx.beginPath();
    ctx.fillStyle = col;
    ctx.arc(termX + 18 + idx * 18, termY + 16, 6, 0, Math.PI * 2);
    ctx.fill();
  });

  // Terminal Title text
  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  ctx.font = "500 12px JetBrains Mono, monospace";
  ctx.fillText("marc@cachyos-pc: ~ (zsh)", termX + termW / 2 - 80, termY + 21);

  // Neofetch Cachy Logo (drawn inside terminal)
  const textX = termX + 180;
  const labelY = termY + 60;
  const fontSpacing = 17;

  // Let's render the terminal contents
  ctx.fillStyle = "#00F5A0";
  ctx.font = "bold 13px JetBrains Mono, monospace";
  
  // Left side: ASCII logo
  const ascii = [
    "  ████████  ████████",
    "  ████████  ████████",
    "  ████████  ████████",
    "  ████████  ████████",
    "  ████████",
    "  ████████  ████████",
    "  ████████  ████████",
    "  ████████  ████████",
  ];
  ascii.forEach((line, i) => {
    ctx.fillText(line, termX + 20, labelY + i * fontSpacing);
  });

  // Right side: System info
  ctx.fillStyle = "#00F5A0";
  ctx.font = "bold 13px JetBrains Mono, monospace";
  ctx.fillText("marc@cachyos-pc", textX, labelY);
  ctx.fillStyle = "#ffffff";
  ctx.font = "12px JetBrains Mono, monospace";
  ctx.fillText("---------------", textX, labelY + 10);

  const stats = [
    ["OS", "CachyOS Linux x86_64"],
    ["Kernel", "6.14.3-3-cachyos-lto"],
    ["Uptime", "1 hour, 45 mins"],
    ["Shell", "zsh 5.9"],
    ["DE", "KDE Plasma 6.1 (Wayland)"],
    ["WM", "KWin"],
    ["CPU", "AMD Ryzen 7 7800X3D (8) @ 5.0GHz"],
    ["GPU", "NVIDIA GeForce RTX 4070 Ti Super"],
    ["Memory", "14.2 GiB / 31.2 GiB (45%)"]
  ];

  stats.forEach(([key, val], i) => {
    const currentY = labelY + 25 + i * fontSpacing;
    ctx.fillStyle = "#00F5A0";
    ctx.font = "bold 12px JetBrains Mono, monospace";
    ctx.fillText(`${key}:`, textX, currentY);

    ctx.fillStyle = "#e0e0e0";
    ctx.font = "500 12px JetBrains Mono, monospace";
    ctx.fillText(val, textX + 65, currentY);
  });

  // Color Blocks at bottom of terminal
  const blockColors = ["#000000", "#ff5555", "#50fa7b", "#f1fa8c", "#bd93f9", "#ff79c6", "#8be9fd", "#f8f8f2"];
  blockColors.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.fillRect(termX + 25 + i * 18, termY + 270, 14, 14);
  });


  // 5. Open VS Code Window IDE Mockup (Bottom Left)
  const codeX = 80;
  const codeY = height - 280 > 240 ? height - 280 : 250;
  const codeW = 460;
  const codeH = 210;

  ctx.fillStyle = "rgba(10, 14, 20, 0.88)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  roundRect(ctx, codeX, codeY, codeW, codeH, 8);
  ctx.fill();
  ctx.stroke();

  // Code editor bar
  ctx.fillStyle = "rgba(15, 20, 28, 0.95)";
  roundRect(ctx, codeX, codeY, codeW, 28, { tl: 8, tr: 8, bl: 0, br: 0 });
  ctx.fill();

  // tabs
  ctx.fillStyle = "rgba(10, 14, 20, 0.88)";
  ctx.fillRect(codeX + 15, codeY + 6, 120, 22);
  ctx.fillStyle = "#ffffff";
  ctx.font = "11px Inter, sans-serif";
  ctx.fillText("App.tsx", codeX + 30, codeY + 20);
  ctx.fillStyle = "#ff5555";
  ctx.beginPath();
  ctx.arc(codeX + 115, codeY + 16, 3, 0, Math.PI * 2);
  ctx.fill();

  // Code layout lines
  ctx.fillStyle = "#a9b1d6";
  ctx.font = "11px JetBrains Mono, monospace";
  const codeSnippet = [
    "import React, { useState } from 'react';",
    "import { LightshotCanvas } from './components';",
    "",
    "export default function App() {",
    "  const [capture, setCapture] = useState(false);",
    "  // Presiona Impr Pant para congelar",
    "  return <Canvas active={capture} />;",
    "}"
  ];

  codeSnippet.forEach((line, index) => {
    const lineY = codeY + 50 + index * 18;
    ctx.fillStyle = "#565fa4";
    ctx.fillText(`${index + 1}`, codeX + 18, lineY);

    // Color highlights
    let text = line;
    if (line.startsWith("import")) {
      ctx.fillStyle = "#ff79c6";
      ctx.fillText("import ", codeX + 45, lineY);
      ctx.fillStyle = "#e0e0e0";
      ctx.fillText(text.replace("import ", ""), codeX + 95, lineY);
    } else if (line.includes("export default")) {
      ctx.fillStyle = "#8be9fd";
      ctx.fillText("export default ", codeX + 45, lineY);
      ctx.fillStyle = "#ffb86c";
      ctx.fillText("function App() {", codeX + 150, lineY);
    } else if (line.includes("//")) {
      ctx.fillStyle = "#6272a4";
      ctx.fillText(line, codeX + 45, lineY);
    } else {
      ctx.fillStyle = "#f8f8f2";
      ctx.fillText(line, codeX + 45, lineY);
    }
  });


  // 6. KDE Bottom Taskbar (Modern floating design)
  const barW = Math.min(680, width - 40);
  const barH = 50;
  const barX = (width - barW) / 2;
  const barY = height - 15 - barH;

  ctx.fillStyle = "rgba(10, 20, 16, 0.9)";
  ctx.strokeStyle = "rgba(0, 245, 160, 0.4)";
  ctx.lineWidth = 1.5;
  ctx.shadowColor = "rgba(0, 245, 160, 0.2)";
  ctx.shadowBlur = 10;
  roundRect(ctx, barX, barY, barW, barH, 14);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0; // reset

  // Launch button (KDE stylized CachyOS Star/Fin)
  ctx.beginPath();
  ctx.fillStyle = "#00F5A0";
  ctx.arc(barX + 25, barY + 25, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#0e1a17";
  ctx.font = "bold 13px Inter, system-ui, sans-serif";
  ctx.fillText("C", barX + 20, barY + 30);

  // Search box
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  roundRect(ctx, barX + 50, barY + 11, 100, 28, 6);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.font = "11px Inter, sans-serif";
  ctx.fillText("Buscar...", barX + 62, barY + 28);

  // Active Icons
  const iconsX = barX + 170;
  const activeAppLabels = ["Firefox", "Terminal", "VS Code", "Lightshot"];
  const activeAppColors = ["#ff943d", "#00F5A0", "#007acc", "#7b2cdd"];

  activeAppLabels.forEach((lbl, i) => {
    const itemX = iconsX + i * 85;
    // Icon background circle
    ctx.fillStyle = activeAppColors[i];
    ctx.beginPath();
    ctx.arc(itemX + 15, barY + 25, 10, 0, Math.PI * 2);
    ctx.fill();
    // Dot underneath active app
    ctx.fillStyle = "#00F5A0";
    ctx.beginPath();
    ctx.arc(itemX + 15, barY + 42, 2, 0, Math.PI * 2);
    ctx.fill();

    // label
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px Inter, sans-serif";
    ctx.fillText(lbl, itemX + 30, barY + 29);
  });

  // Tray Area (Clock, battery, wifi, volume symbols on right of panel)
  const trayX = barX + barW - 130;
  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  ctx.fillRect(trayX - 10, barY + 10, 1, 30); // separator

  // Wifi icon symbol
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(trayX + 10, barY + 28, 6, Math.PI * 1.2, Math.PI * 1.8);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(trayX + 10, barY + 28, 3, Math.PI * 1.2, Math.PI * 1.8);
  ctx.stroke();

  // Battery icon symbol
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(trayX + 28, barY + 20, 14, 8);
  ctx.fillRect(trayX + 42, barY + 22, 2, 4);
  ctx.fillStyle = "#00c853";
  ctx.fillRect(trayX + 29, barY + 21, 10, 6);

  // Quick clock
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 11px Inter, sans-serif";
  ctx.fillText(timeString, trayX + 58, barY + 22);
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.font = "9px Inter, sans-serif";
  ctx.fillText("04/06/2026", trayX + 56, barY + 36);
  
  // Custom credit overlay at bottom left corner
  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  ctx.font = "11px Inter, sans-serif";
  ctx.fillText("CachyOS GNU/Linux Desktop Platform Simulation (Practice Mode)", 30, height - 25);
}

/**
 * Helper to draw a rounded rectangle on Canvas
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number | { tl: number; tr: number; bl: number; br: number } = 5
) {
  let r = { tl: 0, tr: 0, bl: 0, br: 0 };
  if (typeof radius === "number") {
    r = { tl: radius, tr: radius, bl: radius, br: radius };
  } else {
    r = { ...r, ...radius };
  }

  ctx.beginPath();
  ctx.moveTo(x + r.tl, y);
  ctx.lineTo(x + width - r.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r.tr);
  ctx.lineTo(x + width, y + height - r.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r.br, y + height);
  ctx.lineTo(x + r.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r.bl);
  ctx.lineTo(x, y + r.tl);
  ctx.quadraticCurveTo(x, y, x + r.tl, y);
  ctx.closePath();
}
