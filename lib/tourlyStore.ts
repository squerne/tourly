import { query, withTransaction } from '../db';

export interface Tour {
    id: string;
    tour_id: string;
    name: string;
    description: string | null;
    page_path: string;
    is_active: boolean;
    shadow_rgb: string;
    shadow_opacity: string;
    interact: boolean;
    card_transition: any;
    show_condition: any;
    bg_color: string;
    text_color: string;
    font_family: string;
    device_visibility: 'all' | 'desktop' | 'mobile';
    created_at: Date;
    updated_at: Date;
    steps_count?: number; // Added via join in list queries
    steps?: Step[]; // Added when fetching a specific tour
}

export interface Step {
    id: string;
    tour_id: string;
    order_index: number;
    title: string;
    content: string;
    icon: string | null;
    selector: string;
    side: string;
    show_controls: boolean;
    pointer_padding: number;
    pointer_radius: number;
    next_route: string | null;
    prev_route: string | null;
    translations?: Record<string, { title: string; content: string }>;
    created_at: Date;
    updated_at: Date;
}

export const tourlyStore = {
    // ---------------------------------------------------------
    // TOURS
    // ---------------------------------------------------------

    getTours: async (search?: string, filterActive?: string): Promise<Tour[]> => {
        let sql = `
            SELECT t.*, COUNT(s.id) as steps_count
            FROM tours t
            LEFT JOIN steps s ON s.tour_id = t.id
            WHERE 1=1
        `;
        const params: any[] = [];
        let paramIndex = 1;

        if (search) {
            sql += ` AND (t.name ILIKE $${paramIndex} OR t.page_path ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (filterActive === 'active') {
            sql += ` AND t.is_active = true`;
        } else if (filterActive === 'inactive') {
            sql += ` AND t.is_active = false`;
        }

        sql += ` GROUP BY t.id ORDER BY t.created_at DESC`;

        const res = await query(sql, params);
        return res.rows.map(row => ({
            ...row,
            steps_count: parseInt(row.steps_count, 10)
        }));
    },

    getTourById: async (id: string): Promise<Tour | null> => {
        const res = await query(`SELECT * FROM tours WHERE id = $1`, [id]);
        if (res.rows.length === 0) return null;
        const tour = res.rows[0];

        const stepsRes = await query(`SELECT * FROM steps WHERE tour_id = $1 ORDER BY order_index ASC`, [id]);
        tour.steps = stepsRes.rows;

        return tour;
    },

    createTour: async (data: Partial<Tour>): Promise<Tour> => {
        const res = await query(
            `INSERT INTO tours (
                tour_id, name, description, page_path, is_active, 
                shadow_rgb, shadow_opacity, interact, card_transition, show_condition,
                bg_color, text_color, font_family, device_visibility
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
            [
                data.tour_id, data.name, data.description, data.page_path,
                data.is_active ?? true, data.shadow_rgb || '0,0,0',
                data.shadow_opacity || '0.2', data.interact || false,
                data.card_transition, data.show_condition,
                data.bg_color || 'bg-white dark:bg-slate-900',
                data.text_color || 'text-slate-600 dark:text-slate-400',
                data.font_family || 'font-sans',
                data.device_visibility || 'all'
            ]
        );
        return res.rows[0];
    },

    updateTour: async (id: string, data: Partial<Tour>): Promise<Tour> => {
        const fields: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        const updatableKeys = [
            'tour_id', 'name', 'description', 'page_path', 'is_active',
            'shadow_rgb', 'shadow_opacity', 'interact', 'card_transition', 'show_condition',
            'bg_color', 'text_color', 'font_family', 'device_visibility'
        ];

        for (const [key, value] of Object.entries(data)) {
            if (updatableKeys.includes(key)) {
                fields.push(`${key} = $${paramIndex}`);
                params.push(value);
                paramIndex++;
            }
        }

        if (fields.length === 0) throw new Error("No fields to update");

        fields.push(`updated_at = NOW()`);

        params.push(id);
        const sql = `UPDATE tours SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

        const res = await query(sql, params);
        return res.rows[0];
    },

    deleteTour: async (id: string): Promise<void> => {
        // Cascade delete on steps is set up via foreign key constraint
        await query(`DELETE FROM tours WHERE id = $1`, [id]);
    },

    toggleTourActive: async (id: string): Promise<Tour> => {
        const res = await query(
            `UPDATE tours SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 RETURNING *`,
            [id]
        );
        return res.rows[0];
    },

    duplicateTour: async (id: string): Promise<Tour> => {
        return withTransaction(async (client) => {
            // 1. Fetch existing tour
            const resData = await client.query(`SELECT * FROM tours WHERE id = $1`, [id]);
            if (resData.rows.length === 0) throw new Error("Tour not found");
            const originalTour = resData.rows[0];

            // 2. Generate new unique tour_id
            const timestamp = Date.now().toString().slice(-4);
            const newTourId = `${originalTour.tour_id}-copy-${timestamp}`;
            const newName = `${originalTour.name} (Copy)`;

            // 3. Insert new tour
            const newTourRes = await client.query(
                `INSERT INTO tours (
                    tour_id, name, description, page_path, is_active, 
                    shadow_rgb, shadow_opacity, interact, card_transition, show_condition,
                    bg_color, text_color, font_family, device_visibility
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
                [
                    newTourId, newName, originalTour.description, originalTour.page_path,
                    false, // duplicated tours start inactive
                    originalTour.shadow_rgb, originalTour.shadow_opacity, originalTour.interact,
                    originalTour.card_transition, originalTour.show_condition,
                    originalTour.bg_color, originalTour.text_color, originalTour.font_family,
                    originalTour.device_visibility
                ]
            );
            const newTour = newTourRes.rows[0];

            // 4. Copy steps
            const stepsRes = await client.query(`SELECT * FROM steps WHERE tour_id = $1 ORDER BY order_index ASC`, [id]);
            for (const step of stepsRes.rows) {
                await client.query(
                    `INSERT INTO steps (
                        tour_id, order_index, title, content, icon, selector, side, 
                        show_controls, pointer_padding, pointer_radius, next_route, prev_route
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                    [
                        newTour.id, step.order_index, step.title, step.content, step.icon, step.selector, step.side,
                        step.show_controls, step.pointer_padding, step.pointer_radius, step.next_route, step.prev_route
                    ]
                );
            }

            return newTour;
        });
    },

    // ---------------------------------------------------------
    // STEPS
    // ---------------------------------------------------------

    createStep: async (tour_id: string, data: Partial<Step>): Promise<Step> => {
        return withTransaction(async (client) => {
            // Get max order_index
            const maxOrderRes = await client.query(`SELECT MAX(order_index) as max_idx FROM steps WHERE tour_id = $1`, [tour_id]);
            const nextOrder = maxOrderRes.rows[0].max_idx !== null ? parseInt(maxOrderRes.rows[0].max_idx, 10) + 1 : 0;

            const res = await client.query(
                `INSERT INTO steps (
                    tour_id, order_index, title, content, icon, selector, side, 
                    show_controls, pointer_padding, pointer_radius, next_route, prev_route, translations
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
                [
                    tour_id, nextOrder, data.title, data.content, data.icon, data.selector, data.side || 'bottom',
                    data.show_controls ?? true, data.pointer_padding ?? 10, data.pointer_radius ?? 10,
                    data.next_route, data.prev_route, data.translations ? JSON.stringify(data.translations) : '{}'
                ]
            );
            return res.rows[0];
        });
    },

    updateStep: async (tour_id: string, step_id: string, data: Partial<Step>): Promise<Step> => {
        const fields: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        const updatableKeys = [
            'title', 'content', 'icon', 'selector', 'side',
            'show_controls', 'pointer_padding', 'pointer_radius', 'next_route', 'prev_route', 'translations'
        ];

        for (const [key, value] of Object.entries(data)) {
            if (updatableKeys.includes(key)) {
                fields.push(`${key} = $${paramIndex}`);
                params.push(value);
                paramIndex++;
            }
        }

        if (fields.length === 0) throw new Error("No fields to update");

        fields.push(`updated_at = NOW()`);

        params.push(step_id);
        params.push(tour_id);

        const sql = `UPDATE steps SET ${fields.join(', ')} WHERE id = $${paramIndex} AND tour_id = $${paramIndex + 1} RETURNING *`;

        const res = await query(sql, params);
        return res.rows[0];
    },

    deleteStep: async (tour_id: string, step_id: string): Promise<void> => {
        await withTransaction(async (client) => {
            await client.query(`DELETE FROM steps WHERE id = $1 AND tour_id = $2`, [step_id, tour_id]);
            // Re-sequence remaining steps
            await client.query(`
                WITH numbered AS (
                    SELECT id, row_number() OVER (ORDER BY order_index ASC) - 1 as new_order
                    FROM steps
                    WHERE tour_id = $1
                )
                UPDATE steps s
                SET order_index = n.new_order
                FROM numbered n
                WHERE s.id = n.id
            `, [tour_id]);
        });
    },

    reorderSteps: async (tour_id: string, updates: { id: string; order_index: number }[]): Promise<void> => {
        await withTransaction(async (client) => {
            for (const update of updates) {
                await client.query(
                    `UPDATE steps SET order_index = $1, updated_at = NOW() WHERE id = $2 AND tour_id = $3`,
                    [update.order_index, update.id, tour_id]
                );
            }
        });
    },

    // ---------------------------------------------------------
    // PUBLIC / FRONTEND EXPORTS
    // ---------------------------------------------------------

    getActiveToursByPage: async (pagePath: string, locale?: string, device?: string) => {
        // Fetch active tours matching the pagePath exactly, or as a suffix in either direction
        // e.g., URL is /en/dashboard, DB is /dashboard -> $1 LIKE '%' || page_path
        // e.g., URL is /dashboard, DB is /app/dashboard -> page_path LIKE '%' || $1
        const res = await query(`
            SELECT * FROM tours 
            WHERE (
                page_path = $1 
                OR $1 LIKE '%' || page_path
                OR page_path LIKE '%' || $1
            ) 
            AND is_active = true 
            AND (device_visibility = 'all' OR device_visibility = $2)
            ORDER BY created_at ASC
        `, [pagePath, device || 'all']);

        if (res.rows.length === 0) return { tours: [], config: null };

        const toursIds = res.rows.map(t => t.id);

        // Fetch steps for these tours
        const stepsRes = await query(`SELECT * FROM steps WHERE tour_id = ANY($1) ORDER BY order_index ASC`, [toursIds]);

        // Use the config from the FIRST tour returned
        const primaryTour = res.rows[0];
        const config = {
            shadowRgb: primaryTour.shadow_rgb,
            shadowOpacity: primaryTour.shadow_opacity,
            interact: primaryTour.interact,
            cardTransition: primaryTour.card_transition
                ? (typeof primaryTour.card_transition === 'string' ? JSON.parse(primaryTour.card_transition) : primaryTour.card_transition)
                : { type: "spring", duration: 300 },
            bgColor: primaryTour.bg_color,
            textColor: primaryTour.text_color,
            fontFamily: primaryTour.font_family
        };

        const tours: any[] = [];

        for (const tour of res.rows) {
            let skipTour = false;
            const tourSteps = stepsRes.rows.filter(s => s.tour_id === tour.id).map(s => {
                const translations = typeof s.translations === 'string' ? JSON.parse(s.translations) : s.translations || {};

                let stepTitle = s.title;
                let stepContent = s.content;

                // Base locales check (english is default)
                if (locale && !locale.startsWith('en')) {
                    if (!translations[locale] || !translations[locale].title || !translations[locale].content) {
                        skipTour = true;
                    } else {
                        stepTitle = translations[locale].title;
                        stepContent = translations[locale].content;
                    }
                }

                return {
                    icon: s.icon,
                    title: stepTitle,
                    content: stepContent,
                    selector: s.selector,
                    side: s.side,
                    showControls: s.show_controls,
                    pointerPadding: s.pointer_padding,
                    pointerRadius: s.pointer_radius,
                    nextRoute: s.next_route,
                    prevRoute: s.prev_route,
                    translations: translations
                };
            });

            if (!skipTour && tourSteps.length > 0) {
                tours.push({
                    tour: tour.tour_id,
                    steps: tourSteps
                });
            }
        }

        return { tours, config };
    }
};
