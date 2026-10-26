/* Snapshot → PDF for Zotero
 * Adds "快照转PDF" to the item context menu and converts the selected items'
 * webpage snapshots (HTML) into PDF attachments via headless Edge.
 */
var Snapshot2PDF = {
  id: null,
  version: null,
  rootURI: null,
  menuID: "snapshot2pdf-item-menu",

  log(msg) {
    try { Zotero.debug("[snapshot2pdf] " + msg); } catch (e) {}
  },

  /* ---------- lifecycle ---------- */

  startup({ id, version, rootURI }) {
    this.id = id;
    this.version = version;
    this.rootURI = rootURI;
    this.log("starting " + version);
    try {
      for (const win of Zotero.getMainWindows()) {
        this.addMenu(win);
      }
    } catch (e) {
      this.log("startup error: " + e);
    }
  },

  shutdown() {
    try {
      for (const win of Zotero.getMainWindows()) {
        this.removeMenu(win);
      }
    } catch (e) {}
    this.log("shutdown");
  },

  install() {},
  uninstall() {},

  onMainWindowLoad({ window }) {
    this.addMenu(window);
  },

  onMainWindowUnload({ window }) {
    this.removeMenu(window);
  },

  /* ---------- menu ---------- */

  addMenu(win) {
    try {
      const doc = win.document;
      const menu = doc.getElementById("zotero-itemmenu");
      if (!menu || doc.getElementById(this.menuID)) return;
      const mi = doc.createXULElement("menuitem");
      mi.id = this.menuID;
      mi.setAttribute("label", "快照转PDF");
      mi.addEventListener("command", () => {
        this.convertSelection(win).catch((e) => this.alert(win, "快照转PDF 出错：" + e));
      });
      menu.appendChild(mi);
    } catch (e) {
      this.log("addMenu error: " + e);
    }
  },

  removeMenu(win) {
    try {
      const el = win.document.getElementById(this.menuID);
      if (el) el.remove();
    } catch (e) {}
  },

  /* ---------- conversion ---------- */

  findEdge() {
    const candidates = [
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
      "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    ];
    for (const p of candidates) {
      try {
        if (Zotero.File.pathToFile(p).exists()) return p;
      } catch (e) {}
    }
    return null;
  },

  async fileExists(path) {
    try { return Zotero.File.pathToFile(path).exists(); } catch (e) {}
    try { return await IOUtils.exists(path); } catch (e) {}
    return false;
  },

  async convertSelection(win) {
    const pane = win.ZoteroPane || Zotero.getActiveZoteroPane();
    const selected = pane ? pane.getSelectedItems() : [];

    const targets = [];
    for (const x of selected) {
      let p = x;
      try { if (x.isAttachment && x.isAttachment()) p = x.parentItem; } catch (e) {}
      if (p && p.isRegularItem && p.isRegularItem() && !targets.includes(p)) targets.push(p);
    }
    if (!targets.length) {
      this.alert(win, "请先选择条目（不是附件，也不是空白处）。");
      return;
    }

    const edge = this.findEdge();
    if (!edge) {
      this.alert(win, "没有找到 Edge/Chrome，无法把网页快照渲染成 PDF。");
      return;
    }

    const tmp = Zotero.getTempDirectory().path;
    let ok = 0, hasPdf = 0, noSnap = 0, fail = 0;

    for (const item of targets) {
      try {
        const atts = item.getAttachments()
          .map((id) => Zotero.Items.get(id))
          .filter(Boolean);
        if (atts.some((a) => a.attachmentContentType === "application/pdf")) { hasPdf++; continue; }
        const snap = atts.find((a) => a.attachmentContentType === "text/html");
        if (!snap) { noSnap++; continue; }
        const src = snap.getFilePath();
        if (!src || !(await this.fileExists(src))) { noSnap++; continue; }

        const out = tmp + "\\snapshot2pdf-" + item.key + ".pdf";
        const url = "file:///" + encodeURI(src.replace(/\\/g, "/"));
        await Zotero.Utilities.Internal.exec(edge, [
          "--headless=new",
          "--no-sandbox",
          "--disable-gpu",
          "--no-pdf-header-footer",
          "--user-data-dir=" + tmp + "\\snapshot2pdf-profile-" + item.key,
          "--print-to-pdf=" + out,
          url,
        ]);
        await Zotero.Promise.delay(1000);

        if (!(await this.fileExists(out))) { fail++; continue; }
        await Zotero.Attachments.importFromFile({ file: out, parentItemID: item.id });
        try { Zotero.File.pathToFile(out).remove(false); } catch (e) {}
        ok++;
      } catch (e) {
        this.log("convert error on " + item.key + ": " + e);
        fail++;
      }
    }

    this.toast("快照转PDF：成功 " + ok + "｜已有PDF " + hasPdf + "｜无快照 " + noSnap + "｜失败 " + fail);
  },

  /* ---------- ui helpers ---------- */

  toast(text) {
    try {
      const pw = new Zotero.ProgressWindow({ closeOnClick: true });
      pw.changeHeadline("快照转PDF");
      pw.addDescription(text);
      pw.show();
      pw.startCloseTimer(8000);
    } catch (e) {
      try { Zotero.getMainWindow().alert(text); } catch (e2) {}
    }
  },

  alert(win, text) {
    try { (win || Zotero.getMainWindow()).alert(text); } catch (e) {}
  },
};

/* ---------- Zotero bootstrap entry points ----------
 * Zotero loads this file as the plugin's bootstrap scope and calls these
 * top-level functions. They must be globals, not methods of Snapshot2PDF.
 */
function install(data, reason) { Snapshot2PDF.install(data, reason); }
function uninstall(data, reason) { Snapshot2PDF.uninstall(data, reason); }
function startup(data, reason) { Snapshot2PDF.startup(data, reason); }
function shutdown(data, reason) { Snapshot2PDF.shutdown(data, reason); }
function onMainWindowLoad(data) { Snapshot2PDF.onMainWindowLoad(data); }
function onMainWindowUnload(data) { Snapshot2PDF.onMainWindowUnload(data); }
