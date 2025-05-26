--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: blog_posts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.blog_posts (
    id integer NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    excerpt text NOT NULL,
    content text NOT NULL,
    image_url text,
    read_time_minutes integer DEFAULT 5,
    is_published boolean DEFAULT false NOT NULL,
    published_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    category text DEFAULT 'general'::text NOT NULL
);


ALTER TABLE public.blog_posts OWNER TO neondb_owner;

--
-- Name: blog_posts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.blog_posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.blog_posts_id_seq OWNER TO neondb_owner;

--
-- Name: blog_posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.blog_posts_id_seq OWNED BY public.blog_posts.id;


--
-- Name: classes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.classes (
    id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    age_group_min integer NOT NULL,
    age_group_max integer NOT NULL,
    price text,
    is_featured boolean DEFAULT false NOT NULL,
    venue text NOT NULL,
    address text NOT NULL,
    postcode text NOT NULL,
    latitude numeric(10,8),
    longitude numeric(10,8),
    day_of_week text NOT NULL,
    "time" text NOT NULL,
    contact_email text,
    contact_phone text,
    website text,
    category text NOT NULL,
    rating numeric(3,2),
    review_count integer DEFAULT 0,
    popularity integer DEFAULT 0,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    phone character varying(20),
    town text,
    whatsapp_number text,
    instagram_handle text,
    facebook_page text,
    parking_available boolean,
    parking_type text,
    parking_notes text,
    nearest_tube_station text,
    nearest_bus_stops text[],
    transport_accessibility text,
    venue_accessibility text,
    accessibility_notes text
);


ALTER TABLE public.classes OWNER TO neondb_owner;

--
-- Name: classes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.classes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.classes_id_seq OWNER TO neondb_owner;

--
-- Name: classes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.classes_id_seq OWNED BY public.classes.id;


--
-- Name: newsletters; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.newsletters (
    id integer NOT NULL,
    email text NOT NULL,
    postcode text,
    is_active boolean DEFAULT true NOT NULL,
    subscribed_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.newsletters OWNER TO neondb_owner;

--
-- Name: newsletters_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.newsletters_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.newsletters_id_seq OWNER TO neondb_owner;

--
-- Name: newsletters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.newsletters_id_seq OWNED BY public.newsletters.id;


--
-- Name: outscraper_import_log; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.outscraper_import_log (
    id integer NOT NULL,
    file_name text,
    total_rows integer,
    imported_count integer,
    skipped_count integer,
    import_date timestamp without time zone DEFAULT now()
);


ALTER TABLE public.outscraper_import_log OWNER TO neondb_owner;

--
-- Name: outscraper_import_log_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.outscraper_import_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.outscraper_import_log_id_seq OWNER TO neondb_owner;

--
-- Name: outscraper_import_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.outscraper_import_log_id_seq OWNED BY public.outscraper_import_log.id;


--
-- Name: blog_posts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.blog_posts ALTER COLUMN id SET DEFAULT nextval('public.blog_posts_id_seq'::regclass);


--
-- Name: classes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.classes ALTER COLUMN id SET DEFAULT nextval('public.classes_id_seq'::regclass);


--
-- Name: newsletters id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.newsletters ALTER COLUMN id SET DEFAULT nextval('public.newsletters_id_seq'::regclass);


--
-- Name: outscraper_import_log id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.outscraper_import_log ALTER COLUMN id SET DEFAULT nextval('public.outscraper_import_log_id_seq'::regclass);


--
-- Data for Name: blog_posts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.blog_posts (id, title, slug, excerpt, content, image_url, read_time_minutes, is_published, published_at, created_at, category) FROM stdin;
1	Weaning Your Baby: A Science-Backed Guide for First-Time Parents	weaning-baby-science-backed-guide	The gradual transition from milk to solid food is one of your baby's biggest milestones. Learn evidence-based weaning methods, time-saving hacks, and eco-friendly tips to make this journey rewarding...	<h1>🥄 Weaning Your Baby: A Science-Backed Guide for First-Time Parents</h1>\n<p>Weaning—the gradual transition from milk to solid food—is one of your baby's biggest milestones. It can feel overwhelming, but with a little preparation and the right tools, it can also be one of the most rewarding stages of early parenthood.</p>\n\n<h2>📆 When Should You Start Weaning?</h2>\n<p>The NHS and World Health Organization recommend starting weaning at <strong>around 6 months</strong>. At this stage, most babies:</p>\n<ul>\n    <li>Can sit up with minimal support</li>\n    <li>Show interest in food</li>\n    <li>Have lost the tongue-thrust reflex</li>\n</ul>\n\n<h2>🍽️ Weaning Methods</h2>\n<h3>1. Traditional (Spoon-fed) Weaning</h3>\n<p>✅ Easy to batch-cook and freeze, good for iron-rich foods.<br>⚠️ Avoid processed jars and pouches.</p>\n\n<h3>2. Baby-Led Weaning (BLW)</h3>\n<p>✅ Encourages independence and texture exploration.<br>⚠️ Avoid hard foods that can cause choking.</p>\n\n<p>💡 Most parents combine both methods.</p>\n\n<h2>🧠 What the Science Says</h2>\n<ul>\n    <li>Babies need iron-rich foods from 6 months.</li>\n    <li>Early exposure to allergens may reduce allergy risk.</li>\n    <li>Variety early may reduce picky eating.</li>\n</ul>\n\n<h2>🧊 Time-Saving Hacks</h2>\n<ul>\n    <li>Freeze purees in ice cube trays.</li>\n    <li>Use a Magic Bullet Blender for batch prep.</li>\n    <li>Label & date food with reusable chalkboard labels.</li>\n    <li>Use reusable silicone pouches.</li>\n</ul>\n\n<h2>🌍 Eco-Friendly Tips</h2>\n<ul>\n    <li>Use bamboo/silicone feeding tools.</li>\n    <li>Avoid plastic pouches – use jars or reusables.</li>\n    <li>Download our Dirty Dozen & Clean Fifteen Poster below.</li>\n</ul>\n\n<h2>📱 App Tip: Try Yuka</h2>\n<p>Yuka is a free mobile app that scans barcodes to rate food and cosmetic health scores. It's perfect for checking toddler snacks or baby food ingredients.</p>\n\n<h2>❌ Why Avoid Processed Baby Food</h2>\n<p>Shop-bought baby foods often contain fruit-heavy purees, low protein/fat, and hidden sugars. A 2020 study by First Steps Nutrition Trust showed many lack the nutritional variety babies need.</p>\n\n<h2>📥 Freebies</h2>\n<ul>\n    <li>📥 Download Dirty Dozen & Clean Fifteen Poster (PDF)</li>\n    <li>📥 Download Weekly Weaning Meal Planner (PDF)</li>\n</ul>\n\n<p><em>Some links in this post may be affiliate links. If you click and buy, we may earn a small commission at no extra cost to you. Thank you for supporting our eco-conscious parenting content!</em></p>	https://images.unsplash.com/photo-1609501676725-7186f66a0db6?ixlib=rb-4.0.3	8	t	2025-05-25 11:48:30.088721	2025-05-26 11:48:30.088721	nutrition,baby-to-toddler
2	Understanding Your Newborn: Decoding Cries, Cues, and Common Concerns	understanding-newborn-behavior	Master the art of understanding your newborn with our comprehensive guide to baby cries, body language, and behavioral cues. Includes free downloadable cheat sheet.	<h1>Understanding Your Newborn: Decoding Cries, Cues, and Common Concerns</h1>\n\n<p>Bringing your newborn home is one of life's most magical moments—and also one of the most overwhelming. Every sound, every cry, every little movement can leave new parents wondering: "What is my baby trying to tell me?"</p>\n\n<p>This comprehensive guide will help you decode your newborn's language, understand their needs, and build confidence in those precious early weeks.</p>\n\n<div style="background: linear-gradient(135deg, #e8f5e8 0%, #f0f9ff 100%); padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #10b981;">\n<h3 style="margin-top: 0; color: #065f46;">📥 FREE Download: Newborn Cries & Cues Cheat Sheet</h3>\n<p style="margin-bottom: 16px;">Get our beautifully designed quick-reference guide that you can keep by your bedside table. Perfect for those 3am moments when you need instant guidance!</p>\n<a href="/downloads/Newborn_Cries_and_Cues_Cheat_Sheet_Updated.pdf" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">Download Free Cheat Sheet</a>\n</div>\n\n<h2>🍼 Decoding Different Types of Cries</h2>\n\n<h3>1. The Hunger Cry</h3>\n<p><strong>What it sounds like:</strong> Short, rhythmic, and repetitive cries that become increasingly intense.</p>\n<p><strong>When it happens:</strong> Usually 2-3 hours after the last feed, but newborns can cluster feed.</p>\n<p><strong>What to do:</strong> Offer breast or bottle. Look for early hunger cues like rooting or lip-smacking.</p>\n\n<h3>2. The Tired Cry</h3>\n<p><strong>What it sounds like:</strong> Continuous, whiny cry that may sound frustrated or cranky.</p>\n<p><strong>When it happens:</strong> After being awake for 1-2 hours, or when overstimulated.</p>\n<p><strong>What to do:</strong> Create a calm environment, swaddle, and help baby settle for sleep.</p>\n\n<h3>3. The Discomfort Cry</h3>\n<p><strong>What it sounds like:</strong> Persistent crying that stops briefly, then continues. May sound distressed.</p>\n<p><strong>When it happens:</strong> When baby has a dirty nappy, is too hot/cold, or has trapped wind.</p>\n<p><strong>What to do:</strong> Check nappy, adjust clothing, try burping positions, or offer comfort.</p>\n\n<h3>4. The "I Need Attention" Cry</h3>\n<p><strong>What it sounds like:</strong> Often starts as a whimper and escalates if no response.</p>\n<p><strong>When it happens:</strong> When baby wants interaction, cuddles, or stimulation.</p>\n<p><strong>What to do:</strong> Talk to baby, make eye contact, offer gentle touch or movement.</p>\n\n<h2>👶 Reading Your Baby's Body Language</h2>\n\n<h3>Happy & Content Signals</h3>\n<ul>\n<li>Relaxed body posture</li>\n<li>Steady, rhythmic breathing</li>\n<li>Alert but calm facial expression</li>\n