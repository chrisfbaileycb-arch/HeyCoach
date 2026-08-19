import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Goal, Session } from '@/types';
const KEY='heycoach_goals_v1';
async function read(): Promise<Goal[]> { try { return JSON.parse((await AsyncStorage.getItem(KEY)) || '[]'); } catch { return []; } }
async function write(items: Goal[]) { await AsyncStorage.setItem(KEY, JSON.stringify(items)); }
export async function fetchGoals(_userId:string, sessions: Pick<Session,'id'|'linkedGoalId'>[]) { const items=await read(); return items.map(g=>({...g, linkedSessionIds:sessions.filter(s=>s.linkedGoalId===g.id).map(s=>s.id)})); }
export async function updateGoalStatus(id:string,status:Goal['status']) { const items=await read(); const item=items.find(g=>g.id===id); if(item)item.status=status; await write(items); }
export async function createGoal(_userId:string, goal:Omit<Goal,'id'|'linkedSessionIds'|'status'>):Promise<Goal> { const item:Goal={...goal,id:`goal-${Date.now()}-${Math.random().toString(36).slice(2)}`,linkedSessionIds:[],status:'pending'}; const items=await read(); await write([...items,item]); return item; }
