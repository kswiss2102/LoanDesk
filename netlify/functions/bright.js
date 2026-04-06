const TOKEN = process.env.BRIGHT_TOKEN;
const BASE  = 'apphrn4Tz1J89C31s';
const TABLE = 'tblJa6GosXcsXa92g';
const KEITH = 'recVwl7OszXmnHpJC';

const ACTIVE = ['selHL4ReCq0YOIVOT','selOu3fyA4Zcjmmwa','selIrEKyrPIPZaBiD',
  'sel7NSBnXHqzldJFA','selM3s7YzvK5h45uA','selqgwSAwLhaQc20u',
  'selyTbVfoL5Tao1Z3','sel5Qc3jlufpnGTkz'];

const FIELDS = ['fldsM1JvKXqIR22uh','fld97xoWVIcPh6UQY','fldN7OqDZr22srr8y',
  'fldGID29pVG9dcmjf','fldSdAJtRC367V3Et','fldwBXREqaqVlprye','fldMvpSa0XVyjnwwK',
  'fldXFlPVTbCMguNuH','fldnMNOqvab0aHNaM','fld9yUCl4EPPuyQbv',
  'fldNIVDqxwz4rQZxN','flduhCXMUX5BdHIHQ','fld29spBDZMn47RZ9'];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (!TOKEN) return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'BRIGHT_TOKEN not set' }) };

  try {
    let records = [], offset = null;
    do {
      let url = `https://api.airtable.com/v0/${BASE}/${TABLE}?pageSize=100&fields[]=${FIELDS.join('&fields[]=')}`;
      if (offset) url += '&offset=' + encodeURIComponent(offset);
      const r = await fetch(url, { headers: { Authorization: 'Bearer ' + TOKEN } });
      const d = await r.json();
      if (d.error) return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: d.error.message }) };
      for (const rec of (d.records || [])) {
        const f = rec.cellValuesByFieldId || {};
        const proc = f['fldXFlPVTbCMguNuH'];
        if (!(proc?.linkedRecordIds || []).includes(KEITH)) continue;
        if (!ACTIVE.includes(f['fld97xoWVIcPh6UQY']?.id)) continue;
        const lock = f['fldnMNOqvab0aHNaM'];
        records.push({
          id: rec.id,
          name:    f['fldsM1JvKXqIR22uh'] || '—',
          status:  (f['fld97xoWVIcPh6UQY']?.name || '').toUpperCase(),
          closing: f['fldN7OqDZr22srr8y'] || null,
          lock:    lock ? lock.substring(0,10) : null,
          amount:  f['fldGID29pVG9dcmjf'] || 0,
          type:    f['fldSdAJtRC367V3Et'] || '',
          lender:  f['fldwBXREqaqVlprye'] || '',
          purpose: f['fldMvpSa0XVyjnwwK']?.name || '',
          address: f['fld9yUCl4EPPuyQbv'] || '',
          email:   f['fldNIVDqxwz4rQZxN'] || '',
          loanId:  f['flduhCXMUX5BdHIHQ'] || '',
          days:    f['fld29spBDZMn47RZ9'] ?? null,
        });
      }
      offset = d.offset || null;
    } while (offset);
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ records }) };
  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
