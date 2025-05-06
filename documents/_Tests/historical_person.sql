-- 1. Person table
CREATE TABLE Person (
    id UUID PRIMARY KEY,
    first_name TEXT NOT NULL,
    middle_names TEXT,
    last_name TEXT NOT NULL,
    gender TEXT,
    birth_date DATE,
    birth_place TEXT,
    death_date DATE,
    death_place TEXT,
    age_at_death INTEGER,
    burial_place TEXT,
    occupation TEXT,
    notes TEXT
);

-- 2. Event table
CREATE TABLE Event (
    id UUID PRIMARY KEY,
    person_id UUID REFERENCES Person(id),
    event_type TEXT NOT NULL, -- e.g., 'baptism', 'marriage', 'military_service'
    date DATE,
    location TEXT,
    description TEXT
);

-- 3. ParentChild table
CREATE TABLE ParentChild (
    id UUID PRIMARY KEY,
    parent_id UUID REFERENCES Person(id),
    child_id UUID REFERENCES Person(id)
);

-- 4. Marriage table
CREATE TABLE Marriage (
    id UUID PRIMARY KEY,
    person1_id UUID REFERENCES Person(id),
    person2_id UUID REFERENCES Person(id),
    date DATE,
    location TEXT,
    book_page TEXT,
    notes TEXT
);

-- 5. MilitaryService table
CREATE TABLE MilitaryService (
    id UUID PRIMARY KEY,
    person_id UUID REFERENCES Person(id),
    war TEXT,
    service_no TEXT,
    rank TEXT,
    enlist_date DATE,
    discharge_date DATE,
    medals TEXT
);