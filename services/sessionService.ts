import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@/types';
const KEY = 'heycoach_sessions_v1';
async function read(): Promise<Session[]> { try { return JSON.parse((await AsyncStorage.getItem(KEY)) || '[]'); } catch { return []; } }
async function write(items: Session[]) { await AsyncStorage.setItem(KEY, JSON.stringify(items)); }
export async function fetchSessions(_userId: string) { return (await read()).sort((a,b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt)); }
export async function createSession(_userId: string, session: Omit<Session,'id'|'snoozeCount'|'status'>): Promise<Session> { const item: Session = { ...session, id: `session-${Date.now()}-${Math.random().toString(36).slice(2)}`, snoozeCount: 0, status: 'pending' }; const items = await read(); await write([...items, item]); return item; }
export async function markSessionComplete(id: string) { const items = await read(); const item = items.find(s=>s.id===id); if (!item) throw new Error('Session not found'); item.status='completed'; await write(items); return item; }
export async function updateCoachMessage(id: string, message: string) { const items=await read(); const item=items.find(s=>s.id===id); if(item) item.coachMessage=message; await write(items); }
export async function snoozeSessionById(id: string, count: number) { const items=await read(); const item=items.find(s=>s.id===id); if(!item) throw new Error('Session not found'); item.snoozeCount=count; item.scheduledAt=new Date(Date.now()+5*60*1000).toISOString(); await write(items); return item; }
