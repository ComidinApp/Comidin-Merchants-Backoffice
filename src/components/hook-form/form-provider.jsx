import PropTypes from 'prop-types';
import { FormProvider as RHFormProvider } from 'react-hook-form';

// ----------------------------------------------------------------------


export default function FormProvider({ methods, onSubmit, children, ...other }) {
  return (
    <RHFormProvider {...methods}>
      <form
        onSubmit={onSubmit}
        autoComplete="off"       
        {...other}
      >
        {children}
      </form>
    </RHFormProvider>
  );
}
FormProvider.propTypes = {
  children: PropTypes.node,
  methods: PropTypes.object,
  onSubmit: PropTypes.func,
};
