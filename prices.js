async function loadCoffeePrices(){
 const fmt=n=>n===null||n===undefined||n===""?"Chưa cập nhật":new Intl.NumberFormat("vi-VN").format(n);
 const change=n=>n===null||n===undefined||n===""?"—":(n>0?"▲ ":n<0?"▼ ":"")+new Intl.NumberFormat("vi-VN").format(Math.abs(n))+" đ";
 const row=(cells)=>`<tr>${cells.map(x=>`<td>${x}</td>`).join("")}</tr>`;
 try{
  const response=await fetch("prices.json",{cache:"no-store"}); if(!response.ok) throw new Error("Không đọc được prices.json");
  const data=await response.json();
  document.getElementById("price-updated").textContent=data.updatedAt?`Cập nhật lần cuối: ${data.updatedAt}`:"Bảng giá chưa có dữ liệu cập nhật. HTX sẽ bổ sung khi có thông tin xác nhận.";
  document.getElementById("market-prices").innerHTML=(data.market?.rows||[]).map(r=>row([r.area, r.price==null?"Chưa cập nhật":fmt(r.price),change(r.change)])).join("")||row(["Chưa có dữ liệu","—","—"]);
  document.getElementById("coop-prices").innerHTML=(data.coop?.rows||[]).map(r=>row([r.product,r.price==null?"Chưa công bố":fmt(r.price),r.note||"—"])).join("")||row(["Chưa có dữ liệu","—","—"]);
  document.getElementById("market-source").textContent=data.market?.sourceName?`Nguồn: ${data.market.sourceName}${data.market.sourceUrl?" · "+data.market.sourceUrl:""}`:"Nguồn giá thị trường chưa được khai báo.";
  document.getElementById("coop-note").textContent=data.coop?.note||"Giá thu mua do HTX Ea Kiết công bố.";
  const history=document.getElementById("price-history");
  if(data.history?.length){history.innerHTML=`<div class="price-history-list">${data.history.map(h=>`<div class="price-history-row"><strong>${h.date||""}</strong><span>${h.market||"Thị trường: —"}</span><span>${h.coop||"HTX: —"}</span></div>`).join("")}</div>`;}
 }catch(error){document.getElementById("price-updated").textContent="Chưa thể tải dữ liệu giá. Vui lòng thử tải lại trang.";document.getElementById("market-prices").innerHTML=row(["Không tải được dữ liệu","—","—"]);document.getElementById("coop-prices").innerHTML=row(["Không tải được dữ liệu","—","—"]);}
}
loadCoffeePrices();