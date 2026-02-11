/**
 * Site configuration for links in the footer.
 * Update these URLs to point to your GitHub repo and tip/donation page.
 *
 * Use environment variables (NEXT_PUBLIC_*) for deployment, or set fallbacks here.
 *
 * Best practices:
 * - GitHub: Link to repo so users can open Issues for bug reports
 * - Tip: Ko-fi, Buy Me a Coffee, or GitHub Sponsors are common choices
 */

export const SITE_CONFIG = {
  /** GitHub repo URL */
  githubRepo: process.env.NEXT_PUBLIC_GITHUB_REPO ?? "https://github.com/spawulski/warscroll-builder",

  /** Tip/donation URL (Ko-fi) */
  tipUrl: process.env.NEXT_PUBLIC_TIP_URL ?? "https://ko-fi.com/stephenpawulski",
} as const;
