import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js';

const getPoolData = () => {
  return {
    UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'ap-south-1_jp3Rdi0UU',
    ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '7tliavfpsko0ugfrkidm8lj2te',
  };
};

let userPoolInstance = null;
const getUserPool = () => {
  if (!userPoolInstance) {
    const data = getPoolData();
    if (!data.UserPoolId || !data.ClientId) {
      console.warn('Cognito UserPoolId or ClientId not set in environment variables.');
    }
    userPoolInstance = new CognitoUserPool(data);
  }
  return userPoolInstance;
};

export const authService = {
  /**
   * Register a new user in Cognito User Pool
   */
  signUp: async (email, password, name, role = 'student', clubId = null) => {
    return new Promise((resolve, reject) => {
      const attributeList = [
        new CognitoUserAttribute({ Name: 'email', Value: email }),
        new CognitoUserAttribute({ Name: 'name', Value: name }),
        new CognitoUserAttribute({ Name: 'custom:role', Value: role }),
      ];

      if (clubId) {
        attributeList.push(new CognitoUserAttribute({ Name: 'custom:clubId', Value: clubId }));
      }

      getUserPool().signUp(email, password, attributeList, null, (err, result) => {
        if (err) {
          console.error('Cognito signUp error:', err);
          return reject(err);
        }
        resolve({
          user: result.user,
          userConfirmed: result.userConfirmed,
          sub: result.userSub,
        });
      });
    });
  },

  /**
   * Confirm email address with OTP code
   */
  confirmSignUp: async (email, code) => {
    return new Promise((resolve, reject) => {
      const user = new CognitoUser({
        Username: email,
        Pool: getUserPool(),
      });

      user.confirmRegistration(code, true, (err, result) => {
        if (err) {
          console.error('Cognito confirmRegistration error:', err);
          return reject(err);
        }
        resolve(result);
      });
    });
  },

  /**
   * Resend confirmation verification code
   */
  resendConfirmationCode: async (email) => {
    return new Promise((resolve, reject) => {
      const user = new CognitoUser({
        Username: email,
        Pool: getUserPool(),
      });

      user.resendConfirmationCode((err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  },

  /**
   * Authenticate user with email and password
   */
  signIn: async (email, password) => {
    return new Promise((resolve, reject) => {
      const authDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
      });

      const user = new CognitoUser({
        Username: email,
        Pool: getUserPool(),
      });

      user.authenticateUser(authDetails, {
        onSuccess: (session) => {
          resolve(authService.formatSession(session));
        },
        onFailure: (err) => {
          console.error('Cognito signIn error:', err);
          reject(err);
        },
        newPasswordRequired: (userAttributes) => {
          // In case admin created user and requires new password
          delete userAttributes.email_verified;
          user.completeNewPasswordChallenge(password, userAttributes, {
            onSuccess: (session) => resolve(authService.formatSession(session)),
            onFailure: (err) => reject(err),
          });
        },
      });
    });
  },

  /**
   * Sign out current user
   */
  signOut: () => {
    const user = getUserPool().getCurrentUser();
    if (user) {
      user.signOut();
    }
  },

  /**
   * Format session object and extract JWT claims
   */
  formatSession: (session) => {
    const idToken = session.getIdToken().getJwtToken();
    const accessToken = session.getAccessToken().getJwtToken();
    const claims = session.getIdToken().payload;
    const groups = claims['cognito:groups'] || [];
    const role = (Array.isArray(groups) && groups.includes('admin')) || claims['custom:role'] === 'admin'
      ? 'admin'
      : 'student';

    return {
      isValid: session.isValid(),
      idToken,
      accessToken,
      claims,
      sub: claims.sub,
      email: claims.email,
      name: claims.name || claims.fullname || claims.email || 'Campus User',
      groups: Array.isArray(groups) ? groups : [groups],
      role,
      clubId: claims['custom:clubId'] || null,
      avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(claims.sub || claims.email)}`,
    };
  },

  /**
   * Get current active session from storage
   */
  getCurrentSession: async () => {
    return new Promise((resolve) => {
      const user = getUserPool().getCurrentUser();
      if (!user) {
        return resolve(null);
      }

      user.getSession((err, session) => {
        if (err || !session || !session.isValid()) {
          return resolve(null);
        }
        resolve(authService.formatSession(session));
      });
    });
  },

  /**
   * Verify JWT against throwaway /whoami API Gateway endpoint
   */
  testWhoAmI: async () => {
    const session = await authService.getCurrentSession();
    if (!session || !session.idToken) {
      throw new Error('No active authenticated session.');
    }

    const apiUrl = (import.meta.env.VITE_HTTP_API_URL || 'https://k1f5xsammd.execute-api.ap-south-1.amazonaws.com/').replace(/\/$/, '') + '/whoami';
    const res = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        Authorization: session.idToken,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`WhoAmI failed (${res.status}): ${errText}`);
    }

    return await res.json();
  },
};
