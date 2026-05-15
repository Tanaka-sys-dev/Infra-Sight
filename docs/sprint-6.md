# Sprint 6: Deployment, Demo Mode, PDF Export, and Final Polish

## Overview
Sprint 6 prepares InfraSight for production deployment and final dissertation submission. It resolves the Vite bundle warning through code splitting, adds PDF export for evaluation evidence, adds examiner Demo Mode, creates Vercel and Render deployment configuration, and documents GitHub and examiner demonstration steps.

## Code Splitting
The Vite build now separates core application code, vendor libraries, Firebase, and Recharts into manual chunks. This removes the previous large chunk warning and produces smaller deployable assets.

## PDF Export
The Evaluation dashboard now includes an Export PDF Report button powered by jsPDF. The PDF includes a title page, operational KPI comparison, model performance, top feature importances, system activity summary, Firebase mode, and a Great Zimbabwe University footer.

## Demo Mode
Demo Mode provides an examiner-focused presentation overlay. It shows a yellow examination banner on all pages, provides a floating guide panel, refreshes the Dashboard every 10 seconds, and auto-runs high CPU simulation for `srv-001` every 15 seconds on its device detail page.

## Deployment Configuration
Frontend deployment uses Vercel with SPA rewrites and security headers. Backend deployment uses Render with Python build/start commands and Firebase environment variable placeholders.

## Verification
Sprint 6 verification includes backend import, frontend production build, full `verify-all.ps1`, sensitive file checks, and Git commit history validation.
