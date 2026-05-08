import { supabase } from '../lib/supabaseClient';

function requireSupabase() {
    if (!supabase) {
        throw new Error('Supabase is not configured. Add frontend/.env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    }
    return supabase;
}

function normalizeSession(row, messages = []) {
    return {
        id: row.id,
        preview: row.preview || '',
        timestamp: row.updated_at || row.created_at || Date.now(),
        messages,
    };
}

function normalizeMessage(row) {
    return {
        role: row.role,
        content: row.content,
        sources: Array.isArray(row.sources) ? row.sources : [],
        timestamp: row.created_at || Date.now(),
    };
}

export async function loadChatHistory() {
    const client = requireSupabase();
    const { data: userData, error: userError } = await client.auth.getUser();

    if (userError) {
        throw userError;
    }

    if (!userData.user) {
        return { sessions: [], user: null };
    }

    const { data: sessionsData, error: sessionsError } = await client
        .from('chat_sessions')
        .select('id, preview, created_at, updated_at')
        .order('updated_at', { ascending: false });

    if (sessionsError) {
        throw sessionsError;
    }

    if (!sessionsData || sessionsData.length === 0) {
        return { sessions: [], user: userData.user };
    }

    const sessionIds = sessionsData.map((session) => session.id);
    const { data: messagesData, error: messagesError } = await client
        .from('chat_messages')
        .select('id, session_id, role, content, sources, created_at')
        .in('session_id', sessionIds)
        .order('created_at', { ascending: true });

    if (messagesError) {
        throw messagesError;
    }

    const messagesBySession = new Map();
    for (const message of messagesData || []) {
        const existing = messagesBySession.get(message.session_id) || [];
        existing.push(normalizeMessage(message));
        messagesBySession.set(message.session_id, existing);
    }

    return {
        user: userData.user,
        sessions: sessionsData.map((session) => normalizeSession(session, messagesBySession.get(session.id) || [])),
    };
}

export async function createChatSession(preview = '') {
    const client = requireSupabase();
    const { data: userData, error: userError } = await client.auth.getUser();

    if (userError) {
        throw userError;
    }

    if (!userData.user) {
        throw new Error('Please sign in to create chat history.');
    }

    const { data, error } = await client
        .from('chat_sessions')
        .insert([{ user_id: userData.user.id, preview }])
        .select('id, preview, created_at, updated_at')
        .single();

    if (error) {
        throw error;
    }

    return normalizeSession(data, []);
}

export async function appendChatMessage({ sessionId, role, content, sources = [] }) {
    const client = requireSupabase();
    const { data: userData, error: userError } = await client.auth.getUser();

    if (userError) {
        throw userError;
    }

    if (!userData.user) {
        throw new Error('Please sign in to save chat history.');
    }

    const { data, error } = await client
        .from('chat_messages')
        .insert([
            {
                user_id: userData.user.id,
                session_id: sessionId,
                role,
                content,
                sources,
            },
        ])
        .select('id, session_id, role, content, sources, created_at')
        .single();

    if (error) {
        throw error;
    }

    return normalizeMessage(data);
}

export async function deleteChatSession(sessionId) {
    const client = requireSupabase();
    const { error } = await client.from('chat_sessions').delete().eq('id', sessionId);

    if (error) {
        throw error;
    }
}