import PropTypes from 'prop-types';
import { useMemo, useEffect, useReducer, useCallback } from 'react';
import { paths } from 'src/routes/paths';
import { useNavigate } from 'react-router-dom';

import axios, { endpoints } from 'src/utils/axios';
import {
  sendEmployeeVerificationCode,
  useGetEmployee,
  changeEmployeePassword,
} from 'src/api/employee';
import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js';

import { AuthContext } from './auth-context';

const user_pool = import.meta.env.VITE_AWS_COGNITO_USER_POOL_ID;
const client_id = import.meta.env.VITE_AWS_COGNITO_CLIENT_ID;

// Configuración del User Pool de Cognito
const poolData = {
  UserPoolId: user_pool,
  ClientId: client_id,
};
const userPool = new CognitoUserPool(poolData);

const setSession = (serviceToken) => {
  if (serviceToken) {
    localStorage.setItem('serviceToken', serviceToken);
  } else {
    localStorage.removeItem('serviceToken');
  }
};

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

  const initialize = useCallback(() => {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.getSession((sessionError, session) => {
        if (sessionError || !session.isValid()) {
          dispatch({ type: 'INITIAL', payload: { user: null } });
        } else {
          cognitoUser.getUserAttributes((attributesError, attributes) => {
            if (attributesError) {
              console.error(attributesError);
              dispatch({ type: 'INITIAL', payload: { user: null } });
            } else {
              const user = attributes.reduce((acc, attribute) => {
                acc[attribute.getName()] = attribute.getValue();
                return acc;
              }, {});
              dispatch({
                type: 'INITIAL',
                payload: { user: { ...user, accessToken: session.getIdToken().getJwtToken() } },
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
      const user = new CognitoUser({ Username: email, Pool: userPool });
      user.forgotPassword({
        onSuccess: (data) => {
          console.log('Código enviado: ', data);
          navigate(paths.auth.cognito.newPassword);
        },
        onFailure: (err) => {
          console.error(err);
        },
      });
    },
    [navigate]
  );

  // LOGIN
  const login = useCallback(
    (email, password) => {
      const user = new CognitoUser({ Username: email, Pool: userPool });
      const authDetails = new AuthenticationDetails({ Username: email, Password: password });

      user.authenticateUser(authDetails, {
        onSuccess: (session) => {
          const accessToken = session.getIdToken().getJwtToken();
          user.getUserAttributes((err, attributes) => {
            if (err) {
              console.error(err);
              return;
            }
            const userData = attributes.reduce((acc, attribute) => {
              acc[attribute.getName()] = attribute.getValue();
              return acc;
            }, {});

            dispatch({
              type: 'LOGIN',
              payload: { user: { ...userData, accessToken } },
            });
          });
        },
        onFailure: (err) => {
          console.error(err);
        },
        newPasswordRequired: (session) => {
          console.log('Se requiere una nueva contraseña.');
          sendEmployeeVerificationCode(email);
          navigate(paths.auth.cognito.newPassword);
        },
      });
    },
    [navigate]
  );

  // REGISTER
  const register = useCallback((email, password, firstName, lastName) => {
    userPool.signUp(
      email,
      password,
      [
        { Name: 'given_name', Value: firstName },
        { Name: 'family_name', Value: lastName },
      ],
      null,
      (err, result) => {
        if (err) {
          console.error(err);
          return;
        }
        const cognitoUser = result.user;
        dispatch({
          type: 'REGISTER',
          payload: { user: { email: cognitoUser.getUsername() } },
        });
      }
    );
  }, []);

  // CONFIRM NEW PASSWORD
  const confirmPassword = useCallback((email, code, newPassword) => {
    changeEmployeePassword(email, code, newPassword);
  }, []);

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
