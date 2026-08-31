"use client";
import { useState } from "react";
import { X, Smartphone, Monitor } from "lucide-react";
import { T } from "../lib/data";
import SiteDesktop from "./SiteDesktop";
import ApercuSite from "./ApercuSite";

export default function ApercuPleinEcran({ secteur, business, paye, onFermer }) {
  const [mode, setMode] = useState("desktop");
  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(15,23,42,0.75)" }}>
      <div className="flex items-center justify-between px-5 py-3 shrink-0" style={{ background: T.encre }}>
        <span className="text-sm font-semibold text-white">Rendu de votre site</span>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full p-1" style={{ background: "rgba(255,255,255,0.1)" }}>
            <button onClick={() => setMode("desktop")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: mode === "desktop" ? T.jaune : "transparent", color: mode === "desktop" ? T.bleuFonce : "rgba(255,255,255,0.75)" }}>
              <Monitor size={13} /> Ordinateur
            </button>
            <button onClick={() => setMode("mobile")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: mode === "mobile" ? T.jaune : "transparent", color: mode === "mobile" ? T.bleuFonce : "rgba(255,255,255,0.75)" }}>
              <Smartphone size={13} /> Smartphone
            </button>
          </div>
          <button onClick={onFermer} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
            <X size={16} color="#fff" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-8 px-4">
        {mode === "desktop" ? (
          <div className="max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-2xl">
            <SiteDesktop secteur={secteur} business={business} paye={paye} />
          </div>
        ) : (
          <ApercuSite secteur={secteur} business={business} paye={paye} />
        )}
      </div>
    </div>
  );
}

