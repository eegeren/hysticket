import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import ExcelJS from "exceljs";

export const runtime = "nodejs";

const CATEGORY_LABELS: Record<string, string> = {
  INTERNET_WAN: "İnternet / WAN",
  LAN_WIFI: "LAN / Wi-Fi",
  POS: "POS",
  PRINTER_BARCODE: "Yazıcı / Barkod",
  PC_TABLET: "PC / Tablet",
  ACCOUNT_ACCESS: "Hesap Erişimi",
  APP_SERVER: "Uygulama / Sunucu",
  OTHER: "Diğer",
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Açık",
  IN_PROGRESS: "Kabul edildi",
  WAITING_STORE: "Mağaza beklemede",
  RESOLVED: "Çözüldü",
  CLOSED: "Kapalı",
};

const IMPACT_LABELS: Record<string, string> = {
  SALES_STOPPED: "Satış durdu",
  PARTIAL: "Kısmi etki",
  INFO: "Bilgi",
};

const C = {
  headerBg: "1F4B99",
  headerFg: "FFFFFF",
  rowAlt: "0F1E3A",
  rowBase: "0B1629",
  border: "1E293B",
  textMain: "E2E8F0",
  textDim: "94A3B8",
  accent: "1AC6FF",
  p1Bg: "3B0000",
  p1Fg: "FF8080",
  p2Bg: "2D1B00",
  p2Fg: "FFA040",
  p3Bg: "00172D",
  p3Fg: "60C0FF",
  greenBg: "002D1B",
  greenFg: "60FFAA",
  redBg: "2D0000",
  redFg: "FF6060",
};

function headerStyle(): Partial<ExcelJS.Style> {
  return {
    font: { bold: true, color: { argb: C.headerFg }, size: 11 },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: C.headerBg } },
    alignment: { vertical: "middle", horizontal: "center", wrapText: true },
    border: {
      top: { style: "thin", color: { argb: C.border } },
      bottom: { style: "thin", color: { argb: C.border } },
      left: { style: "thin", color: { argb: C.border } },
      right: { style: "thin", color: { argb: C.border } },
    },
  };
}

function cellStyle(alt = false): Partial<ExcelJS.Style> {
  return {
    font: { color: { argb: C.textMain }, size: 10 },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: alt ? C.rowAlt : C.rowBase } },
    alignment: { vertical: "middle" },
    border: {
      top: { style: "hair", color: { argb: C.border } },
      bottom: { style: "hair", color: { argb: C.border } },
    },
  };
}

function numStyle(alt = false): Partial<ExcelJS.Style> {
  return {
    ...cellStyle(alt),
    alignment: { vertical: "middle", horizontal: "center" },
    font: { color: { argb: C.accent }, bold: true, size: 10 },
  };
}

function applySheetDefaults(ws: ExcelJS.Worksheet) {
  ws.properties.defaultRowHeight = 18;
  ws.views = [{ state: "frozen", ySplit: 1 }];
}

export async function GET(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  try {
    const { rows: tickets } = await pool.query(
      "SELECT id, store_id, title, category, impact, priority, status, created_at FROM tickets ORDER BY created_at DESC"
    );

    if (!tickets || tickets.length === 0) {
      return NextResponse.json({ error: "Veri bulunamadı" }, { status: 404 });
    }

    const storeCounts = new Map<string, number>();
    const categoryCounts = new Map<string, number>();
    const statusCounts = new Map<string, number>();
    const priorityCounts = new Map<string, number>();
    const dayCounts = new Map<string, number>();
    const storeCatCounts = new Map<string, number>();

    tickets.forEach((t) => {
      if (t.store_id) storeCounts.set(t.store_id, (storeCounts.get(t.store_id) || 0) + 1);
      if (t.category) categoryCounts.set(t.category, (categoryCounts.get(t.category) || 0) + 1);
      if (t.status) statusCounts.set(t.status, (statusCounts.get(t.status) || 0) + 1);
      if (t.priority) priorityCounts.set(t.priority, (priorityCounts.get(t.priority) || 0) + 1);
      const day = t.created_at ? new Date(t.created_at).toISOString().slice(0, 10) : "bilinmiyor";
      dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
      if (t.store_id && t.category) {
        const key = `${t.store_id}||${t.category}`;
        storeCatCounts.set(key, (storeCatCounts.get(key) || 0) + 1);
      }
    });

    const topStores = [...storeCounts.entries()].sort((a, b) => b[1] - a[1]);
    const topCategories = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1]);
    const timeline = [...dayCounts.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
    const storeCatRows = [...storeCatCounts.entries()]
      .map(([k, count]) => { const [store_id, category] = k.split("||"); return { store_id, category, count }; })
      .sort((a, b) => b.count - a.count);

    const wb = new ExcelJS.Workbook();
    wb.creator = "HYS Köroğlu Arıza Kayıtları";
    wb.created = new Date();
    wb.modified = new Date();

    // SHEET 1 – Özet
    const wsOzet = wb.addWorksheet("Özet", { properties: { tabColor: { argb: "FF1F4B99" } } });
    wsOzet.properties.defaultRowHeight = 22;
    wsOzet.columns = [
      { header: "", key: "label", width: 32 },
      { header: "", key: "value", width: 22 },
    ];

    wsOzet.mergeCells("A1:B1");
    const titleCell = wsOzet.getCell("A1");
    titleCell.value = "HYS Köroğlu – Arıza Kayıtları Özet Raporu";
    titleCell.style = {
      font: { bold: true, size: 14, color: { argb: C.headerFg } },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: C.headerBg } },
      alignment: { vertical: "middle", horizontal: "center" },
    };
    wsOzet.getRow(1).height = 34;

    wsOzet.mergeCells("A2:B2");
    const dateCell = wsOzet.getCell("A2");
    dateCell.value = `Oluşturma tarihi: ${new Date().toLocaleString("tr-TR")}`;
    dateCell.style = {
      font: { size: 10, color: { argb: C.textDim }, italic: true },
      fill: { type: "pattern", pattern: "solid", fgColor: { argb: C.rowBase } },
      alignment: { horizontal: "center" },
    };

    const kpis: [string, number | string][] = [
      ["Toplam Ticket", tickets.length],
      ["Aktif (Açık)", statusCounts.get("OPEN") || 0],
      ["Devam Eden", statusCounts.get("IN_PROGRESS") || 0],
      ["Mağaza Beklemede", statusCounts.get("WAITING_STORE") || 0],
      ["Çözüldü", statusCounts.get("RESOLVED") || 0],
      ["Kapalı", statusCounts.get("CLOSED") || 0],
      ["", ""],
      ["P1 Kritik", priorityCounts.get("P1") || 0],
      ["P2 Yüksek", priorityCounts.get("P2") || 0],
      ["P3 Normal", priorityCounts.get("P3") || 0],
      ["", ""],
      ["Benzersiz Mağaza", storeCounts.size],
      ["Benzersiz Kategori", categoryCounts.size],
    ];

    kpis.forEach(([label, value], i) => {
      const row = wsOzet.addRow([label, value]);
      const isBlank = label === "";
      row.height = isBlank ? 6 : 22;
      const lc = row.getCell(1);
      const vc = row.getCell(2);
      if (!isBlank) {
        lc.style = { font: { color: { argb: C.textMain }, size: 11 }, fill: { type: "pattern", pattern: "solid", fgColor: { argb: i % 2 ? C.rowAlt : C.rowBase } }, alignment: { vertical: "middle" } };
        vc.style = { font: { color: { argb: C.accent }, bold: true, size: 13 }, fill: { type: "pattern", pattern: "solid", fgColor: { argb: i % 2 ? C.rowAlt : C.rowBase } }, alignment: { vertical: "middle", horizontal: "center" } };
      }
    });

    // SHEET 2 – Mağaza Raporu
    const wsMag = wb.addWorksheet("Mağaza Raporu", { properties: { tabColor: { argb: "FF1AC6FF" } } });
    applySheetDefaults(wsMag);
    wsMag.columns = [
      { header: "Sıra", key: "rank", width: 8 },
      { header: "Mağaza ID", key: "store", width: 16 },
      { header: "Ticket Sayısı", key: "count", width: 18 },
      { header: "Oran (%)", key: "pct", width: 14 },
    ];
    wsMag.getRow(1).eachCell((cell) => { cell.style = headerStyle(); });
    wsMag.getRow(1).height = 22;

    topStores.forEach(([store_id, count], idx) => {
      const pct = tickets.length > 0 ? +((count / tickets.length) * 100).toFixed(1) : 0;
      const row = wsMag.addRow({ rank: idx + 1, store: store_id, count, pct: pct / 100 });
      const alt = idx % 2 === 1;
      row.getCell("rank").style = { ...cellStyle(alt), alignment: { horizontal: "center", vertical: "middle" }, font: { color: { argb: C.textDim }, size: 10 } };
      row.getCell("store").style = { ...cellStyle(alt), font: { color: { argb: C.textMain }, bold: idx < 3, size: 10 } };
      row.getCell("count").style = numStyle(alt);
      row.getCell("pct").style = { ...numStyle(alt), font: { color: { argb: C.textDim }, size: 10 } };
      row.getCell("pct").numFmt = "0.0%";
      row.height = 18;
    });

    // SHEET 3 – Kategori Raporu
    const wsCat = wb.addWorksheet("Kategori Raporu", { properties: { tabColor: { argb: "FF22C55E" } } });
    applySheetDefaults(wsCat);
    wsCat.columns = [
      { header: "Sıra", key: "rank", width: 8 },
      { header: "Kategori", key: "category", width: 24 },
      { header: "Ticket Sayısı", key: "count", width: 18 },
      { header: "Oran (%)", key: "pct", width: 14 },
    ];
    wsCat.getRow(1).eachCell((cell) => { cell.style = headerStyle(); });
    wsCat.getRow(1).height = 22;

    topCategories.forEach(([category, count], idx) => {
      const pct = tickets.length > 0 ? +((count / tickets.length) * 100).toFixed(1) : 0;
      const row = wsCat.addRow({ rank: idx + 1, category: CATEGORY_LABELS[category] ?? category, count, pct: pct / 100 });
      const alt = idx % 2 === 1;
      row.getCell("rank").style = { ...cellStyle(alt), alignment: { horizontal: "center", vertical: "middle" }, font: { color: { argb: C.textDim }, size: 10 } };
      row.getCell("category").style = { ...cellStyle(alt), font: { color: { argb: C.textMain }, bold: idx < 3, size: 10 } };
      row.getCell("count").style = numStyle(alt);
      row.getCell("pct").style = { ...cellStyle(alt), alignment: { horizontal: "center", vertical: "middle" }, font: { color: { argb: C.textDim }, size: 10 } };
      row.getCell("pct").numFmt = "0.0%";
      row.height = 18;
    });

    // SHEET 4 – Günlük Timeline
    const wsTl = wb.addWorksheet("Günlük Timeline", { properties: { tabColor: { argb: "FFA855F7" } } });
    applySheetDefaults(wsTl);
    wsTl.columns = [
      { header: "Tarih", key: "day", width: 16 },
      { header: "Ticket Sayısı", key: "count", width: 18 },
    ];
    wsTl.getRow(1).eachCell((cell) => { cell.style = headerStyle(); });
    wsTl.getRow(1).height = 22;

    timeline.forEach(([day, count], idx) => {
      const row = wsTl.addRow({ day, count });
      const alt = idx % 2 === 1;
      row.getCell("day").style = cellStyle(alt);
      row.getCell("count").style = numStyle(alt);
      row.height = 18;
    });

    // SHEET 5 – Store × Kategori
    const wsSC = wb.addWorksheet("Store x Kategori", { properties: { tabColor: { argb: "FFF59E0B" } } });
    applySheetDefaults(wsSC);
    wsSC.columns = [
      { header: "Mağaza", key: "store", width: 16 },
      { header: "Kategori", key: "category", width: 24 },
      { header: "Ticket Sayısı", key: "count", width: 18 },
    ];
    wsSC.getRow(1).eachCell((cell) => { cell.style = headerStyle(); });
    wsSC.getRow(1).height = 22;

    storeCatRows.forEach(({ store_id, category, count }, idx) => {
      const row = wsSC.addRow({ store: store_id, category: CATEGORY_LABELS[category] ?? category, count });
      const alt = idx % 2 === 1;
      row.getCell("store").style = cellStyle(alt);
      row.getCell("category").style = cellStyle(alt);
      row.getCell("count").style = numStyle(alt);
      row.height = 18;
    });

    // SHEET 6 – Tüm Ticketlar
    const wsAll = wb.addWorksheet("Tüm Ticketlar", { properties: { tabColor: { argb: "FF64748B" } } });
    applySheetDefaults(wsAll);
    wsAll.columns = [
      { header: "Ticket ID", key: "id", width: 38 },
      { header: "Mağaza", key: "store", width: 14 },
      { header: "Başlık", key: "title", width: 38 },
      { header: "Kategori", key: "category", width: 22 },
      { header: "Etki", key: "impact", width: 16 },
      { header: "Öncelik", key: "priority", width: 12 },
      { header: "Durum", key: "status", width: 20 },
      { header: "Oluşturma", key: "created", width: 22 },
    ];
    wsAll.getRow(1).eachCell((cell) => { cell.style = headerStyle(); });
    wsAll.getRow(1).height = 22;
    wsAll.autoFilter = "A1:H1";

    tickets.forEach((t, idx) => {
      const alt = idx % 2 === 1;
      const row = wsAll.addRow({
        id: t.id,
        store: t.store_id,
        title: t.title,
        category: CATEGORY_LABELS[t.category] ?? t.category,
        impact: IMPACT_LABELS[t.impact] ?? t.impact,
        priority: t.priority,
        status: STATUS_LABELS[t.status] ?? t.status,
        created: t.created_at ? new Date(t.created_at).toLocaleString("tr-TR") : "",
      });

      const base = cellStyle(alt);
      ["id", "store", "title", "category", "impact", "created"].forEach((k) => {
        row.getCell(k).style = base;
      });

      const pc = row.getCell("priority");
      if (t.priority === "P1") pc.style = { fill: { type: "pattern", pattern: "solid", fgColor: { argb: C.p1Bg } }, font: { color: { argb: C.p1Fg }, bold: true, size: 10 }, alignment: { horizontal: "center", vertical: "middle" } };
      else if (t.priority === "P2") pc.style = { fill: { type: "pattern", pattern: "solid", fgColor: { argb: C.p2Bg } }, font: { color: { argb: C.p2Fg }, bold: true, size: 10 }, alignment: { horizontal: "center", vertical: "middle" } };
      else pc.style = { fill: { type: "pattern", pattern: "solid", fgColor: { argb: C.p3Bg } }, font: { color: { argb: C.p3Fg }, size: 10 }, alignment: { horizontal: "center", vertical: "middle" } };

      const sc = row.getCell("status");
      if (t.status === "RESOLVED" || t.status === "CLOSED") sc.style = { fill: { type: "pattern", pattern: "solid", fgColor: { argb: C.greenBg } }, font: { color: { argb: C.greenFg }, size: 10 }, alignment: { vertical: "middle" } };
      else if (t.status === "OPEN") sc.style = { fill: { type: "pattern", pattern: "solid", fgColor: { argb: C.redBg } }, font: { color: { argb: C.redFg }, size: 10 }, alignment: { vertical: "middle" } };
      else sc.style = base;

      row.height = 17;
    });

    const buffer = await wb.xlsx.writeBuffer();
    const fileName = `hys-rapor-${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
