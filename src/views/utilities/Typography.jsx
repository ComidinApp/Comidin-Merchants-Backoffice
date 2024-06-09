// material-ui
import Grid from '@mui/material/Grid';


// project imports
import MainCard from 'ui-component/cards/MainCard';
import { gridSpacing } from 'store/constant';
import OrderTable from '../../ui-component/tables/OrderTable';

// ==============================|| Historial de Ordenes ||============================== //

const orderHistoryTable = () => (
  <MainCard title="Historial de Ordenes">
    <Grid container spacing={gridSpacing}>
      
      <Grid item xs={12}>
        <OrderTable />
      </Grid>
    </Grid>
  </MainCard>
);

export default orderHistoryTable;
