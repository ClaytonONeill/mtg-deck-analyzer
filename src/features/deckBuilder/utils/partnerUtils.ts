// Types
import type { ScryfallCard } from '@/types';

export type PartnerType = 'specific' | 'generic' | 'none';

export interface PartnerInfo {
  type: PartnerType;
  requiredPartnerName: string | null;
}

export function getPartnerInfo(card: ScryfallCard): PartnerInfo {
  const oracle = card.oracle_text?.toLowerCase() ?? '';

  // Check specific partner first — "Partner with [Name]"
  const specificMatch = card.oracle_text?.match(/Partner with ([^(\n]+)/i);
  if (specificMatch) {
    return {
      type: 'specific',
      requiredPartnerName: specificMatch[1].trim(),
    };
  }

  // Generic partner — word "partner" exists but not "partner with"
  if (/\bpartner\b/.test(oracle)) {
    return { type: 'generic', requiredPartnerName: null };
  }

  return { type: 'none', requiredPartnerName: null };
}

export function isValidPartner(
  commander: ScryfallCard,
  candidate: ScryfallCard,
): { valid: boolean; reason: string | null } {
  const commanderPartner = getPartnerInfo(commander);
  const candidatePartner = getPartnerInfo(candidate);

  if (commanderPartner.type === 'none') {
    return {
      valid: false,
      reason: `${commander.name} does not have the Partner keyword.`,
    };
  }

  if (commanderPartner.type === 'specific') {
    const required = commanderPartner.requiredPartnerName?.toLowerCase();
    if (candidate.name.toLowerCase() !== required) {
      return {
        valid: false,
        reason: `${commander.name} must partner with ${commanderPartner.requiredPartnerName}.`,
      };
    }
    // For specific partners, candidate doesn't need to have partner keyword itself
    return { valid: true, reason: null };
  }

  // Generic — candidate must also have the partner keyword
  if (candidatePartner.type === 'none') {
    return {
      valid: false,
      reason: `${candidate.name} does not have the Partner keyword and cannot pair with ${commander.name}.`,
    };
  }

  return { valid: true, reason: null };
}

export function mergeColorIdentities(a: string[], b: string[]): string[] {
  const ORDER = ['W', 'U', 'B', 'R', 'G'];
  const merged = new Set([...a, ...b]);
  return ORDER.filter((c) => merged.has(c));
}
