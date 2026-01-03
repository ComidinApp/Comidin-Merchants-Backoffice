import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useMemo, useEffect, useReducer, useCallback } from 'react';
import { CognitoUser, CognitoUserPool, AuthenticationDetails } from 'amazon-cognito-identity-js';

import { paths } from 'src/routes/paths';

import {
  getEmployee,
  changeEmployeePassword,
  sendEmployeeVerificationCode,
} from 'src/api/employee';

import { useSnackbar } from 'src/components/snackbar';

import { AuthContext } from './auth-context';

const { VITE_API_COMIDIN } = import.meta.env;
const user_pool = import.meta.env.VITE_AWS_COGNITO_USER_POOL_ID;
const client_id = import.meta.env.VITE_AWS_COGNITO_CLIENT_ID;

// Configuración del User Pool de Cognito
const poolData = {
  UserPoolId: user_pool,
  ClientId: client_id,
};
const userPool = new CognitoUserPool(poolData);

// ----------------------------------------------------------------------

const initialState = {
  user: null,
  loading: true,
};

const reducer = (state, action) => {
  if (action.type === 'INITIAL') {
    return {
      loading: false,
      user: action.payload.user,
    };
  }
  if (action.type === 'LOGIN') {
    return {
      ...state,
      user: action.payload.user,
    };
  }
  if (action.type === 'REGISTER') {
    return {
      ...state,
      user: action.payload.user,
    };
  }
  if (action.type === 'LOGOUT') {
    return {
      ...state,
      user: null,
    };
  }
  return state;
};

// ----------------------------------------------------------------------

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const navigate = useNavigate();

  const { enqueueSnackbar } = useSnackbar();

  const initialize = useCallback(() => {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.getSession((sessionError, session) => {
        if (sessionError || !session.isValid()) {
          dispatch({ type: 'INITIAL', payload: { user: null } });
        } else {
          cognitoUser.getUserAttributes(async (attributesError, attributes) => {
            if (attributesError) {
              console.error(attributesError);
              dispatch({ type: 'INITIAL', payload: { user: null } });
            } else {
              const user = attributes.reduce((acc, attribute) => {
                acc[attribute.getName()] = attribute.getValue();
                return acc;
              }, {});
              const my_employee = await getEmployee(user.email);
              const info = my_employee.data;
              dispatch({
                type: 'INITIAL',
                payload: {
                  user: { ...user, accessToken: session.getIdToken().getJwtToken(), ...info },
                },
              });
            }
          });
        }
      });
    } else {
      dispatch({ type: 'INITIAL', payload: { user: null } });
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // LOGOUT
  const logout = useCallback(() => {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.signOut();
    }
    dispatch({ type: 'LOGOUT' });
  }, []);

  // FORGOT PASSWORD
  const forgotPassword = useCallback(
    (email) => {
      sendEmployeeVerificationCode(email);
      navigate(paths.auth.cognito.newPassword);
    },
    [navigate]
  );

  // LOGIN
  const login = useCallback(
    (email, password) =>
      new Promise((resolve, reject) => {
        const user = new CognitoUser({ Username: email, Pool: userPool });
        const authDetails = new AuthenticationDetails({
          Username: email,
          Password: password,
        });

        user.authenticateUser(authDetails, {
          onSuccess: async (session) => {
            try {
              const accessToken = session.getIdToken().getJwtToken();
              const my_employee = await getEmployee(email);

              if (my_employee.data.commerce.status !== 'admitted') {
                user.signOut();
                navigate(paths.unauthorizedCommerce);
                resolve({ redirected: true });
                return;
              }

              const info = my_employee.data;

              user.getUserAttributes((err, attributes) => {
                if (err) {
                  console.error(err);
                  reject(err);
                  return;
                }

                const userData = attributes.reduce((acc, attribute) => {
                  acc[attribute.getName()] = attribute.getValue();
                  return acc;
                }, {});

                dispatch({
                  type: 'LOGIN',
                  payload: { user: { ...userData, accessToken, ...info } },
                });

                resolve({ redirected: false });
              });
            } catch (e) {
              reject(e);
            }
          },

          onFailure: (err) => {
            console.error(err);
            reject(err);
          },

          newPasswordRequired: () => {
            getEmployee(email).then((my_employee) => {
              if (my_employee.data.commerce.status !== 'admitted') {
                user.signOut();
                navigate(paths.unauthorizedCommerce);
                resolve({ redirected: true });
              } else {
                sendEmployeeVerificationCode(email);
                navigate(paths.auth.cognito.newPassword);
                resolve({ redirected: true });
              }
            });
          },
        });
      }),
    [navigate]
  );

  // REGISTER
  const register = useCallback(
    async (commerce) => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));

        const url = `${VITE_API_COMIDIN}/employee`;
        const method = 'POST';

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(commerce),
        });

        if (!response.ok) {
          throw new Error('Error al enviar los datos');
        }

        const responseData = await response.json();
        console.log('Respuesta del servidor:', responseData);

        enqueueSnackbar('Create success!');
        navigate(paths.unauthorizedCommerce);
        console.info('DATA', commerce);
      } catch (error) {
        console.error(error);
      }
    },
    [navigate, enqueueSnackbar]
  );

  // CONFIRM NEW PASSWORD
  const confirmPassword = useCallback(async (email, code, newPassword) => {
    await changeEmployeePassword(email, code, newPassword);
  }, []);


  // CONFIRM RESET PASSWORD

  // RESEND CONFIRMATION CODE
  const resendConfirmationCode = useCallback(async (email) => {
    try {
      await sendEmployeeVerificationCode(email);
      console.log('Verification code sent successfully');
    } catch (error) {
      console.error('Error sending verification code:', error);
    }
  }, []);

  // ----------------------------------------------------------------------

  const checkAuthenticated = state.user ? 'authenticated' : 'unauthenticated';

  const status = state.loading ? 'loading' : checkAuthenticated;

  const memoizedValue = useMemo(
    () => ({
      user: state.user,
      method: 'cognito',
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
      //
      login,
      register,
      logout,
      forgotPassword,
      confirmPassword,
      resendConfirmationCode,
    }),
    [
      login,
      logout,
      register,
      forgotPassword,
      confirmPassword,
      resendConfirmationCode,
      state.user,
      status,
    ]
  );

  return <AuthContext.Provider value={memoizedValue}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node,
};
