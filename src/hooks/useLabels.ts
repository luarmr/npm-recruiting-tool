import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Label } from '../types';
import { useAuthUI } from '../context/AuthUIContext';

export function useLabels(teamId?: string | null) {
    const [labels, setLabels] = useState<Label[]>([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuthUI();

    useEffect(() => {
        if (!user) {
            setLabels([]);
            return;
        }
        fetchLabels();
    }, [user, teamId]);

    const fetchLabels = async () => {
        try {
            setLoading(true);
            let query = supabase.from('labels').select('*');

            if (teamId) {
                query = query.eq('team_id', teamId);
            } else {
                query = query.is('team_id', null).eq('user_id', user?.id);
            }

            const { data, error } = await query;
            if (error) throw error;
            setLabels(data || []);
        } catch (err) {
            console.error('Error fetching labels:', err);
        } finally {
            setLoading(false);
        }
    };

    const createLabel = async (name: string, color: string) => {
        if (!user) return null;

        try {
            const newLabel = {
                name,
                color,
                team_id: teamId || null,
                user_id: teamId ? null : user.id
            };

            const { data, error } = await supabase
                .from('labels')
                .insert(newLabel)
                .select()
                .single();

            if (error) throw error;
            setLabels(prev => [...prev, data]);
            return data;
        } catch (err) {
            console.error('Error creating label:', err);
            throw err;
        }
    };

    const assignLabel = async (candidateId: number, labelId: number) => {
        try {
            const { error } = await supabase
                .from('saved_candidate_labels')
                .insert({ saved_candidate_id: candidateId, label_id: labelId });

            if (error) throw error;
        } catch (err) {
            console.error('Error assigning label:', err);
            throw err;
        }
    };

    const removeLabel = async (candidateId: number, labelId: number) => {
        try {
            const { error } = await supabase
                .from('saved_candidate_labels')
                .delete()
                .eq('saved_candidate_id', candidateId)
                .eq('label_id', labelId);

            if (error) throw error;
        } catch (err) {
            console.error('Error removing label:', err);
            throw err;
        }
    };

    return {
        labels,
        loading,
        createLabel,
        assignLabel,
        removeLabel,
        refreshLabels: fetchLabels
    };
}
