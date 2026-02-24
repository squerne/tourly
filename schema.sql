-- TOURLY SCHEMA
-- Execute this sql script on your PostgreSQL database to initialize the Tourly tables.

CREATE TABLE IF NOT EXISTS tours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    page_path TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    shadow_rgb TEXT DEFAULT '0,0,0',
    shadow_opacity TEXT DEFAULT '0.2',
    interact BOOLEAN DEFAULT false,
    card_transition JSONB,
    show_condition JSONB,
    bg_color TEXT DEFAULT '#ffffff',
    text_color TEXT DEFAULT '#000000',
    font_family TEXT DEFAULT 'inherit',
    device_visibility TEXT DEFAULT 'all', -- 'all', 'desktop', 'mobile'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    order_index INT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    icon TEXT,
    selector TEXT NOT NULL,
    side TEXT DEFAULT 'bottom',
    show_controls BOOLEAN DEFAULT true,
    pointer_padding INT DEFAULT 10,
    pointer_radius INT DEFAULT 10,
    next_route TEXT,
    prev_route TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Tourly
CREATE INDEX IF NOT EXISTS idx_tours_page_path ON tours(page_path);
CREATE INDEX IF NOT EXISTS idx_tours_is_active ON tours(is_active);
CREATE INDEX IF NOT EXISTS idx_steps_tour_id ON steps(tour_id);
CREATE INDEX IF NOT EXISTS idx_steps_order_index ON steps(order_index);
