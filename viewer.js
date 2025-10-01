// ---------- Utility functions ----------
function makeBitCells(fields) {
  const cells = new Array(32).fill("");
  fields.forEach(f => {
    const name = f.getElementsByTagName("name")[0].textContent;
    const offset = parseInt(f.getElementsByTagName("bitOffset")[0].textContent);
    const width = parseInt(f.getElementsByTagName("bitWidth")[0].textContent);
    for (let i = 0; i < width; i++) {
      cells[offset + i] = name;
    }
  });
  return cells.reverse(); // show 31..0 left → right
}

function buildTableForRegister(reg) {
  const table = document.createElement("table");
  table.style.borderCollapse = "collapse";
  table.style.fontFamily = "monospace";

  const header = document.createElement("tr");
  header.innerHTML = "<th>Offset</th><th>Register</th>" +
    Array.from({ length: 32 }, (_, i) => `<th>${31 - i}</th>`).join("");
  table.appendChild(header);

  const offset = reg.getElementsByTagName("addressOffset")[0]?.textContent || "";
  const name = reg.getElementsByTagName("name")[0]?.textContent || "";
  const fields = reg.getElementsByTagName("field");
  const bits = makeBitCells(Array.from(fields));

  const row = document.createElement("tr");
  row.innerHTML = `<td>${offset}</td><td>${name}</td>` +
    bits.map(b => `<td style="border:1px solid black;padding:2px">${b}</td>`).join("");
  table.appendChild(row);

  return table;
}

function buildPeripheralTable(periph) {
  const table = document.createElement("table");
  table.style.borderCollapse = "collapse";
  table.style.fontFamily = "monospace";

  const header = document.createElement("tr");
  header.innerHTML = "<th>Offset</th><th>Register</th>" +
    Array.from({ length: 32 }, (_, i) => `<th>${31 - i}</th>`).join("");
  table.appendChild(header);

  const regs = periph.getElementsByTagName("register");
  for (let reg of regs) {
    table.appendChild(buildTableForRegister(reg).rows[1]); // reuse logic
  }
  return table;
}

// ---------- Rendering ----------
function renderPeripherals(xmlDoc) {
  const peripherals = xmlDoc.getElementsByTagName("peripheral");

  document.querySelectorAll(".peripheral-view").forEach(div => {
    const targetName = div.dataset.peripheralName;
    const periph = Array.from(peripherals).find(
      p => p.getElementsByTagName("name")[0]?.textContent === targetName
    );
    div.innerHTML = "";
    if (periph) {
      const title = document.createElement("div");
      title.textContent = `Peripheral: ${targetName}`;
      title.style.fontWeight = "bold";
      div.appendChild(title);
      div.appendChild(buildPeripheralTable(periph));
    } else {
      div.textContent = `Peripheral '${targetName}' not found.`;
    }
  });
}

function renderRegisterViews(xmlDoc) {
  const peripherals = xmlDoc.getElementsByTagName("peripheral");

  document.querySelectorAll(".register-view").forEach(div => {
    const pName = div.dataset.peripheralName;
    const rName = div.dataset.registerName;
    const periph = Array.from(peripherals).find(
      p => p.getElementsByTagName("name")[0]?.textContent === pName
    );
    div.innerHTML = "";
    if (!periph) {
      div.textContent = `Peripheral '${pName}' not found.`;
      return;
    }
    const registers = periph.getElementsByTagName("register");
    const reg = Array.from(registers).find(
      r => r.getElementsByTagName("name")[0]?.textContent === rName
    );
    if (!reg) {
      div.textContent = `Register '${rName}' not found in ${pName}.`;
      return;
    }
    const title = document.createElement("div");
    // title.textContent = `${pName}.${rName}`;
    title.style.fontWeight = "bold";
    div.appendChild(title);
    div.appendChild(buildTableForRegister(reg));
  });
}

// ---------- Load SVD dynamically ----------
fetch("ch32v30x.svd")
  .then(resp => resp.text())
  .then(text => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text.trimStart(), "application/xml");
    renderPeripherals(xmlDoc);
    renderRegisterViews(xmlDoc);
  })
  .catch(err => {
    console.error("Failed to load SVD:", err);
  });
