-- Giveaways table
CREATE TABLE IF NOT EXISTS giveaways (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  prize_type    TEXT NOT NULL DEFAULT 'announcement', -- 'wallet' | 'announcement' | 'custom'
  prize_amount  NUMERIC DEFAULT 0,           -- for wallet type (in Naira/units)
  prize_label   TEXT DEFAULT '',             -- e.g. "₦5,000 airtime" for announcement/custom
  claim_fields  JSONB DEFAULT '[]',          -- [{label:"Phone Number",required:true}, ...]
  tasks         JSONB DEFAULT '[]',          -- [{id,label,type,value,bonus_entries}]
  entry_count   INT DEFAULT 0,
  active        BOOLEAN DEFAULT false,
  ended         BOOLEAN DEFAULT false,
  winner_id     TEXT DEFAULT '',             -- student id_number of winner
  winner_name   TEXT DEFAULT '',
  winner_confirmed BOOLEAN DEFAULT false,
  deadline      TIMESTAMPTZ,
  image_url     TEXT DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Giveaway entries table
CREATE TABLE IF NOT EXISTS giveaway_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  giveaway_id   UUID NOT NULL REFERENCES giveaways(id) ON DELETE CASCADE,
  student_id    TEXT NOT NULL,               -- id_number
  student_name  TEXT NOT NULL,
  student_email TEXT NOT NULL DEFAULT '',
  entries       INT DEFAULT 1,              -- base 1 + bonus from tasks
  tasks_done    JSONB DEFAULT '[]',          -- completed task ids
  claim_data    JSONB DEFAULT '{}',          -- {fieldLabel: value}
  claim_submitted BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(giveaway_id, student_id)
);

CREATE INDEX IF NOT EXISTS giveaway_entries_giveaway_idx ON giveaway_entries(giveaway_id);
CREATE INDEX IF NOT EXISTS giveaway_entries_student_idx  ON giveaway_entries(student_id);
