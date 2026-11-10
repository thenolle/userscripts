const signatures: readonly [string, string][] = [
	['prisma', 'generator client {'],
	['prisma', 'datasource db {'],
	['terraform', 'terraform {'],
	['terraform', 'resource "'],
	['terraform', 'provider "'],
	['vue', '<template>'],
	['svelte', '{#each '],
	['svelte', '{#if '],
	['svelte', '$state('],
	['mermaid', 'flowchart '],
	['mermaid', 'sequenceDiagram'],
	['mermaid', 'classDiagram'],
	['mermaid', 'erDiagram'],
	['plantuml', '@startuml'],
	['nix', '{ pkgs ? import <nixpkgs>'],
	['nix', 'stdenv.mkDerivation'],
	['wgsl', '@compute'],
	['wgsl', '@vertex'],
	['wgsl', '@fragment'],
	['glsl', '#version 330'],
	['glsl', '#version 450'],
	['cobol', 'IDENTIFICATION DIVISION.'],
	['fortran', 'implicit none']
]

export const detectExtraLanguage = (source: string): string | null => {
	const sample = source.slice(0, 6_000)
	const lines = sample.split('\n').slice(0, 120).map((line) => line.trim())
	const matches = new Set<string>()
	for (const [language, prefix] of signatures) {
		if (lines.some((line) => line.startsWith(prefix))) matches.add(language)
	}
	return matches.size === 1 ? [...matches][0]! : null
}
