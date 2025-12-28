// src/sections/overview/period-selector.jsx
import PropTypes from 'prop-types';

import { ToggleButton, ToggleButtonGroup } from '@mui/material';

const OPTIONS = [
  { value: 'last1m', label: 'Último mes' },
  { value: 'last3m', label: 'Últimos 3 meses' },
  { value: 'last6m', label: 'Últimos 6 meses' },
  { value: 'last12m', label: 'Últimos 12 meses' },
   { value: 'all',    label: 'Histórico' },
];

export default function PeriodSelector({ value, onChange }) {
  return (
    <ToggleButtonGroup
      color="primary"
      exclusive
      size="small"
      value={value}
      onChange={(_, v) => v && onChange(v)}
      sx={{ mb: 2, flexWrap: 'wrap' }}
    >
      {OPTIONS.map((opt) => (
        <ToggleButton key={opt.value} value={opt.value}>
          {opt.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

PeriodSelector.propTypes = {
  value: PropTypes.oneOf(['last1m', 'last3m', 'last6m', 'last12m', 'all']).isRequired,
  onChange: PropTypes.func.isRequired,
};
