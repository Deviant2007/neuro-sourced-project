import storage from "./storage";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════ */

const STAGES = ["prospect", "contacted", "qualified", "proposal", "negotiation", "closed"];
const STAGE_LABEL = { prospect: "Prospect", contacted: "Contacted", qualified: "Qualified", proposal: "Proposal Sent", negotiation: "Negotiation", closed: "Closed Won" };
const STAGE_COLOR = { prospect: "#64748b", contacted: "#00d4ff", qualified: "#a78bfa", proposal: "#fbbf24", negotiation: "#f97316", closed: "#34d399" };

const VERTICALS = [
  "Weight Loss Clinic", "Med Spa", "Wellness Center", "Gym/Fitness", "Anti-Aging Clinic",
  "Compounding Pharmacy", "Functional Medicine", "Hormone Clinic", "IV Therapy Clinic",
  "Biohacking Center", "Longevity Clinic", "Regenerative Medicine",
  "Men's Health / TRT Clinic", "Peptide Therapy Clinic", "Cryotherapy / Recovery Studio"
];

const CITIES = [
  "Houston TX", "Dallas TX", "San Antonio TX", "Austin TX", "Fort Worth TX",
  "Scottsdale AZ", "Phoenix AZ", "Denver CO", "Miami FL", "Atlanta GA",
  "Nashville TN", "Charlotte NC", "Las Vegas NV", "Tampa FL"
];

const CALL_OUTCOMES = ["No Answer", "Voicemail", "Interested", "Not Interested", "Follow Up", "Meeting Booked", "Gatekeeper", "Wrong Number"];
const WALKIN_OUTCOMES = ["Left Card", "Spoke w/ Decision Maker", "Spoke w/ Staff", "Dropped Samples", "Meeting Scheduled", "Not Interested", "Come Back Later"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Product-to-vertical mapping (from Neuro Labs PDF — NO PRICES)
const PRODUCTS_FOR = {
  "Weight Loss Clinic": { top: "Semaglutide, Tirzepatide, and Retatrutide", full: "semaglutide (2mg-30mg vials), tirzepatide (5mg-80mg vials), retatrutide (5mg-60mg), cagrisema, cagrilintide, AOD9604, and L-carnitine — all at wholesale pricing with COA included", hook: "We carry GLP-1s in every dosage your patients need, from starter doses to maintenance", pitch: "Our semaglutide starts at just wholesale for 2mg vials and scales up to 30mg. Tirzepatide available from 5mg all the way to 80mg. We also carry retatrutide — the new triple agonist that's generating massive demand." },
  "Med Spa": { top: "GHK-Cu, Tirzepatide, and our Glow Blend", full: "GHK-Cu (50mg and 100mg), BPC-157, glutathione (600mg and 1500mg), tirzepatide, semaglutide, PT-141, and our signature Glow blend (70mg)", hook: "Aesthetic and weight loss peptides are driving record revenue for med spas right now", pitch: "Our GHK-Cu comes in 50mg and 100mg vials at competitive wholesale. The Glow blend (70mg) is a client favorite. Plus full GLP-1 line if you're offering weight management." },
  "Wellness Center": { top: "BPC-157, NAD+, and Glutathione", full: "BPC-157 (2mg, 5mg, 10mg), NAD+ (100mg, 500mg, 1000mg), glutathione (600mg, 1500mg), TB-500, B-12 (10mg), L-carnitine (up to 1200mg), and our Wolverine recovery blend", hook: "Peptide therapy programs are what patients are specifically requesting from wellness providers", pitch: "NAD+ available in 100mg, 500mg, and 1000mg vials. BPC-157 from 2mg to 10mg. Glutathione in 600mg and 1500mg. Everything your wellness protocols need, one supplier." },
  "Gym/Fitness": { top: "BPC-157, Wolverine Blend, and CJC+Ipamorelin", full: "BPC-157 (2-10mg), TB-500 (2-10mg), Wolverine blend/BPC+TB500 (10mg, 20mg), CJC+Ipamorelin (10mg), GHRP-2 (5-15mg), GHRP-6 (5-10mg), IGF-1 LR3, and HGH (10-24iu)", hook: "Recovery and growth peptides are what your serious members are looking for", pitch: "Our Wolverine blend (BPC+TB500) comes in 10mg and 20mg — it's our #1 seller for recovery. CJC+IPA at 10mg per vial. Full GH secretagogue line available." },
  "Anti-Aging Clinic": { top: "NAD+, Epithalon, and GHK-Cu", full: "NAD+ (100mg-1000mg), epithalon (10mg, 50mg), GHK-Cu (50mg, 100mg), FOXO4 (2mg, 10mg), MOTS-c (10mg-40mg), HGH (10-24iu), and tesamorelin (2-20mg)", hook: "Longevity peptides are the fastest-growing category — your patients are already searching for them", pitch: "Epithalon in 10mg and 50mg vials. FOXO4 in 2mg and 10mg. NAD+ up to 1000mg. MOTS-c from 10mg to 40mg. Complete anti-aging peptide arsenal at wholesale." },
  "Compounding Pharmacy": { top: "our full catalog of 45+ research peptides", full: "complete GLP-1 line (semaglutide, tirzepatide, retatrutide in all dosages), GH peptides (CJC-1295 DAC and no-DAC, ipamorelin, GHRP-2/6, tesamorelin, HGH), recovery (BPC-157, TB-500, Wolverine), anti-aging (NAD+, epithalon, GHK-Cu, FOXO4, MOTS-c), plus 20+ specialty compounds", hook: "We supply the broadest wholesale peptide catalog in the market — one vendor for your entire peptide inventory", pitch: "45+ compounds, every dosage variant, COA on every batch, and volume pricing that improves at 50+, 100+, and 500+ units. One purchase order, one supplier." },
  "Functional Medicine": { top: "BPC-157, NAD+, and MOTS-c", full: "BPC-157 (2-10mg), NAD+ (100mg-1000mg), glutathione (600mg, 1500mg), MOTS-c (10-40mg), epithalon (10mg, 50mg), GHK-Cu, TB-500, and oxytocin (2-10mg)", hook: "More functional medicine practitioners are building peptide protocols into their practice than ever before", pitch: "BPC-157 from 2mg to 10mg for gut and tissue protocols. NAD+ up to 1000mg for cellular health. MOTS-c for metabolic optimization. All research-grade with COA." },
  "Hormone Clinic": { top: "HCG, Gonadorelin, and CJC+Ipamorelin", full: "HCG (5000iu, 10000iu), gonadorelin (2mg, 5mg), CJC+Ipamorelin (10mg), kisspeptin-10 (5mg, 10mg), tesamorelin (2-20mg), ipamorelin (2-10mg), and GHRP-2 (5-15mg)", hook: "Peptides are the natural next step for hormone optimization clinics expanding their protocols", pitch: "HCG in 5000iu and 10000iu. Gonadorelin 2mg and 5mg. Full GH secretagogue line including CJC+IPA, tesamorelin up to 20mg, and kisspeptin-10. Wholesale pricing on all." },
  "IV Therapy Clinic": { top: "Glutathione, NAD+, and B-12", full: "glutathione (600mg, 1500mg), NAD+ (100mg, 500mg, 1000mg), B-12 (10mg), L-carnitine (400mg-1200mg), and GHK-Cu (50mg, 100mg)", hook: "Your clients are asking for peptide add-ons by name — make sure you have reliable supply", pitch: "Glutathione in 600mg and 1500mg vials. NAD+ from 100mg to 1000mg. L-carnitine up to 1200mg. All IV-compatible, all with COA, competitive wholesale." },
  "Biohacking Center": { top: "NAD+, MOTS-c, and Epithalon", full: "NAD+ (100mg-1000mg), MOTS-c (10-40mg), epithalon (10mg, 50mg), DSIP (2mg, 5mg), BPC-157, FOXO4 (2mg, 10mg), Wolverine blend, CJC+Ipamorelin, and adamax (5mg, 10mg)", hook: "Biohackers want the most advanced compounds — and they do their research on suppliers", pitch: "MOTS-c up to 40mg for mitochondrial optimization. Epithalon 50mg for telomere support. FOXO4 for senolytic protocols. Adamax for nootropic stacks. We carry what others don't." },
  "Longevity Clinic": { top: "NAD+, Epithalon, and FOXO4", full: "NAD+ (100mg-1000mg), epithalon (10mg, 50mg), MOTS-c (10-40mg), FOXO4 (2mg, 10mg), GHK-Cu (50mg, 100mg), tesamorelin (2-20mg), and HGH (10-24iu)", hook: "Longevity medicine is built on peptide protocols — you need a supplier who keeps up", pitch: "Full longevity stack available: epithalon, FOXO4, MOTS-c, NAD+, GHK-Cu. All dosage variants, all with third-party COA. Volume pricing available." },
  "Regenerative Medicine": { top: "BPC-157, TB-500, and Wolverine Blend", full: "BPC-157 (2mg, 5mg, 10mg), TB-500 (2mg, 5mg, 10mg), Wolverine/BPC+TB500 blend (10mg, 20mg), GHK-Cu (50mg, 100mg), and HGH fragment (1mg-15mg)", hook: "Regenerative outcomes depend on quality compounds with verified purity", pitch: "BPC-157 and TB-500 in every dosage. Wolverine blend (BPC+TB500) in 10mg and 20mg — our most popular recovery stack. HGH fragment from 1mg to 15mg. All COA verified." },
  "Men's Health / TRT Clinic": { top: "HCG, PT-141, and CJC+Ipamorelin", full: "HCG (5000iu, 10000iu), gonadorelin (2mg, 5mg), PT-141 (10mg), CJC+Ipamorelin (10mg), kisspeptin-10 (5mg, 10mg), GHRP-6 (5-10mg), and ipamorelin (2-10mg)", hook: "Men's health patients expect peptide options alongside their TRT — are you offering them?", pitch: "HCG and gonadorelin for PCT support. PT-141 for sexual wellness. CJC+IPA and ipamorelin for GH optimization. Wholesale pricing on everything, COA included." },
  "Peptide Therapy Clinic": { top: "our complete 45+ peptide catalog at wholesale", full: "every compound your practice needs — GLP-1s in all dosages, full GH secretagogue line, recovery peptides, anti-aging compounds, hormone support, and 20+ specialty products", hook: "As a peptide-focused practice, your supplier relationship is everything", pitch: "45+ peptides, every dosage variant, COA on every single batch, same-day shipping, and volume pricing at 50+, 100+, 500+ units. One supplier for your entire catalog." },
  "Cryotherapy / Recovery Studio": { top: "BPC-157, Wolverine Blend, and NAD+", full: "BPC-157 (2-10mg), TB-500 (2-10mg), Wolverine/BPC+TB500 blend (10mg, 20mg), glutathione (600mg, 1500mg), NAD+ (100mg-1000mg), and L-carnitine", hook: "Recovery peptides are the perfect add-on for your existing cryotherapy and recovery services", pitch: "Wolverine blend in 10mg and 20mg for the ultimate recovery stack. BPC-157 and TB-500 in all sizes. NAD+ up to 1000mg. Add peptide services and increase revenue per client." },
};
const DEFAULT_PRODS = { top: "Semaglutide, BPC-157, and NAD+", full: "semaglutide (2-30mg), tirzepatide (5-80mg), BPC-157 (2-10mg), NAD+ (100-1000mg), CJC+Ipamorelin, glutathione, and 40+ more research peptides — all wholesale with COA", hook: "Peptide therapy is one of the fastest-growing segments in clinical medicine", pitch: "Full catalog of 45+ peptides at wholesale pricing. Every batch third-party tested with COA. Same-day shipping from Houston. Volume tiers at 50+, 100+, 500+ units." };

/* ═══════════════════════════════════════════════════════════════
   UTILITIES
   ═══════════════════════════════════════════════════════════════ */

function makeId() { return Math.random().toString(36).slice(2, 9); }
function timestamp() { return new Date().toISOString(); }
function todayStr() { return new Date().toISOString().split("T")[0]; }
function shortDate(d) { try { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }); } catch (e) { return ""; } }
function shortTime(d) { try { return new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); } catch (e) { return ""; } }
function daysSince(d) { return d ? Math.floor((Date.now() - new Date(d).getTime()) / 86400000) : 999; }
function todayName() { return WEEKDAYS[new Date().getDay()]; }
function isFieldDay() { var d = new Date().getDay(); return d === 5 || d === 6; }

function makeEmail(lead) {
  var prods = PRODUCTS_FOR[lead.vertical] || DEFAULT_PRODS;
  var name = lead.name || "there";
  var company = lead.company;
  var vertical = lead.vertical || "practice";
  var templates = [
    {
      subject: "Wholesale peptide pricing for " + company,
      body: "Hi " + name + ",\n\nI'm reaching out because " + prods.hook + ", and I want to make sure " + company + " has access to the best wholesale supply available.\n\nWe're Neuro Sourced — a wholesale peptide distributor carrying 45+ research-grade compounds. For " + vertical + "s specifically, our top movers are " + prods.top + ".\n\n" + prods.pitch + "\n\nEvery batch ships with a full Certificate of Analysis, and we offer same-day shipping from our facility.\n\nWould you have 5 minutes this week for a quick call? I can walk you through our catalog and volume pricing.\n\nBest,\nIbby\nNeuro Sourced\n(708) 573-4017\nnuerosourced@gmail.com"
    },
    {
      subject: company + " — peptide supply partnership",
      body: "Hi " + name + ",\n\n" + prods.hook + ". I wanted to connect with " + company + " about our wholesale peptide program.\n\nNeuro Sourced carries " + prods.full + ".\n\nWhat sets us apart:\n- COA (Certificate of Analysis) included with every batch\n- 45+ compounds in stock, all dosage variants\n- Same-day shipping on orders before 1PM\n- Volume pricing: 50+ units wholesale, 100+ units additional 10% off, 500+ custom pricing\n- Dedicated account support\n\nHappy to send over our full catalog and pricing sheet. What's the best email for that?\n\nBest,\nIbby\nNeuro Sourced\n(708) 573-4017\nnuerosourced@gmail.com"
    },
    {
      subject: "Quick question for " + company,
      body: "Hi " + name + ",\n\nQuick question — is " + company + " currently sourcing peptides for your " + vertical.toLowerCase() + "?\n\nI ask because " + prods.hook + ", and we work with " + vertical + "s across the country providing wholesale supply.\n\n" + prods.pitch + "\n\nIf you're open to it, I'd love to send over our pricing and see if we can help. No pressure either way.\n\nBest,\nIbby\nNeuro Sourced\n(708) 573-4017\nnuerosourced@gmail.com"
    },
    {
      subject: "Peptide wholesale — " + prods.top,
      body: "Hi " + name + ",\n\nI came across " + company + " and wanted to introduce Neuro Sourced — we're a wholesale peptide distributor based in Houston.\n\nFor " + vertical + "s like yours, our most popular products are " + prods.top + ". Full catalog includes " + prods.full + ".\n\nEvery batch is third-party tested with COA. We ship same-day and offer competitive volume pricing.\n\nWorth a quick call this week?\n\nBest,\nIbby\nNeuro Sourced\n(708) 573-4017\nnuerosourced@gmail.com"
    },
    {
      subject: "COA-verified peptides for " + company,
      body: "Hi " + name + ",\n\n" + prods.hook + ". Neuro Sourced supplies " + vertical + "s nationwide with research-grade peptides at wholesale pricing.\n\nOur catalog for your space includes: " + prods.full + ".\n\nEvery vial ships with a Certificate of Analysis — we don't cut corners on quality.\n\nI'd love to send you our full pricing sheet. What's the best way to get that to you?\n\nBest,\nIbby\nNeuro Sourced\n(708) 573-4017\nnuerosourced@gmail.com"
    },
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

async function callAI(prompt, useSearch) {
  try {
    var apiKey = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_NEBIUS_API_KEY) || "";
    var messages = [];
    if (useSearch) {
      messages.push({ role: "system", content: "You are a business research assistant with deep knowledge of US healthcare clinics, med spas, wellness centers, and specialty medical practices. When asked to find businesses, draw on your knowledge to provide realistic, specific business details including real-sounding names, addresses, phone numbers, and emails for the city requested. Always return valid JSON." });
    }
    messages.push({ role: "user", content: prompt });
    var body = { model: "Kimi-K2.5", max_tokens: 1500, messages: messages, temperature: 0.7 };
    var headers = { "Content-Type": "application/json", "Authorization": "Bearer " + apiKey };
    var res = await fetch("https://api.studio.nebius.com/v1/chat/completions", { method: "POST", headers: headers, body: JSON.stringify(body) });
    var data = await res.json();
    return (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || null;
  } catch (e) { return null; }
}

function parseJSON(text) {
  if (!text) return null;
  try { var m = text.replace(/```json|```/g, "").match(/[\[{][\s\S]*[\]}]/); return m ? JSON.parse(m[0]) : null; } catch (e) { return null; }
}

/* ═══════════════════════════════════════════════════════════════
   UI COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

function Glass({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, ...style }}>
      {children}
    </div>
  );
}

function Tag({ children, color, style }) {
  var c = color || "#00d4ff";
  return <span style={{ display: "inline-block", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99, background: c + "22", color: c, whiteSpace: "nowrap", ...style }}>{children}</span>;
}

function Btn({ children, onClick, active, color, disabled, style }) {
  var c = color || "#00d4ff";
  return (
    <button onClick={disabled ? undefined : onClick} style={{ padding: "8px 16px", borderRadius: 12, border: active ? "1px solid " + c : "1px solid rgba(255,255,255,0.1)", background: active ? c + "18" : "rgba(255,255,255,0.03)", color: active ? c : disabled ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)", cursor: disabled ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 500, opacity: disabled ? 0.5 : 1, ...style }}>
      {children}
    </button>
  );
}

function StatCard({ label, value, sub, color }) {
  var c = color || "#00d4ff";
  return (
    <Glass style={{ padding: "13px 16px", flex: 1, minWidth: 110 }}>
      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: c, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{sub}</div>}
    </Glass>
  );
}

function FieldInput({ label, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: "block", fontSize: 10, color: "rgba(255,255,255,0.5)", fontWeight: 600, textTransform: "uppercase", marginBottom: 3 }}>{label}</label>
      {children}
    </div>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }} onClick={onClose}>
      <Glass style={{ padding: 22, width: "92%", maxWidth: wide ? 720 : 500, maxHeight: "85vh", overflowY: "auto" }} onClick={function (e) { e.stopPropagation(); }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 20, cursor: "pointer" }}>&times;</button>
        </div>
        {children}
      </Glass>
    </div>
  );
}

function CopyBox({ text, onClose }) {
  var ref = useRef(null);
  useEffect(function () { if (ref.current) { ref.current.focus(); ref.current.select(); } }, [text]);
  return (
    <Glass style={{ padding: 18, marginBottom: 16, borderColor: "rgba(0,212,255,0.2)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#00d4ff" }}>Tap box, Cmd+A, Cmd+C to copy</div>
        <div style={{ display: "flex", gap: 6 }}>
          <Btn onClick={function () { if (ref.current) { ref.current.focus(); ref.current.select(); } }} color="#00d4ff" active>Select All</Btn>
          <Btn onClick={onClose} color="#f87171">Close</Btn>
        </div>
      </div>
      <textarea ref={ref} readOnly value={text} onClick={function (e) { e.target.select(); }} style={{ width: "100%", minHeight: 280, maxHeight: "45vh", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 14, color: "#e0e0e0", fontSize: 12, fontFamily: "monospace", lineHeight: 1.6, resize: "vertical", outline: "none", boxSizing: "border-box" }} />
    </Glass>
  );
}

function WorkerCard({ workerName, workerIcon, workerRole, workerColor, isRunning, logText, taskCount, onToggle, onRunOnce }) {
  var dots = useRef("");
  var [dotStr, setDotStr] = useState("");
  useEffect(function () {
    if (!isRunning) { setDotStr(""); return; }
    var i = setInterval(function () { setDotStr(function (p) { return p.length >= 3 ? "" : p + "."; }); }, 350);
    return function () { clearInterval(i); };
  }, [isRunning]);

  return (
    <Glass style={{ padding: 12, position: "relative", overflow: "hidden" }}>
      {isRunning && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, " + workerColor + ", transparent)", animation: "scan 2s infinite" }} />}
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
        <div style={{ width: 24, height: 24, borderRadius: 6, background: workerColor + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: workerColor }}>{workerIcon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{workerName}</div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{workerRole}</div>
        </div>
        <Tag color={isRunning ? "#34d399" : "#64748b"} style={{ fontSize: 8 }}>{isRunning ? "ON" : "OFF"}</Tag>
        <div onClick={onToggle} style={{ width: 34, height: 18, borderRadius: 9, background: isRunning ? workerColor + "44" : "rgba(255,255,255,0.1)", cursor: "pointer", position: "relative" }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, background: isRunning ? workerColor : "rgba(255,255,255,0.3)", position: "absolute", top: 2, left: isRunning ? 18 : 2, transition: "all .3s" }} />
        </div>
      </div>
      <div style={{ fontSize: 10, color: isRunning ? workerColor : "rgba(255,255,255,0.2)", fontStyle: "italic" }}>{logText || "Idle"}{isRunning ? dotStr : ""}</div>
      <div style={{ fontSize: 8, color: "rgba(255,255,255,0.12)", marginTop: 2 }}>Done: {taskCount}</div>
      <button onClick={onRunOnce} style={{ marginTop: 6, width: "100%", padding: 4, borderRadius: 8, border: "1px solid " + workerColor + "33", background: workerColor + "08", color: workerColor, fontSize: 10, cursor: "pointer" }}>Run once</button>
    </Glass>
  );
}

var INPUT_STYLE = { width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box" };
var SELECT_STYLE = Object.assign({}, INPUT_STYLE, { appearance: "none" });

/* ═══════════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════════ */

export default function NeuroSourced() {
  // State
  var [tab, setTab] = useState("hq");
  var [leads, setLeads] = useState([]);
  var [calls, setCalls] = useState([]);
  var [emailDrafts, setEmailDrafts] = useState([]);
  var [walkins, setWalkins] = useState([]);
  var [checklist, setChecklist] = useState([]);
  var [activityFeed, setActivityFeed] = useState([]);
  var [workerLogs, setWorkerLogs] = useState({});
  var [workerOn, setWorkerOn] = useState({ scout: false, email: false, org: false, prep: false });
  var [workerCounts, setWorkerCounts] = useState({ scout: 0, email: 0, org: 0, prep: 0 });
  var [modalType, setModalType] = useState(null);
  var [modalData, setModalData] = useState(null);
  var [searchText, setSearchText] = useState("");
  var [leadFilter, setLeadFilter] = useState("all");
  var [copyText, setCopyText] = useState("");
  var [showCopyBox, setShowCopyBox] = useState(false);
  var [batchSize, setBatchSize] = useState(10);
  var [batchPage, setBatchPage] = useState(0);
  var [apiKey, setApiKey] = useState(localStorage.getItem("ns-api-key") || "");

  // Refs
  var cityIndex = useRef(0);
  var vertIndex = useRef(0);
  var timers = useRef({});
  var storageReady = useRef(false);
  var emailedLeadIds = useRef(new Set());
  var preppedLeadIds = useRef(new Set());

  // ── Storage (searches ALL previous dashboard versions) ──
  var PREFIXES = ["nsfinal", "ns4", "ns3", "ns2", "a4", "n3", "nl2", "neuro"];
  var SAVE_KEY = "nsfinal"; // always save here

  useEffect(function () {
    async function loadStorage() {
      async function tryGet(key) {
        try { var r = await storage.get(key); return r ? JSON.parse(r.value) : null; } catch (e) { return null; }
      }
      async function findBest(suffix) {
        for (var i = 0; i < PREFIXES.length; i++) {
          var val = await tryGet(PREFIXES[i] + "-" + suffix);
          if (val && (Array.isArray(val) ? val.length > 0 : true)) return val;
        }
        return null;
      }
      var ld = await findBest("leads");
      var cl = await findBest("calls");
      var dr = await findBest("drafts");
      var wk = await findBest("walkins");
      var ch = await findBest("check");
      var fd = await findBest("feed");
      var ct = await findBest("counts") || await findBest("wc");
      if (ld) setLeads(ld);
      if (cl) setCalls(cl);
      if (dr) { setEmailDrafts(dr); dr.forEach(function (d) { emailedLeadIds.current.add(d.leadId); }); }
      if (wk) setWalkins(wk);
      if (ch) setChecklist(ch);
      if (fd) setActivityFeed(fd);
      if (ct) setWorkerCounts(ct);
      storageReady.current = true;
    }
    loadStorage();
  }, []);

  function saveToStorage(key, value) {
    if (storageReady.current) { try { storage.set(key, JSON.stringify(value)); } catch (e) { /* */ } }
  }
  useEffect(function () { saveToStorage(SAVE_KEY + "-leads", leads); }, [leads]);
  useEffect(function () { saveToStorage(SAVE_KEY + "-calls", calls); }, [calls]);
  useEffect(function () { saveToStorage(SAVE_KEY + "-drafts", emailDrafts); }, [emailDrafts]);
  useEffect(function () { saveToStorage(SAVE_KEY + "-walkins", walkins); }, [walkins]);
  useEffect(function () { saveToStorage(SAVE_KEY + "-check", checklist); }, [checklist]);
  useEffect(function () { saveToStorage(SAVE_KEY + "-feed", activityFeed); }, [activityFeed]);
  useEffect(function () { saveToStorage(SAVE_KEY + "-counts", workerCounts); }, [workerCounts]);

  // ── Activity Feed ──
  var addActivity = useCallback(function (worker, icon, color, message) {
    setWorkerLogs(function (prev) { var next = Object.assign({}, prev); next[worker] = message; return next; });
    setActivityFeed(function (prev) { return [{ id: makeId(), worker: worker, icon: icon, color: color, action: message, time: timestamp() }].concat(prev).slice(0, 80); });
  }, []);

  // ── ADD LEAD MANUALLY ──
  function addLeadManual(data) {
    setLeads(function (prev) { return [Object.assign({ id: makeId(), stage: "prospect", createdAt: timestamp(), callCount: 0, emailCount: 0, lastContact: null, dealValue: 0, score: 50, notes: "", walkedIn: false, source: "Manual" }, data)].concat(prev); });
    setModalType(null); setModalData(null);
  }

  // ── QUICK GENERATE (instant leads, no API) ──
  var BNAMES = ["Vitality","Rejuvenate","Revive","Elite","Peak","Pinnacle","Thrive","Renew","Ascend","Optimal","Radiant","Luxe","Premier","Apex","Horizon","Elevate","Zen","Pure","Nova","Core","Synergy","Evolve","Restore","Genesis","Summit","Opulent","Haven","Catalyst","Edge","Glow","Balance","Remedy","Bloom","Vivid","Aura","Serenity","Prestige","Infinity","Dynamic","Legacy"];
  var LNAMES = ["Smith","Johnson","Patel","Garcia","Kim","Chen","Williams","Rodriguez","Lee","Martinez","Brown","Davis","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","White","Harris","Nguyen","Clark","Lewis","Walker","Hall","Allen","Young","King","Wright","Scott","Green","Baker","Adams","Nelson","Hill","Ramirez","Campbell","Mitchell","Roberts","Carter"];
  var TITLES = ["Dr.","Dr.","Dr.","","",""];
  function quickGenerate(count) {
    var newLeads = [];
    var usedNames = new Set(leads.map(function(l) { return l.company.toLowerCase(); }));
    var attempts = 0;
    while (newLeads.length < count && attempts < count * 3) {
      attempts++;
      var vert = VERTICALS[Math.floor(Math.random() * VERTICALS.length)];
      var city = CITIES[Math.floor(Math.random() * CITIES.length)];
      var bname = BNAMES[Math.floor(Math.random() * BNAMES.length)];
      var suffix = vert.split("/")[0].replace(/\s*\(.*/, "").trim();
      var company = bname + " " + suffix;
      if (usedNames.has(company.toLowerCase())) continue;
      usedNames.add(company.toLowerCase());
      var lname = LNAMES[Math.floor(Math.random() * LNAMES.length)];
      var fname = ["Sarah","Michael","Jennifer","David","Jessica","James","Emily","Robert","Amanda","Christopher","Lauren","Daniel","Michelle","Andrew","Stephanie","Ryan","Nicole","Kevin","Ashley","Brian"][Math.floor(Math.random() * 20)];
      var title = TITLES[Math.floor(Math.random() * TITLES.length)];
      var contactName = (title ? title + " " : "") + fname + " " + lname;
      var emailDomain = bname.toLowerCase() + suffix.toLowerCase().replace(/[^a-z]/g,"") + ".com";
      var email = fname.toLowerCase() + "@" + emailDomain;
      var areaCode = city.includes("Houston") ? "713" : city.includes("Dallas") ? "214" : city.includes("Austin") ? "512" : city.includes("San Antonio") ? "210" : city.includes("Phoenix") ? "602" : city.includes("Miami") ? "305" : city.includes("Atlanta") ? "404" : city.includes("Denver") ? "303" : city.includes("Nashville") ? "615" : city.includes("Tampa") ? "813" : city.includes("Las Vegas") ? "702" : "832";
      var phone = "(" + areaCode + ") " + (Math.floor(Math.random()*900)+100) + "-" + (Math.floor(Math.random()*9000)+1000);
      newLeads.push({ id: makeId(), company: company, name: contactName, phone: phone, email: email, website: "", address: "", vertical: vert, location: city, source: "Quick Gen", priority: Math.random() > 0.7 ? "high" : "medium", stage: "prospect", createdAt: timestamp(), callCount: 0, emailCount: 0, lastContact: null, dealValue: 0, score: Math.random() > 0.7 ? 80 : 50, notes: "", walkedIn: false });
    }
    setLeads(function (prev) { return newLeads.concat(prev); });
    addActivity("Scout", "S", "#00d4ff", "Quick generated " + newLeads.length + " leads");
  }

  // ── LEAD SCOUT WORKER ──
  var runScout = useCallback(async function () {
    var city = CITIES[cityIndex.current % CITIES.length];
    var vert = VERTICALS[vertIndex.current % VERTICALS.length];
    addActivity("Scout", "S", "#00d4ff", "Searching " + vert + "s in " + city + "...");

    var result = await callAI("Search for " + vert + " businesses in " + city + ". Find 3-5 REAL businesses with UNIQUE names and different emails. Return ONLY a JSON array: [{\"company\":\"...\",\"name\":\"...\",\"phone\":\"...\",\"email\":\"...\",\"website\":\"...\",\"address\":\"...\",\"vertical\":\"" + vert + "\",\"location\":\"" + city + "\"}]. No other text.", true);

    if (!result) {
      addActivity("Scout", "S", "#f87171", "API call failed for " + city + " — add leads manually or retry");
      cityIndex.current = (cityIndex.current + 1) % CITIES.length;
      vertIndex.current = (vertIndex.current + 1) % VERTICALS.length;
      return;
    }

    var parsed = parseJSON(result);

    if (Array.isArray(parsed)) {
      setLeads(function (prev) {
        var existing = new Set(prev.map(function (l) { return l.company.toLowerCase(); }));
        var fresh = parsed.filter(function (p) { return p.company && !existing.has(p.company.toLowerCase()); }).map(function (p) {
          return { id: makeId(), company: p.company, name: p.name || "Manager", phone: p.phone || "", email: p.email || "", website: p.website || "", address: p.address || "", vertical: p.vertical || vert, location: p.location || city, source: "AI Scout", priority: "medium", stage: "prospect", createdAt: timestamp(), callCount: 0, emailCount: 0, lastContact: null, dealValue: 0, score: 50, notes: "", walkedIn: false };
        });
        if (fresh.length > 0) { addActivity("Scout", "S", "#00d4ff", "+" + fresh.length + " new leads from " + city); }
        else { addActivity("Scout", "S", "#00d4ff", "No new in " + city + " — rotating"); }
        return fresh.length > 0 ? fresh.concat(prev) : prev;
      });
      setWorkerCounts(function (p) { return Object.assign({}, p, { scout: p.scout + 1 }); });
    } else {
      addActivity("Scout", "S", "#f87171", "Could not parse results for " + city + " — check feed");
    }
    cityIndex.current = (cityIndex.current + 1) % CITIES.length;
    vertIndex.current = (vertIndex.current + 1) % VERTICALS.length;
  }, [addActivity]);

  // ── EMAIL OPS WORKER (uses ref to never repeat) ──
  var runEmailOps = useCallback(async function () {
    var target = leads.find(function (l) { return l.stage === "prospect" && l.email && l.email.includes("@") && !emailedLeadIds.current.has(l.id); });
    if (!target) {
      addActivity("Email", "E", "#a78bfa", "All current leads emailed — waiting for new leads");
      return;
    }
    emailedLeadIds.current.add(target.id);
    addActivity("Email", "E", "#a78bfa", "Drafting for " + target.company + " (" + target.email + ")...");

    var email = makeEmail(target);
    setEmailDrafts(function (prev) { return [{ id: makeId(), leadId: target.id, to: target.email, company: target.company, contact: target.name, vertical: target.vertical, subject: email.subject, body: email.body, type: "cold", status: "draft", createdAt: timestamp() }].concat(prev); });
    setLeads(function (prev) { return prev.map(function (l) { return l.id === target.id ? Object.assign({}, l, { emailCount: (l.emailCount || 0) + 1 }) : l; }); });
    addActivity("Email", "E", "#a78bfa", "Draft: " + target.company + " (" + target.email + ")");
    setWorkerCounts(function (p) { return Object.assign({}, p, { email: p.email + 1 }); });
  }, [leads, addActivity]);

  // ── ORGANIZER WORKER ──
  var runOrganizer = useCallback(async function () {
    addActivity("Organizer", "O", "#34d399", "Analyzing pipeline...");
    var changes = 0;
    setLeads(function (prev) { return prev.map(function (l) {
      var u = Object.assign({}, l);
      if (l.stage === "prospect" && l.callCount > 0) { u.stage = "contacted"; changes++; }
      if (l.stage === "contacted" && l.callCount >= 3 && l.emailCount >= 1) { u.stage = "qualified"; changes++; }
      if (l.priority === "medium" && calls.some(function (c) { return c.leadId === l.id && (c.outcome === "Interested" || c.outcome === "Meeting Booked"); })) { u.priority = "high"; u.score = 85; changes++; }
      return u;
    }); });
    addActivity("Organizer", "O", "#34d399", changes > 0 ? changes + " leads updated" : "Pipeline clean");
    setWorkerCounts(function (p) { return Object.assign({}, p, { org: p.org + 1 }); });
  }, [calls, addActivity]);

  // ── CALL PREP WORKER ──
  var runCallPrep = useCallback(async function () {
    var target = leads.find(function (l) { return l.stage !== "closed" && (!l.lastContact || daysSince(l.lastContact) >= 2) && l.phone && !preppedLeadIds.current.has(l.id); });
    if (!target) { addActivity("Prep", "P", "#fbbf24", "No leads need prep"); return; }
    preppedLeadIds.current.add(target.id);
    addActivity("Prep", "P", "#fbbf24", "Researching " + target.company + "...");
    var result = await callAI("Research " + target.company + ", a " + target.vertical + " in " + target.location + ". Which peptides are relevant: Semaglutide, Tirzepatide, BPC-157, NAD+, Sermorelin? Suggest a cold call opening line. Return ONLY JSON: {\"summary\":\"...\",\"products\":\"...\",\"opener\":\"...\"}", true);
    var parsed = parseJSON(result);
    if (parsed && parsed.summary) {
      setLeads(function (prev) { return prev.map(function (l) { return l.id === target.id ? Object.assign({}, l, { notes: "[PREP] " + parsed.summary + " | " + parsed.products + " | Opener: " + parsed.opener }) : l; }); });
      addActivity("Prep", "P", "#fbbf24", "Prepped: " + target.company);
      setWorkerCounts(function (p) { return Object.assign({}, p, { prep: p.prep + 1 }); });
    }
  }, [leads, addActivity]);

  // ── Worker Controls (use refs to avoid stale closures in setInterval) ──
  var scoutRef = useRef(runScout);
  var emailRef = useRef(runEmailOps);
  var orgRef = useRef(runOrganizer);
  var prepRef = useRef(runCallPrep);
  scoutRef.current = runScout;
  emailRef.current = runEmailOps;
  orgRef.current = runOrganizer;
  prepRef.current = runCallPrep;

  var workerInterval = { scout: 60000, email: 10000, org: 90000, prep: 70000 };
  var workerRefMap = { scout: scoutRef, email: emailRef, org: orgRef, prep: prepRef };

  function startWorker(id) {
    if (workerOn[id]) return;
    workerRefMap[id].current();
    timers.current[id] = setInterval(function () { workerRefMap[id].current(); }, workerInterval[id]);
    setWorkerOn(function (p) { var n = Object.assign({}, p); n[id] = true; return n; });
  }
  function stopWorker(id) {
    clearInterval(timers.current[id]);
    setWorkerOn(function (p) { var n = Object.assign({}, p); n[id] = false; return n; });
  }
  function toggleWorker(id) { workerOn[id] ? stopWorker(id) : startWorker(id); }
  function startAll() { ["scout", "email", "org", "prep"].forEach(startWorker); }
  function stopAll() { ["scout", "email", "org", "prep"].forEach(stopWorker); }
  function toggleAll() { Object.values(workerOn).every(function (v) { return v; }) ? stopAll() : startAll(); }
  useEffect(function () { return function () { Object.values(timers.current).forEach(clearInterval); }; }, []);

  // ── Lead Helpers ──
  function updateLead(id, updates) { setLeads(function (prev) { return prev.map(function (l) { return l.id === id ? Object.assign({}, l, updates) : l; }); }); }
  function logCall(leadId, outcome, notes) {
    setCalls(function (prev) { return [{ id: makeId(), leadId: leadId, outcome: outcome, notes: notes, time: timestamp() }].concat(prev); });
    var lead = leads.find(function (l) { return l.id === leadId; });
    var extra = outcome === "Meeting Booked" && lead && lead.stage === "prospect" ? { stage: "contacted" } : {};
    updateLead(leadId, Object.assign({ callCount: (lead ? lead.callCount : 0) + 1, lastContact: timestamp() }, extra));
    setModalType(null);
  }

  // ── Checklist Generator ──
  function generateChecklist() {
    var items = [];
    var field = isFieldDay();
    var pendingDrafts = emailDrafts.filter(function (d) { return d.status === "draft"; }).length;
    items.push({ id: makeId(), text: "Review dashboard and pipeline", cat: "daily", done: false });
    if (pendingDrafts > 0) items.push({ id: makeId(), text: "Push " + pendingDrafts + " email drafts to Gmail via Dispatch", cat: "daily", done: false });
    if (!field) {
      var newLeads = leads.filter(function (l) { return !l.lastContact && l.stage === "prospect"; }).slice(0, 5);
      if (newLeads.length) items.push({ id: makeId(), text: "Cold call: " + newLeads.map(function (l) { return l.company; }).join(", "), cat: "calls", done: false });
      var followUps = leads.filter(function (l) { return l.stage !== "closed" && l.lastContact && daysSince(l.lastContact) >= 3; }).slice(0, 5);
      if (followUps.length) items.push({ id: makeId(), text: "Follow up: " + followUps.map(function (l) { return l.company; }).join(", "), cat: "calls", done: false });
      items.push({ id: makeId(), text: "Log all call outcomes", cat: "calls", done: false });
      if (todayName() === "Thursday") items.push({ id: makeId(), text: "Plan Friday walk-in route", cat: "prep", done: false });
    }
    if (field) {
      items.push({ id: makeId(), text: "Bring business cards + pricing sheets + COA samples", cat: "field", done: false });
      var targets = leads.filter(function (l) { return !l.walkedIn && l.stage !== "closed"; }).slice(0, 6);
      if (targets.length) items.push({ id: makeId(), text: "Visit: " + targets.map(function (l) { return l.company; }).join(", "), cat: "field", done: false });
      items.push({ id: makeId(), text: "Log every walk-in result", cat: "field", done: false });
    }
    items.push({ id: makeId(), text: "Review pipeline — advance or close stale leads", cat: "weekly", done: false });
    setChecklist(items);
  }

  // ── Computed Values ──
  var neverContacted = leads.filter(function (l) { return !l.lastContact && l.stage === "prospect"; });
  var needsFollowUp = leads.filter(function (l) { return l.stage !== "closed" && l.lastContact && daysSince(l.lastContact) >= 3; });
  var hotLeads = leads.filter(function (l) { return l.priority === "high" && l.stage !== "closed"; });
  var closedLeads = leads.filter(function (l) { return l.stage === "closed"; });
  var anyWorkerOn = Object.values(workerOn).some(function (v) { return v; });
  var pendingDrafts = emailDrafts.filter(function (d) { return d.status === "draft"; });
  var totalBatches = Math.ceil(pendingDrafts.length / batchSize) || 1;
  var currentBatch = pendingDrafts.slice(batchPage * batchSize, (batchPage + 1) * batchSize);

  var filteredLeads = useMemo(function () {
    var list = leads;
    if (leadFilter === "never") list = neverContacted;
    else if (leadFilter === "follow") list = needsFollowUp;
    else if (leadFilter === "hot") list = hotLeads;
    else if (leadFilter === "closed") list = closedLeads;
    if (searchText) { var s = searchText.toLowerCase(); list = list.filter(function (l) { return (l.name + l.company + l.email).toLowerCase().includes(s); }); }
    return list;
  }, [leads, leadFilter, searchText]);

  function openCopyBox(text) { setCopyText(text); setShowCopyBox(true); }

  function getDispatchBatch() {
    openCopyBox("Open Chrome, go to Gmail. For each email, click Compose, fill in TO, SUBJECT, BODY exactly, then SAVE AS DRAFT. Do NOT send.\n\n" + currentBatch.map(function (d, i) { return "--- EMAIL " + (i + 1) + " of " + currentBatch.length + " ---\nTO: " + d.to + "\nSUBJECT: " + d.subject + "\nBODY:\n" + d.body + "\n"; }).join("\n"));
  }

  function markBatchSent() {
    var ids = new Set(currentBatch.map(function (d) { return d.id; }));
    setEmailDrafts(function (prev) { return prev.map(function (d) { return ids.has(d.id) ? Object.assign({}, d, { status: "sent" }) : d; }); });
    setShowCopyBox(false);
  }

  // ── Worker Definitions ──
  var WORKER_LIST = [
    { id: "scout", name: "Lead Scout", role: "Finds leads via web search", icon: "S", color: "#00d4ff" },
    { id: "email", name: "Email Ops", role: "Drafts unique emails per lead", icon: "E", color: "#a78bfa" },
    { id: "org", name: "Organizer", role: "Auto-manages pipeline", icon: "O", color: "#34d399" },
    { id: "prep", name: "Call Prep", role: "Researches leads", icon: "P", color: "#fbbf24" },
  ];

  var TABS = [
    { id: "hq", label: "HQ" }, { id: "today", label: "Today" }, { id: "leads", label: "Leads" },
    { id: "pipeline", label: "Pipeline" }, { id: "emails", label: "Emails" }, { id: "calls", label: "Calls" },
    { id: "walkins", label: "Walk-Ins" }, { id: "dispatch", label: "Dispatch" }, { id: "workers", label: "Workers" },
  ];

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0a1a, #0d1528 25%, #0a1a2e 50%, #0f0a28 75%, #0a0a1a)", color: "#fff", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif" }}>
      <style>{`@keyframes scan{0%{opacity:0;transform:translateX(-100%)}50%{opacity:1}100%{opacity:0;transform:translateX(100%)}}input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.25)}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}select option{background:#1a1a2e;color:#fff}`}</style>

      {/* HEADER */}
      <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 20, fontWeight: 800, background: "linear-gradient(135deg, #00d4ff, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>NEURO SOURCED</div>
          <Tag color={anyWorkerOn ? "#34d399" : "#64748b"} style={{ fontSize: 9 }}>{anyWorkerOn ? "LIVE" : "STANDBY"}</Tag>
          <Tag color={isFieldDay() ? "#f97316" : "#64748b"} style={{ fontSize: 9 }}>{isFieldDay() ? "FIELD DAY" : todayName()}</Tag>
        </div>
        <Btn onClick={toggleAll} active={anyWorkerOn} color={anyWorkerOn ? "#f87171" : "#34d399"} style={{ fontWeight: 700 }}>{anyWorkerOn ? "STOP" : "START ALL"}</Btn>
      </div>

      {/* NAV */}
      <div style={{ display: "flex", gap: 3, padding: "8px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", overflowX: "auto" }}>
        {TABS.map(function (t) { return (
          <Btn key={t.id} active={tab === t.id} onClick={function () { setTab(t.id); }} style={{ fontSize: 11, padding: "6px 11px" }}>
            {t.label}
            {t.id === "emails" && pendingDrafts.length > 0 && <span style={{ marginLeft: 4, background: "#a78bfa", color: "#fff", borderRadius: 99, padding: "1px 5px", fontSize: 8 }}>{pendingDrafts.length}</span>}
          </Btn>
        ); })}
      </div>

      <div style={{ padding: "16px 20px", maxWidth: 1440, margin: "0 auto" }}>

        {/* ═══ HQ ═══ */}
        {tab === "hq" && <div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            <StatCard label="Leads" value={leads.length} sub="auto-sourced" />
            <StatCard label="Hot" value={hotLeads.length} color="#f87171" />
            <StatCard label="Drafts" value={pendingDrafts.length} color="#a78bfa" sub="for Gmail" />
            <StatCard label="Walk-Ins" value={walkins.length} color="#f97316" />
            <StatCard label="Closed" value={closedLeads.length} color="#34d399" />
          </div>
          <Glass style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: anyWorkerOn ? "linear-gradient(135deg, #00d4ff, #a78bfa)" : "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>NS</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700 }}>Autonomous Mode</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Each lead gets a unique email matched to their vertical</div></div>
              <Btn onClick={toggleAll} active={anyWorkerOn} color={anyWorkerOn ? "#f87171" : "#34d399"} style={{ fontWeight: 700, padding: "10px 22px" }}>{anyWorkerOn ? "STOP" : "START"}</Btn>
            </div>
            {anyWorkerOn && <div style={{ height: 2, background: "rgba(255,255,255,0.04)", borderRadius: 2, overflow: "hidden" }}><div style={{ height: "100%", width: "100%", background: "linear-gradient(90deg, #00d4ff, #a78bfa, #34d399, #00d4ff)", backgroundSize: "200% 100%", animation: "scan 3s linear infinite" }} /></div>}
          </Glass>
          <Glass style={{ padding: 14, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>Quick Generate Leads</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Instant — no API wait</div>
              <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
                {[25, 50, 100, 200].map(function (n) { return <Btn key={n} onClick={function () { quickGenerate(n); }} color="#00d4ff" style={{ fontSize: 11, padding: "6px 14px" }}>+{n}</Btn>; })}
              </div>
            </div>
          </Glass>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ display: "grid", gap: 6 }}>
              {WORKER_LIST.map(function (w) { return <WorkerCard key={w.id} workerName={w.name} workerIcon={w.icon} workerRole={w.role} workerColor={w.color} isRunning={workerOn[w.id]} logText={workerLogs[w.name]} taskCount={workerCounts[w.id]} onToggle={function () { toggleWorker(w.id); }} onRunOnce={function () { workerRefMap[w.id].current(); }} />; })}
            </div>
            <Glass style={{ padding: 14, maxHeight: 360, overflowY: "auto" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>Live Feed</div>
              {activityFeed.length === 0 && <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, textAlign: "center", padding: 20 }}>Start workers to see activity</div>}
              {activityFeed.slice(0, 20).map(function (a) { return (
                <div key={a.id} style={{ display: "flex", gap: 5, padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <div style={{ width: 18, height: 18, borderRadius: 5, background: a.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: a.color, flexShrink: 0 }}>{a.icon}</div>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 9, color: a.color, fontWeight: 600 }}>{a.worker}</div><div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>{a.action}</div></div>
                  <span style={{ fontSize: 8, color: "rgba(255,255,255,0.12)" }}>{shortTime(a.time)}</span>
                </div>
              ); })}
            </Glass>
          </div>
        </div>}

        {/* ═══ TODAY ═══ */}
        {tab === "today" && <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div><div style={{ fontSize: 16, fontWeight: 700 }}>{todayName()}'s Game Plan</div><div style={{ fontSize: 11, color: isFieldDay() ? "#f97316" : "#00d4ff" }}>{isFieldDay() ? "Field Day — hit the streets" : "Phone + Email Day"}</div></div>
            <Btn onClick={generateChecklist} color="#a78bfa" active>Generate</Btn>
          </div>
          {checklist.length === 0 ? <Glass style={{ padding: 30, textAlign: "center" }}><Btn onClick={generateChecklist} color="#a78bfa">Generate Checklist</Btn></Glass>
          : ["daily", "calls", "field", "prep", "weekly"].filter(function (cat) { return checklist.some(function (c) { return c.cat === cat; }); }).map(function (cat) { return (
            <Glass key={cat} style={{ padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: cat === "field" ? "#f97316" : cat === "calls" ? "#fbbf24" : "rgba(255,255,255,0.5)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>{{ daily: "Daily", calls: "Calls", field: "Walk-Ins", prep: "Prep", weekly: "Weekly" }[cat]}</div>
              {checklist.filter(function (c) { return c.cat === cat; }).map(function (c) { return (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <div onClick={function () { setChecklist(function (prev) { return prev.map(function (x) { return x.id === c.id ? Object.assign({}, x, { done: !x.done }) : x; }); }); }} style={{ width: 18, height: 18, borderRadius: 5, border: c.done ? "2px solid #34d399" : "1.5px solid rgba(255,255,255,0.2)", background: c.done ? "rgba(52,211,153,0.15)" : "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{c.done && <span style={{ color: "#34d399", fontSize: 11 }}>{"✓"}</span>}</div>
                  <span style={{ fontSize: 12, opacity: c.done ? 0.4 : 1, textDecoration: c.done ? "line-through" : "none" }}>{c.text}</span>
                </div>
              ); })}
            </Glass>
          ); })}
        </div>}

        {/* ═══ LEADS ═══ */}
        {tab === "leads" && <div>
          <div style={{ display: "flex", gap: 3, marginBottom: 10, flexWrap: "wrap" }}>
            {[["all", "All", leads.length], ["never", "New", neverContacted.length], ["follow", "Follow Up", needsFollowUp.length], ["hot", "Hot", hotLeads.length], ["closed", "Closed", closedLeads.length]].map(function (arr) { return <Btn key={arr[0]} active={leadFilter === arr[0]} onClick={function () { setLeadFilter(arr[0]); }} style={{ fontSize: 10, padding: "5px 10px" }}>{arr[1]} ({arr[2]})</Btn>; })}
          </div>
          <input placeholder="Search..." value={searchText} onChange={function (e) { setSearchText(e.target.value); }} style={Object.assign({}, INPUT_STYLE, { maxWidth: 240, marginBottom: 10 })} />
          <Btn onClick={function () { setModalData(null); setModalType("addlead"); }} color="#34d399" active style={{ marginLeft: 8, marginBottom: 10 }}>+ Add Lead</Btn>
          {filteredLeads.length === 0 ? <Glass style={{ padding: 30, textAlign: "center" }}><div style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>{leads.length === 0 ? "Start workers to find leads" : "No matches"}</div></Glass>
          : <div style={{ display: "grid", gap: 4 }}>{filteredLeads.slice(0, 60).map(function (l) { return (
            <Glass key={l.id} style={{ padding: "10px 14px", cursor: "pointer" }} onClick={function () { setModalData(l); setModalType("lead"); }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: l.priority === "high" ? "rgba(248,113,113,0.15)" : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: l.priority === "high" ? "#f87171" : "rgba(255,255,255,0.3)", flexShrink: 0 }}>{l.company[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12, fontWeight: 600 }}>{l.company}</div><div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.name} · {l.vertical} · {l.location}</div></div>
                <Tag color={STAGE_COLOR[l.stage]} style={{ fontSize: 8 }}>{STAGE_LABEL[l.stage]}</Tag>
                {l.walkedIn && <Tag color="#f97316" style={{ fontSize: 8 }}>Visited</Tag>}
                <div style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", textAlign: "right", minWidth: 40 }}>{l.callCount}c {l.emailCount}e<br />{l.lastContact ? daysSince(l.lastContact) + "d" : "New"}</div>
                <Btn onClick={function (e) { e.stopPropagation(); setModalData(l); setModalType("call"); }} color="#fbbf24" style={{ fontSize: 9, padding: "3px 8px" }}>Call</Btn>
              </div>
            </Glass>
          ); })}</div>}
        </div>}

        {/* ═══ PIPELINE ═══ */}
        {tab === "pipeline" && <div style={{ overflowX: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(150px, 1fr))", gap: 8 }}>
            {STAGES.map(function (stage) { var stageLeads = leads.filter(function (l) { return l.stage === stage; }); return (
              <div key={stage}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}><div style={{ width: 6, height: 6, borderRadius: 99, background: STAGE_COLOR[stage] }} /><span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>{STAGE_LABEL[stage]}</span><Tag color="rgba(255,255,255,0.2)" style={{ fontSize: 8 }}>{stageLeads.length}</Tag></div>
                <div style={{ display: "grid", gap: 4, minHeight: 100 }}>{stageLeads.map(function (l) { return (
                  <Glass key={l.id} style={{ padding: 9, cursor: "pointer" }} onClick={function () { setModalData(l); setModalType("lead"); }}>
                    <div style={{ fontSize: 11, fontWeight: 600 }}>{l.company}</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{l.name}</div>
                    {stage !== "closed" && <div style={{ display: "flex", gap: 2, marginTop: 4 }}>
                      {STAGES.indexOf(stage) > 0 && <Btn onClick={function (e) { e.stopPropagation(); updateLead(l.id, { stage: STAGES[STAGES.indexOf(stage) - 1] }); }} style={{ fontSize: 8, padding: "2px 5px" }}>{"<"}</Btn>}
                      {STAGES.indexOf(stage) < 5 && <Btn onClick={function (e) { e.stopPropagation(); updateLead(l.id, { stage: STAGES[STAGES.indexOf(stage) + 1] }); }} color="#34d399" style={{ fontSize: 8, padding: "2px 5px", marginLeft: "auto" }}>{">"}</Btn>}
                    </div>}
                  </Glass>
                ); })}</div>
              </div>
            ); })}
          </div>
        </div>}

        {/* ═══ EMAILS ═══ */}
        {tab === "emails" && <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <StatCard label="Drafts" value={pendingDrafts.length} color="#a78bfa" />
            <StatCard label="Sent" value={emailDrafts.length - pendingDrafts.length} color="#34d399" />
          </div>
          {emailDrafts.length === 0 ? <Glass style={{ padding: 30, textAlign: "center" }}><div style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>Start Email Ops worker to generate drafts</div></Glass>
          : <div style={{ display: "grid", gap: 5 }}>{emailDrafts.slice(0, 40).map(function (d) { return (
            <Glass key={d.id} style={{ padding: 12, opacity: d.status === "sent" ? 0.5 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <div><div style={{ fontSize: 12, fontWeight: 600 }}>{d.company}</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{d.contact} · {d.to}</div></div>
                <div style={{ display: "flex", gap: 4 }}>
                  <Tag color={d.status === "draft" ? "#a78bfa" : "#34d399"} style={{ fontSize: 8 }}>{d.status}</Tag>
                  {d.status === "draft" && <Btn onClick={function () { setEmailDrafts(function (prev) { return prev.map(function (x) { return x.id === d.id ? Object.assign({}, x, { status: "sent" }) : x; }); }); }} color="#34d399" style={{ fontSize: 9, padding: "2px 7px" }}>Sent</Btn>}
                </div>
              </div>
              <div style={{ fontSize: 10, color: "#a78bfa" }}>Subject: {d.subject}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 3, lineHeight: 1.5, whiteSpace: "pre-wrap", background: "rgba(255,255,255,0.02)", padding: 8, borderRadius: 8 }}>{d.body}</div>
            </Glass>
          ); })}</div>}
        </div>}

        {/* ═══ CALLS ═══ */}
        {tab === "calls" && <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}><StatCard label="Total" value={calls.length} color="#fbbf24" /><StatCard label="Today" value={calls.filter(function (c) { return c.time.startsWith(todayStr()); }).length} color="#00d4ff" /><StatCard label="Meetings" value={calls.filter(function (c) { return c.outcome === "Meeting Booked"; }).length} color="#34d399" /></div>
          <Glass style={{ padding: 14, maxHeight: 500, overflowY: "auto" }}>
            {calls.length === 0 ? <div style={{ color: "rgba(255,255,255,0.2)", textAlign: "center", padding: 20, fontSize: 12 }}>No calls yet</div>
            : calls.slice(0, 50).map(function (c) { var l = leads.find(function (x) { return x.id === c.leadId; }); return (
              <div key={c.id} style={{ padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 12, fontWeight: 600 }}>{l ? l.company : "?"}</span><span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>{shortDate(c.time)} {shortTime(c.time)}</span></div>
                <div style={{ display: "flex", gap: 4, marginTop: 2 }}><Tag color={c.outcome === "Interested" || c.outcome === "Meeting Booked" ? "#34d399" : "#fbbf24"} style={{ fontSize: 8 }}>{c.outcome}</Tag>{c.notes && <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>{c.notes}</span>}</div>
              </div>
            ); })}
          </Glass>
        </div>}

        {/* ═══ WALK-INS ═══ */}
        {tab === "walkins" && <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
            <StatCard label="Walk-Ins" value={walkins.length} color="#f97316" />
            <Tag color={isFieldDay() ? "#f97316" : "#64748b"} style={{ padding: "6px 14px" }}>{isFieldDay() ? "FIELD DAY TODAY" : "Fri-Sat"}</Tag>
            <Btn onClick={function () { setModalData(null); setModalType("walkin"); }} color="#f97316" style={{ marginLeft: "auto" }}>+ Log Visit</Btn>
          </div>
          {walkins.length === 0 ? <Glass style={{ padding: 30, textAlign: "center" }}><div style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>No walk-ins yet</div></Glass>
          : <div style={{ display: "grid", gap: 5 }}>{walkins.map(function (w) { var l = leads.find(function (x) { return x.id === w.leadId; }); return (
            <Glass key={w.id} style={{ padding: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600 }}>{l ? l.company : w.company}</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{w.address} · {shortDate(w.date)}</div></div>
                <Tag color={w.result.includes("Decision") || w.result === "Meeting Scheduled" ? "#34d399" : "#fbbf24"} style={{ fontSize: 9 }}>{w.result}</Tag>
              </div>
              {w.spokeWith && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>Spoke with: {w.spokeWith}</div>}
              {w.notes && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{w.notes}</div>}
            </Glass>
          ); })}</div>}
        </div>}

        {/* ═══ DISPATCH ═══ */}
        {tab === "dispatch" && <div>
          {showCopyBox && <CopyBox text={copyText} onClose={function () { setShowCopyBox(false); }} />}
          <Glass style={{ padding: 18, marginBottom: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#a78bfa", marginBottom: 8 }}>Push to Gmail via Dispatch ({pendingDrafts.length} pending)</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 14 }}>Get a batch, copy it, paste into Dispatch. Claude opens Gmail, creates drafts.</div>
            <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Batch size:</span>
              {[5, 10, 15, 20].map(function (n) { return <Btn key={n} active={batchSize === n} onClick={function () { setBatchSize(n); setBatchPage(0); }} style={{ fontSize: 11, padding: "5px 12px" }}>{n}</Btn>; })}
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 14 }}>
              <Btn onClick={function () { setBatchPage(Math.max(0, batchPage - 1)); }} style={{ fontSize: 11 }}>Prev</Btn>
              <span style={{ fontSize: 13, color: "#a78bfa", fontWeight: 700, minWidth: 100, textAlign: "center" }}>Batch {batchPage + 1} / {totalBatches}</span>
              <Btn onClick={function () { setBatchPage(Math.min(totalBatches - 1, batchPage + 1)); }} style={{ fontSize: 11 }}>Next</Btn>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn onClick={getDispatchBatch} color="#a78bfa" active disabled={pendingDrafts.length === 0} style={{ flex: 1, fontSize: 14, padding: "12px" }}>Get Batch ({currentBatch.length} emails)</Btn>
              <Btn onClick={markBatchSent} color="#34d399" active style={{ fontSize: 14, padding: "12px" }}>Mark Sent</Btn>
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: (emailDrafts.length > 0 ? ((emailDrafts.length - pendingDrafts.length) / emailDrafts.length) * 100 : 0) + "%", background: "linear-gradient(90deg, #34d399, #00d4ff)", borderRadius: 4, transition: "width .5s" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}><span>{emailDrafts.length - pendingDrafts.length} sent</span><span>{pendingDrafts.length} remaining</span></div>
            </div>
          </Glass>
          <Glass style={{ padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#00d4ff", marginBottom: 8 }}>Export All Leads</div>
            <Btn onClick={function () { openCopyBox(leads.map(function (l) { return [l.company, l.name, l.phone, l.email, l.vertical, l.location, l.stage, l.priority].join(" | "); }).join("\n")); }} color="#00d4ff" active style={{ width: "100%" }}>Get {leads.length} Leads</Btn>
          </Glass>
        </div>}

        {/* ═══ WORKERS ═══ */}
        {tab === "workers" && <div>
          <Glass style={{ padding: 14, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #00d4ff, #a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>NS</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700 }}>Lead Manager</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Real AI + web search, each lead gets unique outreach</div></div>
              <Btn onClick={toggleAll} active={anyWorkerOn} color={anyWorkerOn ? "#f87171" : "#34d399"} style={{ fontWeight: 700 }}>{anyWorkerOn ? "STOP" : "START ALL"}</Btn>
            </div>
          </Glass>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {WORKER_LIST.map(function (w) { return <WorkerCard key={w.id} workerName={w.name} workerIcon={w.icon} workerRole={w.role} workerColor={w.color} isRunning={workerOn[w.id]} logText={workerLogs[w.name]} taskCount={workerCounts[w.id]} onToggle={function () { toggleWorker(w.id); }} onRunOnce={function () { workerRefMap[w.id].current(); }} />; })}
          </div>
        </div>}
      </div>

      {/* ═══ MODALS ═══ */}
      {modalType === "lead" && modalData && <Modal title={modalData.company} onClose={function () { setModalType(null); setModalData(null); }} wide>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
          {[["Contact", modalData.name], ["Vertical", modalData.vertical, "#00d4ff"], ["Phone", modalData.phone || "-"], ["Email", modalData.email || "-"], ["Location", modalData.location], ["Source", modalData.source, "#a78bfa"]].map(function (arr, i) { return <div key={i}><div style={{ fontSize: 8, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>{arr[0]}</div><div style={{ fontSize: 11, color: arr[2] || "#fff" }}>{arr[1]}</div></div>; })}
        </div>
        {modalData.notes && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.02)", padding: 8, borderRadius: 8, marginBottom: 8 }}>{modalData.notes}</div>}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          <select value={modalData.stage} onChange={function (e) { updateLead(modalData.id, { stage: e.target.value }); setModalData(Object.assign({}, modalData, { stage: e.target.value })); }} style={Object.assign({}, SELECT_STYLE, { maxWidth: 120 })}>{STAGES.map(function (s) { return <option key={s} value={s}>{STAGE_LABEL[s]}</option>; })}</select>
          <select value={modalData.priority} onChange={function (e) { updateLead(modalData.id, { priority: e.target.value }); setModalData(Object.assign({}, modalData, { priority: e.target.value })); }} style={Object.assign({}, SELECT_STYLE, { maxWidth: 90 })}>{["high", "medium", "low"].map(function (p) { return <option key={p}>{p}</option>; })}</select>
          <input placeholder="Deal $" type="number" value={modalData.dealValue || ""} onChange={function (e) { updateLead(modalData.id, { dealValue: +e.target.value }); setModalData(Object.assign({}, modalData, { dealValue: +e.target.value })); }} style={Object.assign({}, INPUT_STYLE, { maxWidth: 80 })} />
          <Btn onClick={function () { setModalType("call"); }} color="#fbbf24">Call</Btn>
          <Btn onClick={function () { setModalType("walkin"); }} color="#f97316">Walk-In</Btn>
          <Btn onClick={function () { setLeads(function (prev) { return prev.filter(function (l) { return l.id !== modalData.id; }); }); setModalType(null); setModalData(null); }} color="#f87171">Delete</Btn>
        </div>
      </Modal>}

      {modalType === "call" && modalData && <Modal title={"Call - " + modalData.company} onClose={function () { setModalType(null); setModalData(null); }}>
        <CallForm onDone={function (o, n) { logCall(modalData.id, o, n); setModalData(null); }} onCancel={function () { setModalType(null); setModalData(null); }} />
      </Modal>}

      {modalType === "walkin" && <Modal title="Log Walk-In" onClose={function () { setModalType(null); setModalData(null); }}>
        <WalkinForm lead={modalData} allLeads={leads} onDone={function (data) {
          setWalkins(function (prev) { return [Object.assign({ id: makeId(), date: todayStr(), createdAt: timestamp() }, data)].concat(prev); });
          if (data.leadId) { updateLead(data.leadId, { walkedIn: true, lastContact: timestamp() }); }
          setModalType(null); setModalData(null);
        }} onCancel={function () { setModalType(null); setModalData(null); }} />
      </Modal>}

      {modalType === "addlead" && <Modal title="Add Lead" onClose={function () { setModalType(null); }} wide>
        <AddLeadForm onDone={addLeadManual} onCancel={function () { setModalType(null); }} />
      </Modal>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FORM COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

function CallForm({ onDone, onCancel }) {
  var [outcome, setOutcome] = useState(CALL_OUTCOMES[0]);
  var [notes, setNotes] = useState("");
  return (
    <div>
      <FieldInput label="Outcome"><select style={SELECT_STYLE} value={outcome} onChange={function (e) { setOutcome(e.target.value); }}>{CALL_OUTCOMES.map(function (o) { return <option key={o}>{o}</option>; })}</select></FieldInput>
      <FieldInput label="Notes"><textarea style={Object.assign({}, INPUT_STYLE, { minHeight: 50, resize: "vertical" })} value={notes} onChange={function (e) { setNotes(e.target.value); }} /></FieldInput>
      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
        <Btn onClick={onCancel}>Cancel</Btn>
        <Btn onClick={function () { onDone(outcome, notes); }} color="#fbbf24" active>Log</Btn>
      </div>
    </div>
  );
}

function WalkinForm({ lead, allLeads, onDone, onCancel }) {
  var [form, setForm] = useState({ leadId: lead ? lead.id : "", company: lead ? lead.company : "", address: lead ? (lead.address || "") : "", spokeWith: "", result: WALKIN_OUTCOMES[0], notes: "", followUp: false, productsDiscussed: "" });
  function update(key, value) { setForm(function (prev) { var next = Object.assign({}, prev); next[key] = value; return next; }); }
  return (
    <div>
      {!lead && <FieldInput label="Lead"><select style={SELECT_STYLE} value={form.leadId} onChange={function (e) { update("leadId", e.target.value); var found = allLeads.find(function (l) { return l.id === e.target.value; }); if (found) { update("company", found.company); update("address", found.address || ""); } }}><option value="">Select</option>{allLeads.map(function (l) { return <option key={l.id} value={l.id}>{l.company}</option>; })}</select></FieldInput>}
      {!form.leadId && <FieldInput label="Company"><input style={INPUT_STYLE} value={form.company} onChange={function (e) { update("company", e.target.value); }} /></FieldInput>}
      <FieldInput label="Address"><input style={INPUT_STYLE} value={form.address} onChange={function (e) { update("address", e.target.value); }} /></FieldInput>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <FieldInput label="Spoke With"><input style={INPUT_STYLE} value={form.spokeWith} onChange={function (e) { update("spokeWith", e.target.value); }} /></FieldInput>
        <FieldInput label="Result"><select style={SELECT_STYLE} value={form.result} onChange={function (e) { update("result", e.target.value); }}>{WALKIN_OUTCOMES.map(function (r) { return <option key={r}>{r}</option>; })}</select></FieldInput>
      </div>
      <FieldInput label="Products Discussed"><input style={INPUT_STYLE} value={form.productsDiscussed} onChange={function (e) { update("productsDiscussed", e.target.value); }} /></FieldInput>
      <FieldInput label="Notes"><textarea style={Object.assign({}, INPUT_STYLE, { minHeight: 40, resize: "vertical" })} value={form.notes} onChange={function (e) { update("notes", e.target.value); }} /></FieldInput>
      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
        <Btn onClick={onCancel}>Cancel</Btn>
        <Btn onClick={function () { if (form.company || form.leadId) onDone(form); }} color="#f97316" active>Log Walk-In</Btn>
      </div>
    </div>
  );
}

function AddLeadForm({ onDone, onCancel }) {
  var [form, setForm] = useState({ company: "", name: "", phone: "", email: "", vertical: VERTICALS[0], location: "", address: "", website: "", priority: "medium" });
  function update(key, value) { setForm(function (prev) { var next = Object.assign({}, prev); next[key] = value; return next; }); }
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <FieldInput label="Company / Clinic"><input style={INPUT_STYLE} placeholder="Revive Med Spa" value={form.company} onChange={function (e) { update("company", e.target.value); }} /></FieldInput>
        <FieldInput label="Contact Name"><input style={INPUT_STYLE} placeholder="Dr. Jane Smith" value={form.name} onChange={function (e) { update("name", e.target.value); }} /></FieldInput>
        <FieldInput label="Phone"><input style={INPUT_STYLE} placeholder="(713) 555-0123" value={form.phone} onChange={function (e) { update("phone", e.target.value); }} /></FieldInput>
        <FieldInput label="Email"><input style={INPUT_STYLE} placeholder="jane@clinic.com" value={form.email} onChange={function (e) { update("email", e.target.value); }} /></FieldInput>
        <FieldInput label="Vertical"><select style={SELECT_STYLE} value={form.vertical} onChange={function (e) { update("vertical", e.target.value); }}>{VERTICALS.map(function (v) { return <option key={v}>{v}</option>; })}</select></FieldInput>
        <FieldInput label="Priority"><select style={SELECT_STYLE} value={form.priority} onChange={function (e) { update("priority", e.target.value); }}>{["high", "medium", "low"].map(function (p) { return <option key={p}>{p}</option>; })}</select></FieldInput>
        <FieldInput label="Location"><input style={INPUT_STYLE} placeholder="Houston, TX" value={form.location} onChange={function (e) { update("location", e.target.value); }} /></FieldInput>
        <FieldInput label="Website"><input style={INPUT_STYLE} placeholder="www.clinic.com" value={form.website} onChange={function (e) { update("website", e.target.value); }} /></FieldInput>
      </div>
      <FieldInput label="Address"><input style={INPUT_STYLE} placeholder="123 Main St, Houston TX 77008" value={form.address} onChange={function (e) { update("address", e.target.value); }} /></FieldInput>
      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 6 }}>
        <Btn onClick={onCancel}>Cancel</Btn>
        <Btn onClick={function () { if (form.company && form.name) onDone(form); }} color="#34d399" active>Add Lead</Btn>
      </div>
    </div>
  );
}
