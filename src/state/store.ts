import { Sync } from '../features/sync/sync';
import type { AppState } from '../types/index';

export function blank() {
  return {
    profile: { code: '', name: '', cls: '', role: 'student' },
    assessments: [], programs: [], posts: [], audio: [], reminder: false
  };
}
export let S: AppState = blank();
export function setS(next: AppState) { S = next; }
export function save() { Sync.changed(); }
