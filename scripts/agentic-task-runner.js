#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map((s) => {
  const [k, v] = s.split('=');
  return [k.replace(/^--/, ''), v];
}));

const spec = args.spec ? fs.readFileSync(args.spec, 'utf8') : '';
const plan = args.plan ? fs.readFileSync(args.plan, 'utf8') : '';

console.log('--- Agentic Task Runner (placeholder) ---');
console.log('SPEC loaded:', args.spec ? path.resolve(args.spec) : 'none');
console.log('PLAN loaded:', args.plan ? path.resolve(args.plan) : 'none');
console.log('\nThis script is a placeholder to integrate your CLI-based coding agent.');
console.log('Wire it to your tool (e.g., Codex CLI) and pass prompt files from ./prompts.');
