"use client";
import { useEffect, useRef, useState } from "react";

// Petit hook de scroll-reveal, sans dépendance externe : observe l'élément
// référencé et bascule "visible" à true une seule fois, dès qu'il entre dans
// le viewport. Utilisé pour les animations "fade-in au scroll" du site public
// (voir components/SiteDesktop.js). Se désactive proprement si
// IntersectionObserver n'est pas disponible (rendu serveur, vieux navigateur).
export function useReveal(options) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px", ...options }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, visible];
}
