"use client";

import { Github, Coffee } from "lucide-react";
import { SITE_CONFIG } from "@/lib/site-config";

export default function SiteFooter() {
  const { githubRepo, tipUrl } = SITE_CONFIG;
  const hasLinks = githubRepo || tipUrl;

  if (!hasLinks) return null;

  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50 px-4 py-4">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-4 text-sm text-slate-600">
        {githubRepo && (
          <a
            href={githubRepo}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded px-2 py-1 text-slate-600 transition hover:bg-slate-200 hover:text-slate-800"
            title="View on GitHub"
          >
            <Github className="h-4 w-4" />
            <span>GitHub</span>
          </a>
        )}
        {githubRepo && (
          <a
            href={`${githubRepo.replace(/\/$/, "")}/issues`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded px-2 py-1 text-slate-600 transition hover:bg-slate-200 hover:text-slate-800"
            title="Report a bug"
          >
            Report bug
          </a>
        )}
        {tipUrl && (
          <a
            href={tipUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded px-2 py-1 text-amber-700 transition hover:bg-amber-100 hover:text-amber-800"
            title="Support this project"
          >
            <Coffee className="h-4 w-4" />
            <span>Tip / Support</span>
          </a>
        )}
      </div>
    </footer>
  );
}
