import { supabase } from './supabase.js'

// Direct messages (schema.sql: MESSAGES, migration 007). The database decides
// who may write to whom; these helpers only read and send.

export const KINDS = [
  { value: 'general', label: 'Message' },
  { value: 'support', label: 'Support' },
  { value: 'instruction', label: 'Instruction' },
  { value: 'correction', label: 'Correction' },
]

export const kindLabel = (kind) => KINDS.find((k) => k.value === kind)?.label ?? 'Message'

export const ROLE_LABEL = { admin: 'Admin', mentor: 'Mentor', student: 'Student' }

export const MAX_MESSAGE = 4000

// Errors that mean migration 007 has not been run yet.
export const isNotSetUp = (error) => ['PGRST202', 'PGRST205', '42P01', '42883'].includes(error?.code)

const must = ({ data, error }) => {
  if (error) throw error
  return data
}

export const loadConversations = () => supabase.rpc('my_conversations').then(must)

export const loadContacts = () => supabase.rpc('message_contacts').then(must)

export function loadThread(me, other) {
  return supabase
    .from('messages')
    .select('id, sender_id, kind, body, created_at, read_at')
    .or(`and(sender_id.eq.${me},recipient_id.eq.${other}),and(sender_id.eq.${other},recipient_id.eq.${me})`)
    .order('created_at')
    .then(must)
}

export function sendMessage(me, to, body, kind = 'general') {
  return supabase
    .from('messages')
    .insert({ sender_id: me, recipient_id: to, body: body.trim(), kind })
    .then(({ error }) => {
      if (error) throw error
    })
}

export const markRead = (other) => supabase.rpc('mark_messages_read', { p_other: other }).then(must)

// How many messages are waiting for this person (0 when messages are not set up yet).
export async function unreadCount(me) {
  const { count, error } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', me)
    .is('read_at', null)
  return error ? 0 : (count ?? 0)
}
