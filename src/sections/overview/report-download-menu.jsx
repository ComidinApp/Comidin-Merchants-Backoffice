// src/sections/overview/report-download-menu.jsx
import { useState } from 'react';
import PropTypes from 'prop-types';

import { Menu, Button, MenuItem } from '@mui/material';

import { downloadFile } from 'src/utils/download';

import { API_BASE } from 'src/config-global';

export default function ReportDownloadMenu({ period, commerceId, startDate, endDate }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handle = (f) => async () => {
    setAnchorEl(null);
    try {
      await f();
    } catch (e) {
      console.error(e);
      alert('No se pudo descargar el archivo.');
    }
  };

  const base = `${API_BASE}/api/analytics/report`;

  // ✅ Params base
  const params = new URLSearchParams({
    period: String(period),
    commerceId: String(commerceId),
    status: 'all',
  });

  // ✅ Si es custom, mandamos rango (día completo lo resuelve el back)
  if (String(period).toLowerCase() === 'custom') {
    if (startDate) params.set('startDate', String(startDate));
    if (endDate) params.set('endDate', String(endDate));
  }

  const q = params.toString();

  // ✅ nombres de archivo lindos para custom
  const suffix =
    String(period).toLowerCase() === 'custom' && startDate && endDate
      ? `${startDate}_a_${endDate}`
      : String(period);

  return (
    <>
      <Button variant="outlined" onClick={(e) => setAnchorEl(e.currentTarget)}>
        Descargar reporte
      </Button>

      <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
        <MenuItem
          onClick={handle(() =>
            downloadFile(`${base}/executive?${q}`, `informe-ejecutivo-${suffix}.pdf`)
          )}
        >
          PDF Ejecutivo
        </MenuItem>

        <MenuItem
          onClick={handle(() =>
            downloadFile(`${base}/export?${q}`, `ordenes-${suffix}.xlsx`)
          )}
        >
          Excel (Exportación completa)
        </MenuItem>
      </Menu>
    </>
  );
}

ReportDownloadMenu.propTypes = {
  period: PropTypes.string.isRequired,
  commerceId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,

  // ✅ Opcionales: solo necesarios cuando period = "custom"
  startDate: PropTypes.string,
  endDate: PropTypes.string,
};

ReportDownloadMenu.defaultProps = {
  startDate: '',
  endDate: '',
};
