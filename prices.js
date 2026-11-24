async function loadCoffeePrices() {
  const fmt = (value) => {
    if (value === null || value === undefined || value === "") return "Chưa cập nhật";
    const number = Number(value);
    return Number.isFinite(number) ? new Intl.NumberFormat("vi-VN").format(number) : "Chưa cập nhật";
  };

  const change = (value) => {
    if (value === null || value === undefined || value === "") return "—";
    const number = Number(value);
    if (!Number.isFinite(number)) return "—";
    const prefix = number > 0 ? "▲ " : number < 0 ? "▼ " : "";
    return `${prefix}${new Intl.NumberFormat("vi-VN").format(Math.abs(number))} đ`;
  };

  const setCell = (row, value) => {
    const cell = document.createElement("td");
    cell.textContent = value === null || value === undefined || value === "" ? "—" : String(value);
    row.appendChild(cell);
  };

  const renderRows = (tbody, rows, columns, emptyMessage) => {
    if (!tbody) return;
    tbody.replaceChildren();
    if (!Array.isArray(rows) || rows.length === 0) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = columns;
      cell.textContent = emptyMessage;
      row.appendChild(cell);
      tbody.appendChild(row);
      return;
    }
    rows.forEach((values) => {
      const row = document.createElement("tr");
      values.forEach((value) => setCell(row, value));
      tbody.appendChild(row);
    });
  };

  try {
    const response = await fetch("prices.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Không đọc được prices.json");
    const data = await response.json();

    const updated = document.getElementById("price-updated");
    if (updated) {
      updated.textContent = data.updatedAt
        ? `Cập nhật lần cuối: ${data.updatedAt}`
        : "Bảng giá chưa có dữ liệu cập nhật. HTX sẽ bổ sung khi có thông tin xác nhận.";
    }

    const marketRows = Array.isArray(data.market?.rows) ? data.market.rows : [];
    renderRows(
      document.getElementById("market-prices"),
      marketRows.map((item) => [
        item.area || "—",
        item.price === null || item.price === undefined ? "Chưa cập nhật" : fmt(item.price),
        change(item.change)
      ]),
      3,
      "Chưa có dữ liệu"
    );

    const coopRows = Array.isArray(data.coop?.rows) ? data.coop.rows : [];
    renderRows(
      document.getElementById("coop-prices"),
      coopRows.map((item) => [
        item.product || "—",
        item.price === null || item.price === undefined ? "Chưa công bố" : fmt(item.price),
        item.note || "—"
      ]),
      3,
      "Chưa có dữ liệu"
    );

    const marketSource = document.getElementById("market-source");
    if (marketSource) {
      const sourceName = data.market?.sourceName || "Nguồn giá thị trường chưa được khai báo.";
      marketSource.textContent = data.market?.sourceUrl
        ? `Nguồn: ${sourceName} · ${data.market.sourceUrl}`
        : sourceName.startsWith("Nguồn giá") ? sourceName : `Nguồn: ${sourceName}`;
    }

    const coopNote = document.getElementById("coop-note");
    if (coopNote) coopNote.textContent = data.coop?.note || "Giá thu mua do HTX Ea Kiết công bố.";

    const history = document.getElementById("price-history");
    if (history && Array.isArray(data.history) && data.history.length) {
      const list = document.createElement("div");
      list.className = "price-history-list";
      data.history.forEach((item) => {
        const row = document.createElement("div");
        row.className = "price-history-row";
        const date = document.createElement("strong");
        date.textContent = String(item.date || "");
        const market = document.createElement("span");
        market.textContent = String(item.market || "Thị trường: —");
        const coop = document.createElement("span");
        coop.textContent = String(item.coop || "HTX: —");
        row.append(date, market, coop);
        list.appendChild(row);
      });
      history.replaceChildren(list);
    }
  } catch (error) {
    const updated = document.getElementById("price-updated");
    if (updated) updated.textContent = "Chưa thể tải dữ liệu giá. Vui lòng thử tải lại trang.";
    renderRows(document.getElementById("market-prices"), [], 3, "Không tải được dữ liệu");
    renderRows(document.getElementById("coop-prices"), [], 3, "Không tải được dữ liệu");
  }
}

loadCoffeePrices();
