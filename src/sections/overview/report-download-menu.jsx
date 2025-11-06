// src/sections/overview/report-download-menu.jsx
import { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Menu, MenuItem } from '@mui/material';
import { downloadFile } from 'src/utils/download';
import { API_BASE } from 'src/config-apis';

export default function ReportDownloadMenu({ period, commerceId, token }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handle = (f) => async () => {
    setAnchorEl(null);
    try {
      await f();
    } catch (e) {
      console.error(e);
      alert('No se pudo descargar.');
    }
  };

  // 👉 Ahora usa la base absoluta de API (api.comidin.com.ar)
  const base = `${API_BASE}/api/analytics/report`;
  const q = `period=${encodeURIComponent(period)}&commerceId=${encodeURIComponent(
    commerceId
  )}&status=all`;

  return (
    <>
      <Button variant="outlined" onClick={(e) => setAnchorEl(e.currentTarget)}>
        Descargar reporte
      </Button>
      <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
        <MenuItem
          onClick={handle(() =>
            downloadFile(`${base}/executive?${q}`, `informe-ejecutivo-${period}.pdf`, token)
          )}
        >
          PDF Ejecutivo
        </MenuItem>
        <MenuItem
          onClick={handle(() =>
            downloadFile(`${base}/export?${q}`, `ordenes-${period}.xlsx`, token)
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
  token: PropTypes.string,
};
