const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ_5-GQo8jVTEmSeu1xkQa6fPFR4XaCM9Ya9Etujpdl_g2s5Zs43oiIhQ50slp_8_Q-P6b83_4Ud9dZ/pub?gid=428839399&single=true&output=csv';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

const SKIP_NAMES = ['lender lady','jpal mortgage','mota mortgage','hermiz lending',
  'kingdom processing','bright processing','client name'];

function parseCSV(text) {
  const rows = [];
  for (const line of text.trim().split('\n')) {
    const cells = []; let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { cells.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
    cells.push(cur.trim());
    rows.push(cells);
  }
  return rows;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };

  try {
    const res = await fetch(SHEET_URL);
    if (!res.ok) throw new Error('Sheet fetch failed: ' + res.status);
    const text = await res.text();
    const rows = parseCSV(text);

    // Row index 2 = headers (row 3 in spreadsheet)
    // Columns: 0=Client Name, 1=Status, 2=F/U Date, 3=MLO, 4=Lender,
    //          5=Disclose, 6=Close, 7=Lock, 8=Submit, 9=Appl Order,
    //          10=Appl In, 11=Title Order, 12=Title In, 13=HOI Order,
    //          14=HOI In, 15=Condo/Payoff, 16=CD Sent, 17=CD Sign,
    //          18=VVOE, 19=Purchase or Refi, 20=Loan Type

    const files = [];
    for (let i = 3; i < rows.length; i++) {
      const r = rows[i];
      const name   = (r[0] || '').trim();
      const status = (r[1] || '').trim();
      if (!name || !status) continue;
      if (SKIP_NAMES.some(s => name.toLowerCase().includes(s))) continue;

      files.push({
        id:      'kb_' + i,
        name,
        status,
        fuDate:  r[2]  || null,
        mlo:     r[3]  || '',
        lender:  r[4]  || '',
        disclose:r[5]  || null,
        closing: r[6]  || null,
        lock:    r[7]  || null,
        submit:  r[8]  || null,
        applOrder: r[9]  || null,
        applIn:    r[10] || null,
        titleOrder:r[11] || null,
        titleIn:   r[12] || null,
        hoiOrder:  r[13] || null,
        hoiIn:     r[14] || null,
        condo:     r[15] || '',
        cdSent:    r[16] || null,
        cdSign:    r[17] || null,
        vvoe:      r[18] || '',
        purpose:   r[19] || '',
        type:      r[20] || '',
      });
    }

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ files }) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
