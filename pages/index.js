import { useState, useEffect } from "react";
import Head from "next/head";

const FREE_LIMIT = 5;
const COOKIE_KEY = "cc_uses";
// ─── Replace these with your real Stripe Payment Links ───
const STRIPE_SINGLE = "https://buy.stripe.com/00w9ATg8l4kX6076nC93y00";
const STRIPE_AGENCY = "https://buy.stripe.com/8x25kD09n9Fh88f7rG93y01";
// ─────────────────────────────────────────────────────────

const FEATURES = [
  "Pool","Hot tub","Open floor plan","Hardwood floors","Gourmet kitchen",
  "Smart home tech","Solar panels","2-car garage","Mountain views","Waterfront",
  "Home office","Walk-in closet","Fireplace","High ceilings","New roof",
  "Updated HVAC","Basement","In-law suite","Outdoor kitchen","Corner lot",
  "Cul-de-sac","Community amenities","Pet-friendly","No HOA","Move-in ready",
];

const TONES = [
  { id: "Luxury & prestige",      label: "Luxury & prestige",      desc: "Elevated language for high-end buyers seeking exclusivity" },
  { id: "Family & lifestyle",     label: "Family & lifestyle",      desc: "Warm, approachable copy focused on schools, space & community" },
  { id: "Investment opportunity", label: "Investment opportunity",  desc: "ROI-focused language for investors and landlords" },
  { id: "Vacation & second home", label: "Vacation & second home",  desc: "Retreat vibes for buyers seeking a getaway or short-term rental" },
  { id: "Professional / MLS",     label: "Professional / MLS",      desc: "Clean, factual copy for listing portals and MLS submissions" },
  { id: "First-time buyer",       label: "First-time buyer",        desc: "Encouraging, jargon-free tone for new homebuyers" },
];

const TONE_INSTRUCTIONS = {
  "Luxury & prestige":      "Write in an elevated, aspirational tone. Use sophisticated vocabulary. Emphasize exclusivity, craftsmanship, and lifestyle. Avoid anything that sounds common or ordinary. Headlines should feel premium and evocative.",
  "Family & lifestyle":     "Write in a warm, inviting tone. Focus on livability — schools, neighborhood, space for kids, community feel. Use language that paints a picture of daily life in the home.",
  "Investment opportunity": "Write in a data-driven, ROI-focused tone. Emphasize rental potential, appreciation, cap rate, location fundamentals, and low-maintenance features.",
  "Vacation & second home": "Write in a relaxed, aspirational tone that evokes escape, retreat, and enjoyment. Emphasize proximity to nature, amenities, and the feeling of getting away.",
  "Professional / MLS":     "Write in clean, factual, neutral real estate language. Lead with key specs. Avoid flowery language. Suitable for MLS submissions, Zillow, and Realtor.com.",
  "First-time buyer":       "Write in an encouraging, accessible tone. Avoid jargon. Emphasize move-in readiness, value, and approachability.",
};

// ── Cookie helpers ──────────────────────────────────────
function getUses() {
  if (typeof document === "undefined") return 0;
  const match = document.cookie.match(new RegExp("(?:^|; )" + COOKIE_KEY + "=([^;]*)"));
  return match ? parseInt(match[1], 10) : 0;
}
function incrementUses() {
  const next = getUses() + 1;
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `${COOKIE_KEY}=${next}; expires=${expires.toUTCString()}; path=/`;
  return next;
}
// ────────────────────────────────────────────────────────

export default function Home() {
  const [form, setForm] = useState({
    propType: "Single-family home", address: "", price: "",
    sqft: "", beds: "", baths: "", yearBuilt: "", notes: "",
  });
  const [selectedFeatures, setSelectedFeatures] = useState(new Set());
  const [tone, setTone]       = useState("Professional / MLS");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [results, setResults] = useState(null);
  const [activeSocial, setActiveSocial] = useState("linkedin");
  const [copied, setCopied]   = useState("");
  const [usesLeft, setUsesLeft] = useState(FREE_LIMIT);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    setUsesLeft(Math.max(0, FREE_LIMIT - getUses()));
  }, []);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const toggleFeature = (f) => {
    setSelectedFeatures((prev) => {
      const next = new Set(prev);
      next.has(f) ? next.delete(f) : next.add(f);
      return next;
    });
  };

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(""), 1800);
    });
  };

  const generate = async () => {
    const uses = getUses();
    if (uses >= FREE_LIMIT) { setShowPaywall(true); return; }

    setLoading(true); setError(""); setResults(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, features: [...selectedFeatures], tone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      const newCount = incrementUses();
      setUsesLeft(Math.max(0, FREE_LIMIT - newCount));
      setResults(data);
      setActiveSocial("linkedin");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const social      = results?.[activeSocial] || {};
  const activeTone  = TONES.find((t) => t.id === tone);

  return (
    <>
      <Head>
        <title>CurbCopy.ai — Real Estate Listing Content Generator</title>
        <meta name="description" content="AI-powered real estate listing content. Generate headlines, MLS descriptions, and social media posts in seconds." />
        <meta property="og:title" content="CurbCopy.ai" />
        <meta property="og:description" content="AI-generated real estate listing content — headlines, descriptions, and social posts." />
        <meta property="og:url" content="https://curbcopy.ai" />
        <link rel="canonical" href="https://curbcopy.ai" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
        <style>{`
          @keyframes spin    { to { transform: rotate(360deg); } }
          @keyframes fadeUp  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
          @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
          .fade-up  { animation: fadeUp .4s ease both; }
          .fade-in  { animation: fadeIn .25s ease both; }
        `}</style>
      </Head>

      {/* ── Paywall Modal ───────────────────────────────── */}
      {showPaywall && (
        <div className="fade-in" style={s.overlay} onClick={(e) => e.target === e.currentTarget && setShowPaywall(false)}>
          <div style={s.modal}>
            <button onClick={() => setShowPaywall(false)} style={s.modalClose}>✕</button>
            <div style={s.modalLogo}>⌂ CurbCopy<span style={{color:"#1D9E75"}}>.ai</span></div>
            <h2 style={s.modalTitle}>You've used all 5 free generations</h2>
            <p style={s.modalSub}>Upgrade to keep creating listings — cancel any time.</p>

            <div style={s.planRow}>
              {/* Single Agent */}
              <div style={s.planCard}>
                <div style={s.planName}>Single Agent</div>
                <div style={s.planPrice}><span style={s.planDollar}>$</span>29<span style={s.planPer}>/mo</span></div>
                <ul style={s.planFeatures}>
                  <li>✓ 50 generations / month</li>
                  <li>✓ All 6 tone styles</li>
                  <li>✓ Headlines, MLS &amp; social</li>
                  <li>✓ 1 user</li>
                </ul>
                <a href={STRIPE_SINGLE} target="_blank" rel="noopener noreferrer" style={{...s.planBtn, background:"#1D9E75"}}>
                  Get started →
                </a>
              </div>

              {/* Agency */}
              <div style={{...s.planCard, ...s.planCardFeatured}}>
                <div style={s.planBadge}>Most popular</div>
                <div style={{...s.planName, color:"#fff"}}>Agency</div>
                <div style={{...s.planPrice, color:"#fff"}}><span style={s.planDollar}>$</span>79<span style={{...s.planPer, color:"rgba(255,255,255,.7)"}}/mo</span></div>
                <ul style={{...s.planFeatures, color:"rgba(255,255,255,.85)"}}>
                  <li>✓ 200 generations / month</li>
                  <li>✓ All 6 tone styles</li>
                  <li>✓ Headlines, MLS &amp; social</li>
                  <li>✓ Up to 10 agents</li>
                </ul>
                <a href={STRIPE_AGENCY} target="_blank" rel="noopener noreferrer" style={{...s.planBtn, background:"#fff", color:"#0F6E56"}}>
                  Get started →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <main style={s.main}>
        {/* ── Header ───────────────────────────────────── */}
        <div style={s.header}>
          <div style={s.logo}>
            <span style={s.logoMark}>⌂</span>
            <span style={s.logoText}>CurbCopy<span style={s.logoDot}>.ai</span></span>
          </div>
          <h1 style={s.h1}>Listings that <em style={s.em}>sell themselves.</em></h1>
          <p style={s.subhead}>AI-crafted headlines, descriptions, and social posts — in seconds.</p>
        </div>

        {/* ── Pricing Section ───────────────────────────── */}
        <div style={s.pricingWrap}>
          <div style={s.pricingSectionLabel}>Simple, transparent pricing</div>
          <div style={s.pricingGrid}>

            {/* Free */}
            <div style={s.pCard}>
              <div style={s.pTier}>Free</div>
              <div style={s.pPrice}><span style={s.pDollar}>$</span>0</div>
              <div style={s.pPer}>to get started</div>
              <ul style={s.pList}>
                <li>✓ 5 free generations</li>
                <li>✓ All 6 tone styles</li>
                <li>✓ Headlines, MLS &amp; social</li>
                <li>✓ No credit card needed</li>
              </ul>
              <div style={{...s.pBtn, background:"var(--surface2)", color:"var(--text2)", cursor:"default"}}>
                Start free below ↓
              </div>
            </div>

            {/* Single Agent */}
            <div style={s.pCard}>
              <div style={s.pTier}>Single Agent</div>
              <div style={s.pPrice}><span style={s.pDollar}>$</span>29<span style={s.pPer}>/mo</span></div>
              <ul style={s.pList}>
                <li>✓ 50 generations / month</li>
                <li>✓ All 6 tone styles</li>
                <li>✓ Headlines, MLS &amp; social</li>
                <li>✓ 1 user</li>
              </ul>
              <a href={STRIPE_SINGLE} target="_blank" rel="noopener noreferrer" style={{...s.pBtn, background:"#1D9E75", color:"#fff", textDecoration:"none", display:"block", textAlign:"center"}}>
                Subscribe →
              </a>
            </div>

            {/* Agency */}
            <div style={{...s.pCard, ...s.pCardFeatured}}>
              <div style={s.pPopular}>Most popular</div>
              <div style={{...s.pTier, color:"#fff"}}>Agency</div>
              <div style={{...s.pPrice, color:"#fff"}}><span style={s.pDollar}>$</span>79<span style={{...s.pPer, color:"rgba(255,255,255,.7)"}}>/mo</span></div>
              <ul style={{...s.pList, color:"rgba(255,255,255,.85)"}}>
                <li>✓ 200 generations / month</li>
                <li>✓ All 6 tone styles</li>
                <li>✓ Headlines, MLS &amp; social</li>
                <li>✓ Up to 10 agents</li>
              </ul>
              <a href={STRIPE_AGENCY} target="_blank" rel="noopener noreferrer" style={{...s.pBtn, background:"#fff", color:"#0F6E56", textDecoration:"none", display:"block", textAlign:"center"}}>
                Subscribe →
              </a>
            </div>

          </div>
        </div>

        {/* ── Free trial counter ────────────────────────── */}
        {usesLeft > 0 && (
          <div style={s.trialBanner}>
            <span style={{color:"#1D9E75", fontWeight:600}}>{usesLeft} free generation{usesLeft !== 1 ? "s" : ""} remaining</span>
            <span style={{color:"#888", marginLeft:8}}>— no sign-up needed</span>
          </div>
        )}
        {usesLeft === 0 && (
          <div style={{...s.trialBanner, background:"#fef2f2", borderColor:"#fca5a5"}}>
            <span style={{color:"#991b1b", fontWeight:600}}>You've used all 5 free generations.</span>
            <button onClick={() => setShowPaywall(true)} style={{marginLeft:10, color:"#1D9E75", background:"none", border:"none", cursor:"pointer", fontWeight:600, fontSize:".85rem"}}>Upgrade to continue →</button>
          </div>
        )}

        {/* ── Property Details ─────────────────────────── */}
        <div style={s.card}>
          <div style={s.sectionLabel}>Property details</div>
          <div style={s.grid2}>
            <Field label="Property type">
              <select value={form.propType} onChange={set("propType")} style={s.input}>
                {["Single-family home","Condo / Apartment","Townhouse","Luxury estate","Commercial property","Land / Lot","Multi-family"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Address / Neighborhood">
              <input style={s.input} value={form.address} onChange={set("address")} placeholder="e.g. Sunset Hills, Austin TX" />
            </Field>
            <Field label="Price">
              <input style={s.input} value={form.price} onChange={set("price")} placeholder="e.g. $485,000" />
            </Field>
            <Field label="Square footage">
              <input style={s.input} value={form.sqft} onChange={set("sqft")} placeholder="e.g. 2,100 sq ft" />
            </Field>
          </div>
          <div style={{...s.grid3, marginTop:12}}>
            <Field label="Bedrooms"><input style={s.input} type="number" value={form.beds} onChange={set("beds")} placeholder="4" min="0" /></Field>
            <Field label="Bathrooms"><input style={s.input} type="number" value={form.baths} onChange={set("baths")} placeholder="2.5" min="0" step="0.5" /></Field>
            <Field label="Year built"><input style={s.input} value={form.yearBuilt} onChange={set("yearBuilt")} placeholder="2005" /></Field>
          </div>
        </div>

        {/* ── Features ─────────────────────────────────── */}
        <div style={s.card}>
          <div style={s.sectionLabel}>Key features</div>
          <div style={s.featuresGrid}>
            {FEATURES.map((f) => (
              <div key={f} onClick={() => toggleFeature(f)}
                style={selectedFeatures.has(f) ? {...s.chip,...s.chipActive} : s.chip}>{f}</div>
            ))}
          </div>
        </div>

        {/* ── Notes ────────────────────────────────────── */}
        <div style={s.card}>
          <div style={s.sectionLabel}>Additional notes</div>
          <Field label="Standout details, recent upgrades, or anything else to highlight">
            <textarea style={{...s.input, resize:"vertical", lineHeight:1.5}} rows={3}
              value={form.notes} onChange={set("notes")}
              placeholder="e.g. Recently renovated kitchen, mountain views, walking distance to top-rated schools..." />
          </Field>
        </div>

        {/* ── Tone ─────────────────────────────────────── */}
        <div style={s.card}>
          <div style={s.sectionLabel}>Who is this listing for?</div>
          <div style={s.toneGrid}>
            {TONES.map((t) => (
              <div key={t.id} onClick={() => setTone(t.id)}
                style={tone === t.id ? {...s.toneCard,...s.toneCardActive} : s.toneCard}>
                <div style={tone === t.id ? {...s.toneName, color:"#0F6E56"} : s.toneName}>{t.label}</div>
                <div style={tone === t.id ? {...s.toneDesc, color:"#1D9E75"} : s.toneDesc}>{t.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Generate Button ───────────────────────────── */}
        <button onClick={generate} disabled={loading}
          style={loading ? {...s.genBtn,...s.genBtnDisabled} : s.genBtn}>
          {loading ? <span style={s.spinner} /> : <span>✦</span>}
          <span>{loading ? "Generating…" : results ? "Regenerate content" : "Generate listing content"}</span>
        </button>

        {error && <div style={s.errorBox}>{error}</div>}

        {/* ── Results ──────────────────────────────────── */}
        {results && (
          <div style={{marginTop:24}} className="fade-up">
            <div style={s.divider} />
            <div style={s.toneUsedBanner}>
              <span style={s.toneUsedIcon}>✦</span>
              Generated in <strong>{activeTone?.label}</strong> tone — {activeTone?.desc}
            </div>

            {/* Headlines */}
            <div style={s.resultSection}>
              <h3 style={s.resultH3}>Headlines <span style={s.badge}>5 options</span></h3>
              <div style={{display:"flex", flexDirection:"column", gap:8}}>
                {results.headlines?.map((h, i) => (
                  <div key={i} style={s.headlineItem}>
                    <p style={{fontSize:".9rem", lineHeight:1.4, flex:1}}>{h}</p>
                    <button onClick={() => copyText(h, `hl-${i}`)}
                      style={copied===`hl-${i}` ? {...s.copyBtn,...s.copyBtnCopied} : s.copyBtn}>
                      {copied===`hl-${i}` ? "Copied!" : "Copy"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div style={s.resultSection}>
              <h3 style={s.resultH3}>Property description <span style={s.badge}>listing-ready</span></h3>
              <div style={{...s.contentBox, position:"relative"}}>
                <button onClick={() => copyText(results.description, "desc")}
                  style={{...s.copyBtn, ...(copied==="desc" ? s.copyBtnCopied : {}), position:"absolute", top:10, right:10}}>
                  {copied==="desc" ? "Copied!" : "Copy"}
                </button>
                <p style={{fontSize:".9rem", lineHeight:1.7, paddingRight:60}}>{results.description}</p>
              </div>
            </div>

            {/* Social */}
            <div style={s.resultSection}>
              <h3 style={s.resultH3}>Social media posts <span style={s.badge}>3 platforms</span></h3>
              <div style={s.socialTabs}>
                {["linkedin","facebook","instagram"].map((p) => (
                  <button key={p} onClick={() => setActiveSocial(p)}
                    style={activeSocial===p ? {...s.socialTab,...s.socialTabActive} : s.socialTab}>
                    {p.charAt(0).toUpperCase()+p.slice(1)}
                  </button>
                ))}
              </div>
              <div style={{...s.contentBox, position:"relative"}}>
                <button onClick={() => copyText(`${social.headline ? social.headline+"\n\n" : ""}${social.post}`, `social-${activeSocial}`)}
                  style={{...s.copyBtn, ...(copied===`social-${activeSocial}` ? s.copyBtnCopied : {}), position:"absolute", top:10, right:10}}>
                  {copied===`social-${activeSocial}` ? "Copied!" : "Copy"}
                </button>
                {social.headline && <p style={{fontWeight:600, fontSize:".85rem", color:"#0F6E56", marginBottom:8}}>{social.headline}</p>}
                <p style={{fontSize:".9rem", lineHeight:1.7, whiteSpace:"pre-wrap", paddingRight:60}}>{social.post}</p>
              </div>
            </div>
          </div>
        )}

        <div style={s.footer}>Powered by <span style={{color:"#1D9E75",fontWeight:500}}>CurbCopy.ai</span> · AI content for real estate pros</div>
      </main>
    </>
  );
}

function Field({ label, children }) {
  return (
    <div style={{display:"flex", flexDirection:"column", gap:5}}>
      <label style={{fontSize:".8rem", fontWeight:500, color:"#555"}}>{label}</label>
      {children}
    </div>
  );
}

const s = {
  main:            { maxWidth:820, margin:"0 auto", padding:"2rem 1rem 4rem" },
  header:          { textAlign:"center", marginBottom:"2rem" },
  logo:            { display:"inline-flex", alignItems:"center", gap:8, marginBottom:"1rem", background:"#fff", border:"0.5px solid rgba(0,0,0,0.1)", borderRadius:40, padding:"6px 16px 6px 10px" },
  logoMark:        { fontSize:"1.1rem", color:"#1D9E75" },
  logoText:        { fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:".95rem", letterSpacing:"-0.01em", color:"#1a1a1a" },
  logoDot:         { color:"#1D9E75" },
  h1:              { fontFamily:"'DM Serif Display', serif", fontSize:"2.4rem", fontWeight:400, letterSpacing:"-0.02em", lineHeight:1.2 },
  em:              { fontStyle:"italic", color:"#1D9E75" },
  subhead:         { marginTop:".6rem", fontSize:".95rem", color:"#555" },

  // Pricing
  pricingWrap:        { marginBottom:"1.5rem" },
  pricingSectionLabel:{ fontSize:".7rem", fontWeight:600, letterSpacing:".1em", textTransform:"uppercase", color:"#888", textAlign:"center", marginBottom:"1rem" },
  pricingGrid:        { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:14 },
  pCard:              { background:"#fff", border:"0.5px solid rgba(0,0,0,0.1)", borderRadius:14, padding:"1.5rem", position:"relative" },
  pCardFeatured:      { background:"#1D9E75", border:"none" },
  pTier:              { fontSize:".75rem", fontWeight:600, letterSpacing:".08em", textTransform:"uppercase", color:"#888", marginBottom:8 },
  pPrice:             { fontFamily:"'DM Serif Display',serif", fontSize:"2.6rem", fontWeight:400, color:"#1a1a1a", lineHeight:1 },
  pDollar:            { fontSize:"1.2rem", verticalAlign:"super", color:"#888" },
  pPer:               { fontSize:".85rem", color:"#888", fontFamily:"'DM Sans',sans-serif" },
  pList:              { listStyle:"none", margin:"1rem 0", display:"flex", flexDirection:"column", gap:6, fontSize:".82rem", color:"#555", lineHeight:1.5 },
  pBtn:               { display:"block", width:"100%", padding:"10px", borderRadius:10, border:"none", fontFamily:"'DM Sans',sans-serif", fontWeight:500, fontSize:".88rem", cursor:"pointer", marginTop:"1rem", textAlign:"center" },
  pPopular:           { position:"absolute", top:-10, left:"50%", transform:"translateX(-50%)", background:"#0F6E56", color:"#fff", fontSize:".65rem", fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", padding:"3px 10px", borderRadius:20, whiteSpace:"nowrap" },

  // Trial banner
  trialBanner:     { textAlign:"center", fontSize:".82rem", padding:"9px 14px", background:"#E1F5EE", border:"0.5px solid #1D9E75", borderRadius:8, marginBottom:"1.25rem" },

  // Form
  card:            { background:"#fff", border:"0.5px solid rgba(0,0,0,0.1)", borderRadius:14, padding:"1.5rem", marginBottom:"1.25rem" },
  sectionLabel:    { fontSize:".7rem", fontWeight:600, letterSpacing:".1em", textTransform:"uppercase", color:"#888", marginBottom:"1rem" },
  grid2:           { display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px,1fr))", gap:12 },
  grid3:           { display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px,1fr))", gap:12 },
  input:           { fontFamily:"'DM Sans',sans-serif", fontSize:".9rem", padding:"9px 12px", border:"0.5px solid rgba(0,0,0,0.18)", borderRadius:10, background:"#F3F2EF", color:"#1a1a1a", outline:"none", width:"100%" },
  featuresGrid:    { display:"flex", flexWrap:"wrap", gap:8 },
  chip:            { padding:"6px 12px", border:"0.5px solid rgba(0,0,0,0.1)", borderRadius:20, fontSize:".8rem", cursor:"pointer", background:"#F3F2EF", color:"#555", userSelect:"none" },
  chipActive:      { background:"#E1F5EE", borderColor:"#1D9E75", color:"#0F6E56", fontWeight:500 },
  toneGrid:        { display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px,1fr))", gap:10 },
  toneCard:        { padding:"12px 14px", border:"0.5px solid rgba(0,0,0,0.1)", borderRadius:12, background:"#F3F2EF", cursor:"pointer" },
  toneCardActive:  { background:"#E1F5EE", borderColor:"#1D9E75" },
  toneName:        { fontSize:".85rem", fontWeight:500, color:"#1a1a1a", marginBottom:3 },
  toneDesc:        { fontSize:".75rem", color:"#777", lineHeight:1.4 },
  genBtn:          { width:"100%", marginTop:"1.5rem", padding:14, background:"#1D9E75", color:"#fff", border:"none", borderRadius:10, fontFamily:"'DM Sans',sans-serif", fontSize:"1rem", fontWeight:500, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 },
  genBtnDisabled:  { background:"#F3F2EF", color:"#888", cursor:"not-allowed" },
  spinner:         { width:18, height:18, border:"2px solid rgba(0,0,0,0.15)", borderTopColor:"#1D9E75", borderRadius:"50%", display:"inline-block", animation:"spin .7s linear infinite" },
  errorBox:        { marginTop:12, padding:"12px 14px", background:"#fef2f2", border:"0.5px solid #fca5a5", borderRadius:10, color:"#991b1b", fontSize:".875rem" },
  toneUsedBanner:  { fontSize:".82rem", color:"#555", background:"#F3F2EF", border:"0.5px solid rgba(0,0,0,0.08)", borderRadius:8, padding:"9px 14px", marginBottom:"1.25rem", display:"flex", alignItems:"center", gap:8 },
  toneUsedIcon:    { color:"#1D9E75", fontSize:".9rem" },
  divider:         { height:"0.5px", background:"rgba(0,0,0,0.08)", margin:"1.5rem 0" },
  resultSection:   { marginBottom:"1.5rem" },
  resultH3:        { fontFamily:"'DM Serif Display',serif", fontSize:"1.1rem", fontWeight:400, marginBottom:".75rem", display:"flex", alignItems:"center", gap:8 },
  badge:           { fontFamily:"'DM Sans',sans-serif", fontSize:".65rem", fontWeight:600, letterSpacing:".08em", textTransform:"uppercase", background:"#E1F5EE", color:"#0F6E56", padding:"3px 8px", borderRadius:4 },
  headlineItem:    { display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, padding:"11px 14px", background:"#F3F2EF", borderRadius:10, border:"0.5px solid rgba(0,0,0,0.08)" },
  contentBox:      { padding:"1rem 1.25rem", background:"#F3F2EF", borderRadius:10, border:"0.5px solid rgba(0,0,0,0.08)" },
  copyBtn:         { flexShrink:0, padding:"5px 10px", fontSize:".75rem", fontFamily:"'DM Sans',sans-serif", background:"transparent", border:"0.5px solid rgba(0,0,0,0.18)", borderRadius:8, cursor:"pointer", color:"#555", whiteSpace:"nowrap" },
  copyBtnCopied:   { borderColor:"#1D9E75", color:"#0F6E56" },
  socialTabs:      { display:"flex", gap:4, marginBottom:12 },
  socialTab:       { padding:"7px 14px", border:"0.5px solid rgba(0,0,0,0.1)", borderRadius:10, fontSize:".8rem", fontFamily:"'DM Sans',sans-serif", cursor:"pointer", background:"#F3F2EF", color:"#555" },
  socialTabActive: { background:"#fff", borderColor:"rgba(0,0,0,0.3)", color:"#1a1a1a", fontWeight:500 },
  footer:          { textAlign:"center", marginTop:"2.5rem", fontSize:".78rem", color:"#aaa" },

  // Modal
  overlay:   { position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:"1rem" },
  modal:     { background:"#fff", borderRadius:18, padding:"2rem", maxWidth:580, width:"100%", position:"relative" },
  modalClose:{ position:"absolute", top:14, right:16, background:"none", border:"none", fontSize:"1.1rem", cursor:"pointer", color:"#888" },
  modalLogo: { fontWeight:600, fontSize:"1rem", marginBottom:"1rem" },
  modalTitle:{ fontFamily:"'DM Serif Display',serif", fontSize:"1.6rem", fontWeight:400, marginBottom:".5rem" },
  modalSub:  { fontSize:".9rem", color:"#555", marginBottom:"1.5rem" },
  planRow:   { display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 },
  planCard:  { border:"0.5px solid rgba(0,0,0,0.1)", borderRadius:14, padding:"1.25rem" },
  planCardFeatured: { background:"#1D9E75", border:"none" },
  planBadge: { fontSize:".65rem", fontWeight:700, letterSpacing:".08em", textTransform:"uppercase", color:"#1D9E75", marginBottom:8 },
  planName:  { fontSize:".75rem", fontWeight:600, letterSpacing:".06em", textTransform:"uppercase", color:"#888", marginBottom:6 },
  planPrice: { fontFamily:"'DM Serif Display',serif", fontSize:"2.2rem", fontWeight:400, color:"#1a1a1a", lineHeight:1, marginBottom:4 },
  planDollar:{ fontSize:"1rem", verticalAlign:"super", color:"#888" },
  planPer:   { fontSize:".8rem", color:"#888", fontFamily:"'DM Sans',sans-serif" },
  planFeatures:{ listStyle:"none", margin:"1rem 0", display:"flex", flexDirection:"column", gap:5, fontSize:".8rem", color:"#555" },
  planBtn:   { display:"block", width:"100%", padding:"10px", borderRadius:10, border:"none", fontFamily:"'DM Sans',sans-serif", fontWeight:500, fontSize:".88rem", cursor:"pointer", marginTop:"1rem", textAlign:"center" },
};
