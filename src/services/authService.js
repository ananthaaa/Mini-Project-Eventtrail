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
  signUp: async (email, password, name, role = 'student', clubId = null, gender = 'male') => {
    return new Promise((resolve, reject) => {
      // Cognito User Pool uses email as an ALIAS — Username must NOT be an email.
      // Generate a plain username; users will sign in via email alias.
      const username = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const rand = Math.floor(Math.random() * 3) + 1;
      const avatarPath = `images/avatars/${gender}${rand}.jpg`;

      const attributeList = [
        new CognitoUserAttribute({ Name: 'email', Value: email }),
        new CognitoUserAttribute({ Name: 'name', Value: name }),
        new CognitoUserAttribute({ Name: 'custom:role', Value: role }),
        new CognitoUserAttribute({ Name: 'gender', Value: gender }),
        new CognitoUserAttribute({ Name: 'picture', Value: avatarPath }),
      ];

      if (clubId) {
        attributeList.push(new CognitoUserAttribute({ Name: 'custom:clubId', Value: clubId }));
      }

      getUserPool().signUp(username, password, attributeList, null, (err, result) => {
        if (err) {
          console.error('Cognito signUp error:', err);
          return reject(err);
        }
        resolve({
          user: result.user,
          userConfirmed: result.userConfirmed,
          sub: result.userSub,
          // Store the generated username so confirmSignUp can use it
          username,
        });
      });
    });
  },

  /**
   * Confirm email address with OTP code
   */
  /**
   * Confirm email address with OTP code
   * @param {string} username - The generated username returned by signUp (NOT email)
   * @param {string} code - 6-digit OTP from email
   */
  confirmSignUp: async (username, code) => {
    return new Promise((resolve, reject) => {
      const user = new CognitoUser({
        Username: username,
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
   * @param {string} username - The generated username returned by signUp (NOT email)
   */
  resendConfirmationCode: async (username) => {
    return new Promise((resolve, reject) => {
      const user = new CognitoUser({
        Username: username,
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

    let avatar = claims.picture;
    if (!avatar || avatar.includes('pravatar.cc')) {
      const userGender = claims.gender || 'male';
      const rand = (claims.email ? claims.email.length : 1) % 3 + 1;
      avatar = `images/avatars/${userGender}${rand}.jpg`;
    }

    if (avatar.startsWith('/images/')) {
      avatar = import.meta.env.BASE_URL + avatar.substring(1);
    } else if (avatar.startsWith('images/')) {
      avatar = import.meta.env.BASE_URL + avatar;
    }

    return {
      isValid: session.isValid(),
      idToken,
      accessToken,
      claims,
      sub: claims.sub,
      email: claims.email,
      name: claims.name || claims.email || 'Campus User',
      groups: Array.isArray(groups) ? groups : [groups],
      role,
      clubId: claims['custom:clubId'] || null,
      avatar,
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
